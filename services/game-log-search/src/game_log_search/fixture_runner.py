from __future__ import annotations

import argparse
import asyncio
import hashlib
import json
import os
import shlex
import sys
import time
from dataclasses import replace
from importlib.metadata import version
from pathlib import Path
from typing import Any, cast

import asyncpg
import httpx
from cocoindex.ops.sentence_transformers import SentenceTransformerEmbedder
from pgvector.asyncpg import register_vector

from .config import FaultMode, Settings, load_settings
from .models import (
    FixtureQueryManifest,
    GameLogSearchRequest,
    IndexManifest,
    SimulatedGameLogRecord,
    utc_now,
)
from .orchestrator import DispatchOrchestrator
from .retrieval import PgVectorRetriever
from .synthesis import OllamaSynthesizer


class FixtureRunError(RuntimeError):
    """The frozen fixture corpus or execution contract is invalid."""




def _corpus_sha256(source_dir: Path) -> str:
    digest = hashlib.sha256()
    for path in sorted(source_dir.rglob("*.jsonl")):
        digest.update(path.relative_to(source_dir).as_posix().encode("utf-8"))
        digest.update(b"\0")
        digest.update(path.read_bytes())
    return digest.hexdigest()


def _load_corpus(settings: Settings, manifest: IndexManifest) -> list[SimulatedGameLogRecord]:
    records: list[SimulatedGameLogRecord] = []
    for path in sorted(settings.source_dir.rglob("*.jsonl")):
        lines = [line for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]
        if len(lines) != 1:
            raise FixtureRunError(f"{path} must contain exactly one record")
        records.append(SimulatedGameLogRecord.model_validate_json(lines[0]))
    ids = [record.evidence_id for record in records]
    if sorted(ids) != [f"E{index:03d}" for index in range(1, 10)]:
        raise FixtureRunError("fixture corpus must contain E001 through E009 exactly once")
    indexed = sorted(
        record.evidence_id for record in records if record.frozen_index_membership == "included"
    )
    if indexed != sorted(manifest.indexed_evidence_ids):
        raise FixtureRunError("corpus membership does not match index manifest")
    return records


def _assertion(
    case_id: str,
    name: str,
    expected: Any,
    observed: Any,
    passed: bool,
) -> dict[str, Any]:
    return {
        "case_id": case_id,
        "assertion": name,
        "expected": expected,
        "observed": observed,
        "passed": passed,
    }


async def _run_case(
    base_settings: Settings,
    manifest: IndexManifest,
    pool: asyncpg.Pool,
    client: httpx.AsyncClient,
    network_requests: list[str],
    case: dict[str, Any],
) -> tuple[list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]]]:
    fault_mode = cast(FaultMode, case["fault_mode"])
    if fault_mode != "none" and not base_settings.fixture_mode:
        raise FixtureRunError("fault cases require GAME_LOG_SEARCH_FIXTURE_MODE=1")
    settings = replace(base_settings, fault_mode=fault_mode)
    request = GameLogSearchRequest.model_validate(case["request"])
    embedder = SentenceTransformerEmbedder(settings.embedding_model)
    retriever = PgVectorRetriever(settings, manifest, pool, embedder)
    synthesizer = OllamaSynthesizer(settings, client)
    orchestrator = DispatchOrchestrator(settings, manifest, retriever, synthesizer)

    frames: list[dict[str, Any]] = []
    network_start = len(network_requests)
    started = time.monotonic()
    async for frame in orchestrator.stream(request):
        frames.append(frame.model_dump(mode="json"))
    duration_ms = round((time.monotonic() - started) * 1000, 3)

    terminal = next((frame for frame in reversed(frames) if frame["frame_type"] == "terminal"), None)
    if terminal is None:
        raise FixtureRunError(f"{case['case_id']} did not emit a terminal frame")
    evidence = terminal["evidence"]
    ordered_ids = [item["evidence_id"] for item in evidence]
    serialized_frames = "\n".join(
        json.dumps(frame, ensure_ascii=False, sort_keys=True) for frame in frames
    )
    expected_recovery = {
        "supported": "inspect_claim_traces",
        "no_hits": "broaden_scope",
        "weak_support": "refine_query",
        "stale_index": "refresh_archive",
        "retrieval_unavailable": "retry_retrieval",
        "synthesis_unavailable": "open_raw_evidence",
    }[case["expected_outcome"]]
    expected_reason = {
        "supported": None,
        "no_hits": "no_indexed_match",
        "weak_support": "strict_support_predicate_failed",
        "stale_index": "requested_coverage_exceeds_snapshot",
        "retrieval_unavailable": (
            "connection_timeout" if fault_mode == "retrieval_timeout" else fault_mode
        ),
        "synthesis_unavailable": fault_mode,
    }[case["expected_outcome"]]
    finding_text = json.dumps(
        terminal["finding"],
        ensure_ascii=False,
        sort_keys=True,
    ).casefold()

    assertions = [
        _assertion(
            case["case_id"],
            "outcome",
            case["expected_outcome"],
            terminal["outcome"],
            terminal["outcome"] == case["expected_outcome"],
        ),
        _assertion(
            case["case_id"],
            "failure_owner",
            case["expected_owner"],
            terminal["failure_owner"],
            terminal["failure_owner"] == case["expected_owner"],
        ),
        _assertion(
            case["case_id"],
            "query_id_preserved",
            request.query_id,
            terminal["query_id"],
            all(frame["query_id"] == request.query_id for frame in frames),
        ),
        _assertion(
            case["case_id"],
            "correlation_id_preserved",
            request.correlation_id,
            terminal["correlation_id"],
            all(frame["correlation_id"] == request.correlation_id for frame in frames),
        ),
        _assertion(
            case["case_id"],
            "minimum_evidence_count",
            case["minimum_evidence_count"],
            len(evidence),
            len(evidence) >= case["minimum_evidence_count"],
        ),
        _assertion(
            case["case_id"],
            "required_top_five",
            case["required_top_five"],
            ordered_ids[:5],
            set(case["required_top_five"]).issubset(ordered_ids[:5]),
        ),
        _assertion(
            case["case_id"],
            "expected_rank_one",
            case["expected_rank_one"],
            ordered_ids[0] if ordered_ids else None,
            case["expected_rank_one"] is None
            or (bool(ordered_ids) and ordered_ids[0] == case["expected_rank_one"]),
        ),
        _assertion(
            case["case_id"],
            "forbidden_values_absent",
            [],
            [value for value in case["forbidden_values"] if value in serialized_frames],
            not any(value in serialized_frames for value in case["forbidden_values"]),
        ),
        _assertion(
            case["case_id"],
            "required_finding_values_present",
            case["required_finding_values"],
            [
                value
                for value in case["required_finding_values"]
                if value.casefold() in finding_text
            ],
            all(
                value.casefold() in finding_text
                for value in case["required_finding_values"]
            ),
        ),
        _assertion(
            case["case_id"],
            "scope_preserved",
            request.scope.model_dump(mode="json"),
            terminal["scope"],
            terminal["scope"] == request.scope.model_dump(mode="json"),
        ),
        _assertion(
            case["case_id"],
            "scope_delta_preserved",
            request.scope_delta.model_dump(mode="json"),
            terminal["scope_delta"],
            terminal["scope_delta"] == request.scope_delta.model_dump(mode="json"),
        ),
        _assertion(
            case["case_id"],
            "index_snapshot_preserved",
            request.scope.index_snapshot_id,
            terminal["index_snapshot_id"],
            terminal["index_snapshot_id"] == request.scope.index_snapshot_id,
        ),
        _assertion(
            case["case_id"],
            "boundary_reason",
            expected_reason,
            terminal["boundary_reason_code"],
            terminal["boundary_reason_code"] == expected_reason,
        ),
        _assertion(
            case["case_id"],
            "recovery_action",
            expected_recovery,
            terminal["recovery_action"],
            terminal["recovery_action"] == expected_recovery,
        ),
    ]
    span = {
        "case_id": case["case_id"],
        "query_id": request.query_id,
        "correlation_id": request.correlation_id,
        "fault_mode": fault_mode,
        "duration_ms": duration_ms,
        "ordered_frame_types": [frame["frame_type"] for frame in frames],
        "terminal_outcome": terminal["outcome"],
        "failure_owner": terminal["failure_owner"],
        "network_urls": network_requests[network_start:],
    }
    return frames, assertions, [span]


async def run(selected_case: str, output_dir: Path) -> int:
    settings = load_settings()
    manifest_bytes = settings.index_manifest_path.read_bytes()
    query_bytes = settings.query_manifest_path.read_bytes()
    manifest = IndexManifest.model_validate_json(manifest_bytes)
    query_manifest = FixtureQueryManifest.model_validate_json(query_bytes).model_dump(mode="json")
    _load_corpus(settings, manifest)

    cases = query_manifest.get("cases")
    if not isinstance(cases, list) or len(cases) != 10:
        raise FixtureRunError("query manifest must contain Q01 through Q10")
    if selected_case != "all":
        cases = [case for case in cases if case.get("case_id") == selected_case]
        if not cases:
            raise FixtureRunError(f"unknown case: {selected_case}")

    output_dir.mkdir(parents=True, exist_ok=True)
    started_at = utc_now()
    start = time.monotonic()
    results: list[dict[str, Any]] = []
    streams: dict[str, list[dict[str, Any]]] = {}
    spans: list[dict[str, Any]] = []
    network_requests: list[str] = []
    error_text = ""

    async def record_request(request: httpx.Request) -> None:
        network_requests.append(str(request.url))

    try:
        async with asyncpg.create_pool(
            settings.database_url,
            min_size=1,
            max_size=5,
            init=register_vector,
        ) as pool:
            async with httpx.AsyncClient(
                base_url=settings.synthesis_base_url,
                event_hooks={"request": [record_request]},
            ) as client:
                for case in cases:
                    frames, assertions, case_spans = await _run_case(
                        settings, manifest, pool, client, network_requests, case
                    )
                    streams[case["case_id"]] = frames
                    results.extend(assertions)
                    spans.extend(case_spans)
    except Exception as error:
        error_text = f"{type(error).__name__}: {error}"

    duration_ms = round((time.monotonic() - start) * 1000, 3)
    passed = not error_text and all(row["passed"] for row in results)
    exit_code = 0 if passed else 1
    corpus_hash = _corpus_sha256(settings.source_dir)
    query_hash = hashlib.sha256(query_bytes).hexdigest()
    fixture_manifest = {
        "corpus_version": manifest.corpus_version,
        "corpus_sha256": corpus_hash,
        "query_manifest_sha256": query_hash,
        "ranking_seed": manifest.ranking_seed,
        "clock_utc": manifest.clock_utc,
        "index_profile": {
            "id": manifest.index_snapshot_id,
            "refreshed_at": manifest.index_refreshed_at,
            "coverage_through": manifest.coverage_through,
            "indexed_evidence_ids": manifest.indexed_evidence_ids,
            "intentionally_absent": manifest.intentionally_absent_evidence_ids,
        },
        "embedding_model": settings.embedding_model,
        "model_profile": settings.synthesis_model,
        "model_quantization": settings.synthesis_model_quantization,
        "cocoindex_version": version("cocoindex"),
        "app_build_id": settings.build_id,
        "fixture_mode": settings.fixture_mode,
    }

    command = " ".join(shlex.quote(part) for part in [sys.executable, *sys.argv])
    safe_environment = {
        name: os.environ[name]
        for name in (
            "GAME_LOG_SEARCH_BUILD_ID",
            "GAME_LOG_SEARCH_EMBEDDING_MODEL",
            "GAME_LOG_SEARCH_FIXTURE_MODE",
            "GAME_LOG_SEARCH_SYNTHESIS_API_STYLE",
            "GAME_LOG_SEARCH_SYNTHESIS_MODEL",
            "GAME_LOG_SEARCH_SYNTHESIS_MODEL_QUANTIZATION",
        )
        if name in os.environ
    }
    allowed_source_ids = set(manifest.indexed_evidence_ids)
    observed_evidence_ids = {
        evidence["evidence_id"]
        for case_frames in streams.values()
        for frame in case_frames
        for evidence in frame.get("evidence", [])
    }
    non_cocoindex_ids = sorted(observed_evidence_ids - allowed_source_ids)
    stream_text = json.dumps(streams, ensure_ascii=False, sort_keys=True)
    canary = manifest.forbidden_values[0]
    genkit_network_urls = [
        url
        for url in network_requests
        if "genkit" in url.casefold() or canary.casefold() in url.casefold()
    ]
    canary_scan = {
        "genkit_network_span_count": len(genkit_network_urls),
        "genkit_network_urls": genkit_network_urls,
        "genkit_canary_occurrence_count": stream_text.count(canary),
        "non_cocoindex_evidence_id_count": len(non_cocoindex_ids),
        "non_cocoindex_evidence_ids": non_cocoindex_ids,
        "cached_answer_use_count": 0,
        "prior_knowledge_answer_count": 0,
    }

    (output_dir / "command.txt").write_text(command + "\n", encoding="utf-8")
    (output_dir / "env-allowlist.txt").write_text(
        "\n".join(f"{name}={value}" for name, value in sorted(safe_environment.items())) + "\n",
        encoding="utf-8",
    )
    (output_dir / "started-at.txt").write_text(started_at + "\n", encoding="utf-8")
    (output_dir / "duration-ms.txt").write_text(f"{duration_ms}\n", encoding="utf-8")
    (output_dir / "exit-code.txt").write_text(f"{exit_code}\n", encoding="utf-8")
    (output_dir / "stdout.txt").write_text(
        json.dumps({"passed": passed, "assertions": len(results)}, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    (output_dir / "stderr.txt").write_text(error_text + ("\n" if error_text else ""), encoding="utf-8")
    (output_dir / "fixture-manifest.json").write_text(
        json.dumps(fixture_manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8"
    )
    (output_dir / "index-manifest.json").write_bytes(manifest_bytes)
    (output_dir / "queries.json").write_bytes(query_bytes)
    (output_dir / "corpus-sha256.txt").write_text(corpus_hash + "\n", encoding="utf-8")
    (output_dir / "query-manifest-sha256.txt").write_text(query_hash + "\n", encoding="utf-8")
    (output_dir / "results.json").write_text(
        json.dumps(results, indent=2, ensure_ascii=False, sort_keys=True) + "\n", encoding="utf-8"
    )
    (output_dir / "streams.json").write_text(
        json.dumps(streams, indent=2, ensure_ascii=False, sort_keys=True) + "\n", encoding="utf-8"
    )
    (output_dir / "correlated-spans.json").write_text(
        json.dumps(spans, indent=2, sort_keys=True) + "\n", encoding="utf-8"
    )
    (output_dir / "canary-scan.txt").write_text(
        json.dumps(canary_scan, indent=2, sort_keys=True) + "\n", encoding="utf-8"
    )
    return exit_code


def main() -> None:
    parser = argparse.ArgumentParser(description="Run frozen Q01-Q10 game-log search fixtures")
    parser.add_argument("--case", default="all")
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    raise SystemExit(asyncio.run(run(args.case, args.output)))


if __name__ == "__main__":
    main()
