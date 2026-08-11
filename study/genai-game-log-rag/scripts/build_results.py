#!/usr/bin/env python3
"""Rebuild auditable tables and vector figures for the FunQA vertical-slice study.

Run from the repository root:
    python3 study/genai-game-log-rag/scripts/build_results.py

The script uses only the Python standard library. It rejects profile, quantization,
manifest, corpus-hash, query-hash, stream, assertion, and provenance inconsistencies
before writing derived outputs. Raw artifacts remain authoritative.
"""
from __future__ import annotations

import csv
import hashlib
import json
import math
import re
import sys
from collections import Counter
from pathlib import Path
from typing import Any, Iterable

EXPECTED_RUNS = (
    (
        "qwen2.5:0.5b",
        Path("_workspace/current/qa/evidence/stage-1/fixture-run-qwen0_5b-schema"),
    ),
    (
        "qwen2.5:1.5b",
        Path("_workspace/current/qa/evidence/stage-1/fixture-run-qwen1_5b"),
    ),
    (
        "qwen2.5:3b",
        Path("_workspace/current/qa/evidence/stage-1/fixture-run-qwen3b"),
    ),
)
EXPECTED_QUANTIZATION = "Q4_K_M"
EXPECTED_ASSERTIONS = (
    "outcome",
    "failure_owner",
    "query_id_preserved",
    "correlation_id_preserved",
    "minimum_evidence_count",
    "required_top_five",
    "expected_rank_one",
    "forbidden_values_absent",
    "required_finding_values_present",
    "scope_preserved",
    "scope_delta_preserved",
    "index_snapshot_preserved",
    "boundary_reason",
    "recovery_action",
)
COMMON_PROFILE_FIELDS = (
    "app_build_id",
    "clock_utc",
    "cocoindex_version",
    "corpus_sha256",
    "corpus_version",
    "embedding_model",
    "fixture_mode",
    "index_profile",
    "query_manifest_sha256",
    "ranking_seed",
)
SYNTHESIS_CASES = {"Q01-exact-cooldown", "Q03-incident-root-cause"}
OUTCOME_OWNER = {
    "supported": "none",
    "no_hits": "none",
    "weak_support": "none",
    "stale_index": "retrieval",
    "retrieval_unavailable": "retrieval",
    "synthesis_unavailable": "synthesis",
}
EXPECTED_RECOVERY = {
    "supported": "inspect_claim_traces",
    "no_hits": "broaden_scope",
    "weak_support": "refine_query",
    "stale_index": "refresh_archive",
    "retrieval_unavailable": "retry_retrieval",
    "synthesis_unavailable": "open_raw_evidence",
}


class EvidenceError(RuntimeError):
    """Raised when raw evidence violates the frozen comparison contract."""


def fail(message: str) -> None:
    raise EvidenceError(message)


def require(condition: bool, message: str) -> None:
    if not condition:
        fail(message)


def load_json(path: Path) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        fail(f"cannot load JSON {path}: {error}")


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def corpus_sha256(source_dir: Path) -> str:
    digest = hashlib.sha256()
    paths = sorted(source_dir.rglob("*.jsonl"))
    require(bool(paths), f"no JSONL corpus records under {source_dir}")
    for path in paths:
        digest.update(path.relative_to(source_dir).as_posix().encode("utf-8"))
        digest.update(b"\0")
        digest.update(path.read_bytes())
    return digest.hexdigest()


def parse_env(path: Path) -> dict[str, str]:
    result: dict[str, str] = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        require("=" in line, f"malformed environment line in {path}: {line!r}")
        name, value = line.split("=", 1)
        require(name not in result, f"duplicate environment key {name} in {path}")
        result[name] = value
    return result


def write_csv(path: Path, rows: list[dict[str, Any]], fieldnames: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames, lineterminator="\n")
        writer.writeheader()
        for row in rows:
            writer.writerow({name: row.get(name, "") for name in fieldnames})


def json_cell(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def terminal_schema_valid(terminal: dict[str, Any]) -> bool:
    required = {
        "schema_version": str,
        "frame_type": str,
        "run_status": str,
        "outcome": str,
        "failure_owner": str,
        "confidence": str,
        "query_id": str,
        "correlation_id": str,
        "query_text": str,
        "scope": dict,
        "scope_delta": dict,
        "index_snapshot_id": str,
        "evidence": list,
        "recovery_action": str,
    }
    if any(key not in terminal or not isinstance(terminal[key], kind) for key, kind in required.items()):
        return False
    if terminal["schema_version"] != "game-log-search.v1":
        return False
    if terminal["frame_type"] != "terminal" or terminal["run_status"] != "completed":
        return False
    if terminal["outcome"] not in OUTCOME_OWNER:
        return False
    if terminal["failure_owner"] != OUTCOME_OWNER[terminal["outcome"]]:
        return False
    if terminal["recovery_action"] != EXPECTED_RECOVERY[terminal["outcome"]]:
        return False
    return True


def validate_finding(terminal: dict[str, Any], raw_path: Path) -> None:
    finding = terminal.get("finding")
    if terminal["outcome"] != "supported":
        require(finding is None, f"non-supported terminal publishes a finding: {raw_path}")
        return
    require(isinstance(finding, dict), f"supported terminal lacks finding: {raw_path}")
    claims = finding.get("claims")
    links = finding.get("claim_evidence_links")
    require(isinstance(claims, list) and claims, f"supported finding has no claims: {raw_path}")
    require(isinstance(links, list) and links, f"supported finding has no links: {raw_path}")
    evidence_ids = {item["evidence_id"] for item in terminal["evidence"]}
    claim_ids = [item.get("claim_id") for item in claims]
    require(claim_ids == [f"C{i}" for i in range(1, len(claims) + 1)], f"non-contiguous claim IDs: {raw_path}")
    supported_ids: set[str] = set()
    for link in links:
        require(link.get("claim_id") in claim_ids, f"link references unknown claim: {raw_path}")
        require(link.get("evidence_id") in evidence_ids, f"link escapes returned evidence: {raw_path}")
        if link.get("relation") == "supports":
            supported_ids.add(link["claim_id"])
    require(len(supported_ids) == len(claims), f"supported finding has an unsupported claim: {raw_path}")
    require(finding.get("material_claim_count") == len(claims), f"material count mismatch: {raw_path}")
    require(finding.get("supported_material_claim_count") == len(claims), f"supported count mismatch: {raw_path}")
    require(finding.get("unsupported_material_claim_count") == 0, f"unsupported count mismatch: {raw_path}")
    require(finding.get("claim_coverage") == 1.0, f"claim coverage mismatch: {raw_path}")


def expected_reason(case: dict[str, Any]) -> str | None:
    outcome = case["expected_outcome"]
    if outcome == "supported":
        return None
    if outcome == "no_hits":
        return "no_indexed_match"
    if outcome == "weak_support":
        return "strict_support_predicate_failed"
    if outcome == "stale_index":
        return "requested_coverage_exceeds_snapshot"
    if outcome == "retrieval_unavailable":
        return "connection_timeout" if case["fault_mode"] == "retrieval_timeout" else case["fault_mode"]
    if outcome == "synthesis_unavailable":
        return case["fault_mode"]
    fail(f"unknown expected outcome {outcome}")


def independent_assertions(case: dict[str, Any], frames: list[dict[str, Any]]) -> list[dict[str, Any]]:
    terminals = [frame for frame in frames if frame.get("frame_type") == "terminal"]
    require(len(terminals) == 1, f"{case['case_id']} must have exactly one terminal frame")
    terminal = terminals[0]
    evidence = terminal["evidence"]
    ordered_ids = [item["evidence_id"] for item in evidence]
    request = case["request"]
    serialized_frames = "\n".join(json.dumps(frame, ensure_ascii=False, sort_keys=True) for frame in frames)
    finding_text = json.dumps(terminal.get("finding"), ensure_ascii=False, sort_keys=True).casefold()
    observed_required = [
        value for value in case["required_finding_values"] if value.casefold() in finding_text
    ]
    forbidden_observed = [value for value in case["forbidden_values"] if value in serialized_frames]
    checks = (
        ("outcome", case["expected_outcome"], terminal["outcome"], terminal["outcome"] == case["expected_outcome"]),
        ("failure_owner", case["expected_owner"], terminal["failure_owner"], terminal["failure_owner"] == case["expected_owner"]),
        ("query_id_preserved", request["query_id"], terminal["query_id"], all(frame["query_id"] == request["query_id"] for frame in frames)),
        ("correlation_id_preserved", request["correlation_id"], terminal["correlation_id"], all(frame["correlation_id"] == request["correlation_id"] for frame in frames)),
        ("minimum_evidence_count", case["minimum_evidence_count"], len(evidence), len(evidence) >= case["minimum_evidence_count"]),
        ("required_top_five", case["required_top_five"], ordered_ids[:5], set(case["required_top_five"]).issubset(ordered_ids[:5])),
        ("expected_rank_one", case["expected_rank_one"], ordered_ids[0] if ordered_ids else None, case["expected_rank_one"] is None or (bool(ordered_ids) and ordered_ids[0] == case["expected_rank_one"])),
        ("forbidden_values_absent", [], forbidden_observed, not forbidden_observed),
        ("required_finding_values_present", case["required_finding_values"], observed_required, len(observed_required) == len(case["required_finding_values"])),
        ("scope_preserved", request["scope"], terminal["scope"], terminal["scope"] == request["scope"]),
        ("scope_delta_preserved", request["scope_delta"], terminal["scope_delta"], terminal["scope_delta"] == request["scope_delta"]),
        ("index_snapshot_preserved", request["scope"]["index_snapshot_id"], terminal["index_snapshot_id"], terminal["index_snapshot_id"] == request["scope"]["index_snapshot_id"]),
        ("boundary_reason", expected_reason(case), terminal.get("boundary_reason_code"), terminal.get("boundary_reason_code") == expected_reason(case)),
        ("recovery_action", EXPECTED_RECOVERY[case["expected_outcome"]], terminal["recovery_action"], terminal["recovery_action"] == EXPECTED_RECOVERY[case["expected_outcome"]]),
    )
    return [
        {
            "case_id": case["case_id"],
            "assertion": name,
            "expected": expected,
            "observed": observed,
            "passed": passed,
        }
        for name, expected, observed, passed in checks
    ]


def normalized_assertion(row: dict[str, Any]) -> tuple[str, str, str, bool]:
    return (
        row["case_id"],
        row["assertion"],
        json_cell(row["expected"]),
        json_cell(row["observed"]),
        bool(row["passed"]),
    )


def parse_cocoindex_stats(path: Path, phase: str) -> dict[str, Any]:
    text = path.read_text(encoding="utf-8")
    process_lines = [line for line in text.splitlines() if "process_log_file:" in line]
    require(process_lines, f"missing process_log_file statistics in {path}")
    line = process_lines[-1]
    total_match = re.search(r"process_log_file:\s*(\d+) total", line)
    require(total_match is not None, f"cannot parse total in {path}")
    counts = {"added": 0, "reprocessed": 0, "unchanged": 0}
    for count, label in re.findall(r"(\d+)\s+(added|reprocessed|unchanged)", line):
        counts[label] = int(count)
    elapsed_matches = re.findall(r"Elapsed:\s*([0-9.]+)s", text)
    require(elapsed_matches, f"missing elapsed observation in {path}")
    return {
        "phase": phase,
        "total_files": int(total_match.group(1)),
        **counts,
        "displayed_elapsed_s": float(elapsed_matches[-1]),
        "raw_path": path.as_posix(),
    }


def parse_target_row(path: Path) -> dict[str, Any]:
    text = path.read_text(encoding="utf-8")
    rows = [line for line in text.splitlines() if re.match(r"\s*E\d{3}\s*\|", line)]
    require(len(rows) == 1, f"expected exactly one target row in {path}")
    parts = [part.strip() for part in rows[0].split("|", 2)]
    require(len(parts) == 3 and re.fullmatch(r"[0-9a-f]{64}", parts[1]) is not None, f"malformed target row in {path}")
    return {
        "evidence_id": parts[0],
        "content_sha256": parts[1],
        "excerpt": parts[2],
        "raw_path": path.as_posix(),
    }


class PDF:
    """Tiny deterministic PDF 1.4 writer for vector-only study figures."""

    def __init__(self, width: float = 504, height: float = 270) -> None:
        self.width = width
        self.height = height
        self.commands: list[str] = []

    @staticmethod
    def esc(text: str) -> str:
        return text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")

    def text(self, x: float, y: float, value: str, size: float = 9, bold: bool = False, color: tuple[float, float, float] = (0, 0, 0)) -> None:
        font = "F2" if bold else "F1"
        self.commands.append(f"{color[0]:.3f} {color[1]:.3f} {color[2]:.3f} rg BT /{font} {size:.2f} Tf {x:.2f} {y:.2f} Td ({self.esc(value)}) Tj ET")

    def line(self, x1: float, y1: float, x2: float, y2: float, width: float = 0.7, color: tuple[float, float, float] = (0, 0, 0)) -> None:
        self.commands.append(f"{color[0]:.3f} {color[1]:.3f} {color[2]:.3f} RG {width:.2f} w {x1:.2f} {y1:.2f} m {x2:.2f} {y2:.2f} l S")

    def rect(self, x: float, y: float, w: float, h: float, fill: tuple[float, float, float], stroke: tuple[float, float, float] | None = None) -> None:
        command = f"{fill[0]:.3f} {fill[1]:.3f} {fill[2]:.3f} rg {x:.2f} {y:.2f} {w:.2f} {h:.2f} re f"
        self.commands.append(command)
        if stroke is not None:
            self.commands.append(f"{stroke[0]:.3f} {stroke[1]:.3f} {stroke[2]:.3f} RG 0.6 w {x:.2f} {y:.2f} {w:.2f} {h:.2f} re S")

    def save(self, path: Path) -> None:
        stream = ("\n".join(self.commands) + "\n").encode("latin-1", errors="replace")
        objects = [
            b"<< /Type /Catalog /Pages 2 0 R >>",
            b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
            f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {self.width:.2f} {self.height:.2f}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>".encode("ascii"),
            b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
            b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
            f"<< /Length {len(stream)} >>\nstream\n".encode("ascii") + stream + b"endstream",
        ]
        output = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
        offsets = [0]
        for index, obj in enumerate(objects, start=1):
            offsets.append(len(output))
            output.extend(f"{index} 0 obj\n".encode("ascii"))
            output.extend(obj)
            output.extend(b"\nendobj\n")
        xref = len(output)
        output.extend(f"xref\n0 {len(objects) + 1}\n".encode("ascii"))
        output.extend(b"0000000000 65535 f \n")
        for offset in offsets[1:]:
            output.extend(f"{offset:010d} 00000 n \n".encode("ascii"))
        output.extend(f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n".encode("ascii"))
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(output)


def make_assertion_figure(path: Path, summaries: list[dict[str, Any]], queries: list[dict[str, Any]]) -> None:
    pdf = PDF()
    dark = (0.12, 0.18, 0.24)
    blue = (0.00, 0.45, 0.70)
    green = (0.00, 0.62, 0.45)
    orange = (0.90, 0.50, 0.00)
    red = (0.80, 0.25, 0.20)
    gray = (0.88, 0.90, 0.92)
    pdf.text(22, 247, "Contract assertions and synthesis-dependent outcomes", 12, True, dark)
    pdf.text(22, 231, "One fixed ten-query run per Q4_K_M model arm; descriptive only", 8, False, (0.35, 0.38, 0.40))
    pdf.text(24, 207, "(a) Assertions passed (of 140)", 9, True, dark)
    x0, y0, maxw = 94, 142, 145
    for tick in (0, 70, 140):
        x = x0 + maxw * tick / 140
        pdf.line(x, y0 - 8, x, y0 + 57, 0.4, (0.75, 0.78, 0.80))
        pdf.text(x - 4, y0 - 20, str(tick), 7, False, (0.35, 0.38, 0.40))
    for idx, row in enumerate(summaries):
        y = y0 + 42 - idx * 22
        pdf.text(24, y + 2, row["model_profile"].replace("qwen2.5:", ""), 8, True, dark)
        pdf.rect(x0, y, maxw, 11, gray)
        width = maxw * int(row["assertions_passed"]) / 140
        pdf.rect(x0, y, width, 11, blue)
        pdf.text(x0 + width + 5, y + 2, str(row["assertions_passed"]), 8, True, dark)
    pdf.text(275, 207, "(b) Q01/Q03 terminal result", 9, True, dark)
    qmap = {(row["model_profile"], row["case_id"]): row for row in queries}
    for col, case in enumerate(("Q01-exact-cooldown", "Q03-incident-root-cause")):
        pdf.text(359 + col * 65, 185, case[:3], 8, True, dark)
    for idx, summary in enumerate(summaries):
        y = 157 - idx * 38
        pdf.text(278, y + 8, summary["model_profile"].replace("qwen2.5:", ""), 8, True, dark)
        for col, case in enumerate(("Q01-exact-cooldown", "Q03-incident-root-cause")):
            row = qmap[(summary["model_profile"], case)]
            status = row["observed_outcome"]
            color = green if status == "supported" else orange if status == "synthesis_unavailable" else red
            x = 356 + col * 65
            pdf.rect(x, y, 52, 24, color)
            label = "supported" if status == "supported" else "timeout" if row["boundary_reason"] == "synthesis_timeout" else "strict fail"
            pdf.text(x + 5, y + 8, label, 7, True, (1, 1, 1))
    pdf.rect(280, 47, 10, 8, green); pdf.text(295, 47, "supported", 7, False, dark)
    pdf.rect(348, 47, 10, 8, orange); pdf.text(363, 47, "timeout / schema unobserved", 7, False, dark)
    pdf.rect(462, 47, 10, 8, red); pdf.text(477, 47, "strict", 7, False, dark)
    pdf.text(22, 18, "Source: results/run_summary.csv and results/query_results.csv; raw paths are retained in every row.", 7, False, (0.35, 0.38, 0.40))
    pdf.save(path)


def make_latency_figure(path: Path, queries: list[dict[str, Any]]) -> None:
    pdf = PDF()
    dark = (0.12, 0.18, 0.24)
    colors = ((0.00, 0.45, 0.70), (0.00, 0.62, 0.45), (0.90, 0.50, 0.00))
    pdf.text(22, 247, "Observed whole-case latency for synthesis-dependent queries", 12, True, dark)
    pdf.text(22, 231, "Single observations; fixture setup is included; no error bars or percentile claims", 8, False, (0.35, 0.38, 0.40))
    rows = [row for row in queries if row["case_id"] in SYNTHESIS_CASES]
    profiles = [profile for profile, _ in EXPECTED_RUNS]
    cases = ["Q01-exact-cooldown", "Q03-incident-root-cause"]
    values = {(row["model_profile"], row["case_id"]): float(row["duration_ms"]) / 1000 for row in rows}
    x0, y0, plotw, ploth = 58, 54, 414, 145
    maxv = 35.0
    for tick in range(0, 36, 5):
        y = y0 + ploth * tick / maxv
        pdf.line(x0, y, x0 + plotw, y, 0.35, (0.82, 0.84, 0.86))
        pdf.text(34, y - 2, str(tick), 7, False, (0.35, 0.38, 0.40))
    pdf.text(14, 128, "seconds", 8, True, dark)
    group_centers = (170, 363)
    barw = 34
    for case_idx, case in enumerate(cases):
        center = group_centers[case_idx]
        pdf.text(center - 34, 33, case[:3], 9, True, dark)
        for model_idx, profile in enumerate(profiles):
            value = values[(profile, case)]
            x = center - 58 + model_idx * 43
            h = ploth * value / maxv
            pdf.rect(x, y0, barw, h, colors[model_idx])
            pdf.text(x + 4, y0 + h + 5, f"{value:.1f}", 7, True, dark)
    for idx, profile in enumerate(profiles):
        x = 108 + idx * 128
        pdf.rect(x, 214, 10, 8, colors[idx])
        pdf.text(x + 15, 214, profile.replace("qwen2.5:", ""), 8, False, dark)
    pdf.text(22, 18, "Source: results/query_results.csv (duration_ms); each row links correlated-spans.json.", 7, False, (0.35, 0.38, 0.40))
    pdf.save(path)


def make_incremental_figure(path: Path, rows: list[dict[str, Any]]) -> None:
    pdf = PDF()
    dark = (0.12, 0.18, 0.24)
    added = (0.00, 0.45, 0.70)
    changed = (0.90, 0.50, 0.00)
    unchanged = (0.70, 0.72, 0.74)
    pdf.text(22, 247, "Isolated CocoIndex incremental-flow observations", 12, True, dark)
    pdf.text(22, 231, "Nine input files; one baseline, one no-op, and one one-change execution", 8, False, (0.35, 0.38, 0.40))
    x0, y0, maxw = 154, 158, 280
    for tick in (0, 3, 6, 9):
        x = x0 + maxw * tick / 9
        pdf.line(x, y0 - 78, x, y0 + 28, 0.35, (0.82, 0.84, 0.86))
        pdf.text(x - 3, y0 - 91, str(tick), 7, False, (0.35, 0.38, 0.40))
    for idx, row in enumerate(rows):
        y = y0 + 10 - idx * 35
        pdf.text(28, y + 3, row["phase"], 9, True, dark)
        cursor = x0
        for key, color in (("added", added), ("reprocessed", changed), ("unchanged", unchanged)):
            width = maxw * int(row[key]) / 9
            if width:
                pdf.rect(cursor, y, width, 18, color)
                if width > 22:
                    pdf.text(cursor + width / 2 - 3, y + 5, str(row[key]), 8, True, (1, 1, 1))
                cursor += width
        pdf.text(444, y + 4, f"{float(row['displayed_elapsed_s']):.1f}s", 8, False, dark)
    for idx, (label, color) in enumerate((("added", added), ("reprocessed", changed), ("unchanged", unchanged))):
        x = 110 + idx * 115
        pdf.rect(x, 45, 10, 8, color)
        pdf.text(x + 15, 45, label, 8, False, dark)
    pdf.text(22, 18, "Source: results/cocoindex_incremental.csv; elapsed values are tool-displayed single observations.", 7, False, (0.35, 0.38, 0.40))
    pdf.save(path)


def build(repo_root: Path) -> None:
    study = repo_root / "study/genai-game-log-rag"
    results_dir = study / "results"
    figures_dir = study / "figures"
    corpus_dir = repo_root / "services/game-log-search/fixtures/sim-game-logs-v1/logs"
    current_corpus_hash = corpus_sha256(corpus_dir)
    corpus_record_count = len(list(corpus_dir.rglob("*.jsonl")))
    require(corpus_record_count == 9, "frozen corpus must contain exactly nine JSONL records")

    run_summaries: list[dict[str, Any]] = []
    query_rows: list[dict[str, Any]] = []
    assertion_rows: list[dict[str, Any]] = []
    retrieval_rows: list[dict[str, Any]] = []
    canary_rows: list[dict[str, Any]] = []
    reference_common: dict[str, Any] | None = None

    for model_profile, relative_run in EXPECTED_RUNS:
        run_dir = repo_root / relative_run
        required_files = (
            "fixture-manifest.json", "index-manifest.json", "queries.json", "results.json",
            "streams.json", "correlated-spans.json", "canary-scan.txt", "corpus-sha256.txt",
            "query-manifest-sha256.txt", "duration-ms.txt", "exit-code.txt", "command.txt",
            "env-allowlist.txt", "stdout.txt", "stderr.txt", "started-at.txt",
        )
        for name in required_files:
            require((run_dir / name).is_file(), f"missing raw artifact {run_dir / name}")

        fixture = load_json(run_dir / "fixture-manifest.json")
        index_manifest = load_json(run_dir / "index-manifest.json")
        query_manifest = load_json(run_dir / "queries.json")
        raw_assertions = load_json(run_dir / "results.json")
        streams = load_json(run_dir / "streams.json")
        spans = load_json(run_dir / "correlated-spans.json")
        canary = load_json(run_dir / "canary-scan.txt")
        env = parse_env(run_dir / "env-allowlist.txt")

        require(fixture["model_profile"] == model_profile, f"profile mismatch in {run_dir}")
        require(fixture["model_quantization"] == EXPECTED_QUANTIZATION, f"quantization mismatch in {run_dir}")
        require(env.get("GAME_LOG_SEARCH_SYNTHESIS_MODEL") == model_profile, f"environment profile mismatch in {run_dir}")
        require(env.get("GAME_LOG_SEARCH_SYNTHESIS_MODEL_QUANTIZATION") == EXPECTED_QUANTIZATION, f"environment quantization mismatch in {run_dir}")
        require(fixture["fixture_mode"] is True, f"fixture mode disabled in {run_dir}")

        copied_query_hash = sha256_bytes((run_dir / "queries.json").read_bytes())
        require(copied_query_hash == fixture["query_manifest_sha256"], f"copied query hash mismatch in {run_dir}")
        require((run_dir / "query-manifest-sha256.txt").read_text(encoding="utf-8").strip() == copied_query_hash, f"query hash file mismatch in {run_dir}")
        require((run_dir / "corpus-sha256.txt").read_text(encoding="utf-8").strip() == fixture["corpus_sha256"], f"corpus hash file mismatch in {run_dir}")
        require(current_corpus_hash == fixture["corpus_sha256"], f"current corpus hash differs from raw run {run_dir}")
        require(query_manifest["corpus_version"] == fixture["corpus_version"], f"query corpus version mismatch in {run_dir}")
        require(query_manifest["index_snapshot_id"] == fixture["index_profile"]["id"], f"query snapshot mismatch in {run_dir}")
        require(index_manifest["index_snapshot_id"] == fixture["index_profile"]["id"], f"index snapshot mismatch in {run_dir}")
        require(index_manifest["indexed_evidence_ids"] == fixture["index_profile"]["indexed_evidence_ids"], f"index membership mismatch in {run_dir}")
        require(index_manifest["intentionally_absent_evidence_ids"] == fixture["index_profile"]["intentionally_absent"], f"absent membership mismatch in {run_dir}")

        common = {key: fixture[key] for key in COMMON_PROFILE_FIELDS}
        if reference_common is None:
            reference_common = common
        else:
            require(common == reference_common, f"cross-arm profile/hash inconsistency in {run_dir}")

        cases = query_manifest.get("cases")
        require(isinstance(cases, list) and len(cases) == 10, f"expected ten cases in {run_dir}")
        cases_by_id = {case["case_id"]: case for case in cases}
        require(len(cases_by_id) == 10, f"duplicate case IDs in {run_dir}")
        require(set(streams) == set(cases_by_id), f"stream/query case mismatch in {run_dir}")
        require(isinstance(spans, list) and len(spans) == 10, f"expected ten spans in {run_dir}")
        spans_by_id = {span["case_id"]: span for span in spans}
        require(len(spans_by_id) == 10 and set(spans_by_id) == set(cases_by_id), f"span/query case mismatch in {run_dir}")

        independent: list[dict[str, Any]] = []
        wire_failures = 0
        schema_counts: Counter[str] = Counter()
        semantic_strictness_failures = 0
        strict_supported = 0
        strict_total = 0
        retrieval_required_numerator = 0
        retrieval_required_denominator = 0

        for case in cases:
            case_id = case["case_id"]
            frames = streams[case_id]
            require(isinstance(frames, list) and frames, f"empty stream for {case_id} in {run_dir}")
            terminal = [frame for frame in frames if frame.get("frame_type") == "terminal"][-1]
            schema_ok = terminal_schema_valid(terminal)
            if not schema_ok:
                wire_failures += 1
            require(schema_ok, f"terminal wire-schema invariant failed for {case_id} in {run_dir}")
            validate_finding(terminal, relative_run / "streams.json")
            require(terminal["query_id"] == case["request"]["query_id"], f"query identity mismatch for {case_id}")
            require(terminal["correlation_id"] == case["request"]["correlation_id"], f"correlation identity mismatch for {case_id}")
            evidence_ids = [item["evidence_id"] for item in terminal["evidence"]]
            allowed_ids = set(index_manifest["indexed_evidence_ids"])
            require(set(evidence_ids).issubset(allowed_ids), f"non-indexed evidence in {case_id} of {run_dir}")
            for item in terminal["evidence"]:
                require(re.fullmatch(r"[0-9a-f]{64}", item["content_sha256"]) is not None, f"invalid evidence hash in {case_id}")
                require(item["query_id"] == terminal["query_id"] and item["correlation_id"] == terminal["correlation_id"], f"evidence identity mismatch in {case_id}")
                require(item["index_snapshot_id"] == fixture["index_profile"]["id"], f"evidence snapshot mismatch in {case_id}")
            if terminal.get("model_profile_id") is not None:
                require(terminal["model_profile_id"] == model_profile, f"terminal model profile mismatch in {case_id}")
                require(terminal["model_quantization"] == EXPECTED_QUANTIZATION, f"terminal quantization mismatch in {case_id}")

            rows = independent_assertions(case, frames)
            independent.extend(rows)
            raw_for_case = [row for row in raw_assertions if row["case_id"] == case_id]
            require(len(raw_for_case) == len(EXPECTED_ASSERTIONS), f"raw assertion count mismatch for {case_id}")
            require({row["assertion"] for row in raw_for_case} == set(EXPECTED_ASSERTIONS), f"raw assertion taxonomy mismatch for {case_id}")
            require(sorted(map(normalized_assertion, rows)) == sorted(map(normalized_assertion, raw_for_case)), f"independent assertion mismatch for {case_id} in {run_dir}")

            if case_id in SYNTHESIS_CASES:
                strict_total += 1
                if terminal["outcome"] == "supported":
                    schema_status = "valid"
                    semantic_status = "accepted"
                    strict_supported += 1
                elif terminal.get("boundary_reason_code") == "malformed_synthesis":
                    schema_status = "invalid"
                    semantic_status = "not_evaluated"
                elif terminal["outcome"] == "weak_support":
                    schema_status = "valid"
                    semantic_status = "rejected"
                    semantic_strictness_failures += 1
                else:
                    schema_status = "not_observed"
                    semantic_status = "not_evaluated"
                schema_counts[schema_status] += 1
            else:
                schema_status = "not_applicable"
                semantic_status = "not_applicable"

            span = spans_by_id[case_id]
            require(span["query_id"] == terminal["query_id"] and span["correlation_id"] == terminal["correlation_id"], f"span identity mismatch for {case_id}")
            require(span["terminal_outcome"] == terminal["outcome"] and span["failure_owner"] == terminal["failure_owner"], f"span terminal mismatch for {case_id}")
            require(float(span["duration_ms"]) >= 0, f"negative duration for {case_id}")
            failed_names = [row["assertion"] for row in rows if not row["passed"]]
            query_rows.append({
                "model_profile": model_profile,
                "model_quantization": EXPECTED_QUANTIZATION,
                "case_id": case_id,
                "query_id": terminal["query_id"],
                "correlation_id": terminal["correlation_id"],
                "fault_mode": case["fault_mode"],
                "expected_outcome": case["expected_outcome"],
                "observed_outcome": terminal["outcome"],
                "expected_owner": case["expected_owner"],
                "observed_owner": terminal["failure_owner"],
                "boundary_reason": terminal.get("boundary_reason_code"),
                "recovery_action": terminal["recovery_action"],
                "duration_ms": f"{float(span['duration_ms']):.3f}",
                "ordered_evidence_ids": ";".join(evidence_ids),
                "assertions_passed": sum(bool(row["passed"]) for row in rows),
                "assertions_total": len(rows),
                "failed_assertions": ";".join(failed_names),
                "terminal_schema_valid": int(schema_ok),
                "synthesis_schema_status": schema_status,
                "semantic_strictness_status": semantic_status,
                "evidence_input_tokens": terminal.get("evidence_input_tokens"),
                "output_tokens": terminal.get("output_tokens"),
                "raw_run_path": relative_run.as_posix(),
                "raw_stream_path": (relative_run / "streams.json").as_posix(),
                "raw_span_path": (relative_run / "correlated-spans.json").as_posix(),
                "raw_assertion_path": (relative_run / "results.json").as_posix(),
            })

            required = case["required_top_five"]
            top_five = evidence_ids[:5]
            numerator = len(set(required) & set(top_five))
            retrieval_required_numerator += numerator
            retrieval_required_denominator += len(required)
            rank_one_expected = case["expected_rank_one"]
            reciprocal_rank = ""
            exact_rank = ""
            if rank_one_expected is not None:
                exact_rank_value = evidence_ids.index(rank_one_expected) + 1 if rank_one_expected in evidence_ids else 0
                exact_rank = exact_rank_value
                reciprocal_rank = f"{(1 / exact_rank_value if exact_rank_value else 0):.6f}"
            retrieval_rows.append({
                "model_profile": model_profile,
                "case_id": case_id,
                "required_top_five": ";".join(required),
                "ordered_top_five": ";".join(top_five),
                "recall_at_5_numerator": numerator,
                "recall_at_5_denominator": len(required),
                "expected_rank_one": rank_one_expected,
                "exact_id_rank": exact_rank,
                "reciprocal_rank": reciprocal_rank,
                "index_snapshot_id": terminal["index_snapshot_id"],
                "raw_stream_path": (relative_run / "streams.json").as_posix(),
            })

        require(len(independent) == 140, f"independent assertion total is not 140 in {run_dir}")
        require(len(raw_assertions) == 140, f"raw assertion total is not 140 in {run_dir}")
        passed_count = sum(bool(row["passed"]) for row in independent)
        failed_count = len(independent) - passed_count
        outcome_rows = [row for row in independent if row["assertion"] == "outcome"]
        assertion_type_counts = Counter(row["assertion"] for row in independent if row["passed"])
        runner_duration = float((run_dir / "duration-ms.txt").read_text(encoding="utf-8").strip())
        exit_code = int((run_dir / "exit-code.txt").read_text(encoding="utf-8").strip())
        require(exit_code == (0 if failed_count == 0 else 1), f"exit-code/assertion mismatch in {run_dir}")
        require((run_dir / "stderr.txt").read_text(encoding="utf-8") == "", f"unexpected runner-level stderr in {run_dir}")

        run_summaries.append({
            "model_profile": model_profile,
            "model_quantization": EXPECTED_QUANTIZATION,
            "corpus_version": fixture["corpus_version"],
            "corpus_sha256": fixture["corpus_sha256"],
            "query_manifest_sha256": fixture["query_manifest_sha256"],
            "index_snapshot_id": fixture["index_profile"]["id"],
            "embedding_model": fixture["embedding_model"],
            "cocoindex_version": fixture["cocoindex_version"],
            "corpus_record_count": corpus_record_count,
            "indexed_record_count": len(fixture["index_profile"]["indexed_evidence_ids"]),
            "query_count": len(cases),
            "synthesis_case_count": strict_total,
            "assertions_passed": passed_count,
            "assertions_failed": failed_count,
            "assertions_total": len(independent),
            "outcomes_correct": sum(bool(row["passed"]) for row in outcome_rows),
            "outcomes_total": len(outcome_rows),
            "required_top_five_passed": assertion_type_counts["required_top_five"],
            "expected_rank_one_passed": assertion_type_counts["expected_rank_one"],
            "recall_at_5_numerator": retrieval_required_numerator,
            "recall_at_5_denominator": retrieval_required_denominator,
            "strict_supported_cases": strict_supported,
            "strict_synthesis_cases": strict_total,
            "terminal_schema_failures": wire_failures,
            "synthesis_schema_valid": schema_counts["valid"],
            "synthesis_schema_invalid": schema_counts["invalid"],
            "synthesis_schema_unobserved": schema_counts["not_observed"],
            "semantic_strictness_failures": semantic_strictness_failures,
            "runner_duration_ms": f"{runner_duration:.3f}",
            "exit_code": exit_code,
            "raw_run_path": relative_run.as_posix(),
        })

        for row in independent:
            assertion_rows.append({
                "model_profile": model_profile,
                "model_quantization": EXPECTED_QUANTIZATION,
                "case_id": row["case_id"],
                "assertion": row["assertion"],
                "expected_json": json_cell(row["expected"]),
                "observed_json": json_cell(row["observed"]),
                "passed": int(bool(row["passed"])),
                "raw_path": (relative_run / "results.json").as_posix(),
            })

        canary_required = {
            "genkit_network_span_count", "genkit_canary_occurrence_count",
            "non_cocoindex_evidence_id_count", "cached_answer_use_count",
            "prior_knowledge_answer_count",
        }
        require(canary_required.issubset(canary), f"missing canary fields in {run_dir}")
        canary_rows.append({
            "model_profile": model_profile,
            "genkit_network_span_count": canary["genkit_network_span_count"],
            "genkit_canary_occurrence_count": canary["genkit_canary_occurrence_count"],
            "non_cocoindex_evidence_id_count": canary["non_cocoindex_evidence_id_count"],
            "cached_answer_use_count": canary["cached_answer_use_count"],
            "prior_knowledge_answer_count": canary["prior_knowledge_answer_count"],
            "instrumentation_scope": "fixture_runner httpx hook plus serialized streams; cached/prior counters are runner constants",
            "raw_path": (relative_run / "canary-scan.txt").as_posix(),
        })

    incremental_base = repo_root / "_workspace/current/engineering/evidence/stage-1"
    incremental_rows = [
        parse_cocoindex_stats(incremental_base / "cocoindex-experiment-baseline.txt", "baseline"),
        parse_cocoindex_stats(incremental_base / "cocoindex-experiment-noop.txt", "no-op"),
        parse_cocoindex_stats(incremental_base / "cocoindex-experiment-one-change.txt", "one-change"),
    ]
    require(incremental_rows[0]["total_files"] == 9 and incremental_rows[0]["added"] == 9, "unexpected baseline incremental stats")
    require(incremental_rows[1]["total_files"] == 9 and incremental_rows[1]["unchanged"] == 9, "unexpected no-op incremental stats")
    require(incremental_rows[2]["total_files"] == 9 and incremental_rows[2]["reprocessed"] == 1 and incremental_rows[2]["unchanged"] == 8, "unexpected one-change incremental stats")
    target_row = parse_target_row(incremental_base / "cocoindex-experiment-target-row.txt")
    for row in incremental_rows:
        row["raw_path"] = Path(row["raw_path"]).relative_to(repo_root).as_posix()
    target_row["raw_path"] = Path(target_row["raw_path"]).relative_to(repo_root).as_posix()

    write_csv(results_dir / "run_summary.csv", run_summaries, list(run_summaries[0]))
    write_csv(results_dir / "query_results.csv", query_rows, list(query_rows[0]))
    write_csv(results_dir / "assertions.csv", assertion_rows, list(assertion_rows[0]))
    write_csv(results_dir / "retrieval_by_query.csv", retrieval_rows, list(retrieval_rows[0]))
    write_csv(results_dir / "canary_summary.csv", canary_rows, list(canary_rows[0]))
    write_csv(results_dir / "cocoindex_incremental.csv", incremental_rows, list(incremental_rows[0]))
    write_csv(results_dir / "cocoindex_target_row.csv", [target_row], list(target_row))

    manifest = {
        "generator": "study/genai-game-log-rag/scripts/build_results.py",
        "comparison_contract": {
            "model_profiles": [profile for profile, _ in EXPECTED_RUNS],
            "model_quantization": EXPECTED_QUANTIZATION,
            "common_profile": reference_common,
            "single_run_per_arm": True,
            "synthesis_dependent_cases": sorted(SYNTHESIS_CASES),
        },
        "outputs": {},
    }
    for path in sorted(results_dir.glob("*.csv")):
        manifest["outputs"][path.relative_to(study).as_posix()] = {
            "sha256": sha256_bytes(path.read_bytes()),
            "bytes": path.stat().st_size,
        }
    (results_dir / "manifest.json").write_text(json.dumps(manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    make_assertion_figure(figures_dir / "assertions-and-semantics.pdf", run_summaries, query_rows)
    make_latency_figure(figures_dir / "latency-q01-q03.pdf", query_rows)
    make_incremental_figure(figures_dir / "incremental-dataflow.pdf", incremental_rows)

    figure_manifest = {
        path.name: {"sha256": sha256_bytes(path.read_bytes()), "bytes": path.stat().st_size}
        for path in sorted(figures_dir.glob("*.pdf"))
    }
    (figures_dir / "manifest.json").write_text(json.dumps(figure_manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    print(f"validated {len(EXPECTED_RUNS)} runs, {len(query_rows)} query observations, and {len(assertion_rows)} assertions")
    print("assertions: " + ", ".join(f"{row['model_profile']}={row['assertions_passed']}/{row['assertions_total']}" for row in run_summaries))
    print(f"wrote {len(list(results_dir.iterdir()))} result files and {len(list(figures_dir.iterdir()))} figure files")


def find_repo_root(script: Path) -> Path:
    candidate = script.resolve().parents[3]
    require((candidate / "services/game-log-search").is_dir(), "run the script from the checked-out repository")
    return candidate


def main() -> int:
    try:
        build(find_repo_root(Path(__file__)))
    except EvidenceError as error:
        print(f"evidence validation failed: {error}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
