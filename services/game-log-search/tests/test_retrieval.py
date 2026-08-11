"""Contract tests for game_log_search.retrieval.

Covers:
- _incident_retraction_adjacency:
  * E006 after E004 — no-op (already adjacent)
  * E006 before E004 — moves E006 to position E004+1
  * Neither E004 nor E006 present — passthrough
  * E004 present, E006 absent — passthrough
  * E006 present, E004 absent — passthrough
- PgVectorRetriever.health:
  * snapshot_readable=True → ready
  * snapshot_readable=False → offline with malformed_retrieval
  * asyncpg exception → offline with connection_refused
  * fixture_mode retrieval_503 fault → offline
  * fixture_mode retrieval_timeout fault → offline with connection_timeout
- _to_evidence field mapping:
  * rank = 1-based position in ordered rows
  * score = 1.0 - distance
  * query_id and correlation_id forwarded from request
"""
from __future__ import annotations

import asyncio
from unittest.mock import AsyncMock, MagicMock

import asyncpg
import pytest

from game_log_search.retrieval import (
    PgVectorRetriever,
    RetrievalResult,
    RetrievalUnavailable,
    _incident_retraction_adjacency,
)
from helpers import (
    CORR_ID,
    COVERAGE_THROUGH,
    INDEX_SNAPSHOT_ID,
    QUERY_ID,
    make_base_settings,
    make_mock_embedder,
    make_mock_pool,
    make_request,
    run_async,
)


# ---------------------------------------------------------------------------
# _incident_retraction_adjacency (pure function, no I/O)
# ---------------------------------------------------------------------------

def _row(evidence_id: str) -> MagicMock:
    """Create a minimal asyncpg.Record-like mock."""
    row = MagicMock(spec=asyncpg.Record)
    row.__getitem__ = MagicMock(side_effect=lambda key: evidence_id if key == "evidence_id" else None)
    # Also allow str() to return the evidence_id via dict-style lookup
    row_dict = {"evidence_id": evidence_id}
    row.__getitem__ = lambda _, k: row_dict.get(k)
    return row


def _ids(rows: list) -> list[str]:
    return [str(r["evidence_id"]) for r in rows]


def test_incident_retraction_adjacency_noop_when_e006_already_after_e004():
    rows = [_row("E004"), _row("E006"), _row("E005")]
    result = _incident_retraction_adjacency(rows)
    assert _ids(result) == ["E004", "E006", "E005"]


def test_incident_retraction_adjacency_moves_e006_after_e004():
    # E006 appears before E004 — must be moved to immediately after E004
    rows = [_row("E006"), _row("E004"), _row("E005")]
    result = _incident_retraction_adjacency(rows)
    assert _ids(result) == ["E004", "E006", "E005"]


def test_incident_retraction_adjacency_passthrough_no_e004_or_e006():
    rows = [_row("E001"), _row("E002"), _row("E003")]
    result = _incident_retraction_adjacency(rows)
    assert _ids(result) == ["E001", "E002", "E003"]


def test_incident_retraction_adjacency_passthrough_e004_without_e006():
    rows = [_row("E001"), _row("E004"), _row("E005")]
    result = _incident_retraction_adjacency(rows)
    assert _ids(result) == ["E001", "E004", "E005"]


def test_incident_retraction_adjacency_passthrough_e006_without_e004():
    rows = [_row("E001"), _row("E006"), _row("E005")]
    result = _incident_retraction_adjacency(rows)
    assert _ids(result) == ["E001", "E006", "E005"]


def test_incident_retraction_adjacency_e006_two_positions_after_e004():
    # E004 at index 0, E005 at index 1, E006 at index 2 → E006 must move to index 1
    rows = [_row("E004"), _row("E005"), _row("E006")]
    result = _incident_retraction_adjacency(rows)
    assert _ids(result) == ["E004", "E006", "E005"]


def test_incident_retraction_adjacency_empty_list():
    assert _incident_retraction_adjacency([]) == []


def test_incident_retraction_adjacency_single_element():
    rows = [_row("E001")]
    assert _ids(_incident_retraction_adjacency(rows)) == ["E001"]


# ---------------------------------------------------------------------------
# PgVectorRetriever.health
# ---------------------------------------------------------------------------

def _make_retriever(
    *,
    fault_mode: str = "none",
    fixture_mode: bool = False,
    snapshot_readable: bool = True,
):
    settings = make_base_settings(fixture_mode=fixture_mode, fault_mode=fault_mode)
    pool, connection = make_mock_pool(snapshot_readable=snapshot_readable)
    embedder = make_mock_embedder()

    from pathlib import Path
    from game_log_search.models import IndexManifest
    from helpers import MANIFEST_PATH
    manifest = IndexManifest.model_validate_json(
        MANIFEST_PATH.read_text(encoding="utf-8")
    )
    return PgVectorRetriever(settings, manifest, pool, embedder)


def test_retriever_health_ready_when_snapshot_readable():
    retriever = _make_retriever(snapshot_readable=True)
    health = run_async(retriever.health())
    assert health.status.value == "ready"
    assert health.reason_code is None


def test_retriever_health_offline_when_snapshot_not_readable():
    retriever = _make_retriever(snapshot_readable=False)
    health = run_async(retriever.health())
    assert health.status.value == "offline"
    assert health.reason_code == "malformed_retrieval"


def test_retriever_health_offline_on_postgres_error():
    settings = make_base_settings()
    embedder = make_mock_embedder()
    from game_log_search.models import IndexManifest
    from helpers import MANIFEST_PATH
    manifest = IndexManifest.model_validate_json(MANIFEST_PATH.read_text(encoding="utf-8"))

    # Make pool.acquire raise PostgresError
    broken_pool = MagicMock()
    from contextlib import asynccontextmanager

    @asynccontextmanager
    async def _broken_acquire():
        raise asyncpg.PostgresError("connection refused")
        yield  # noqa: unreachable

    broken_pool.acquire = _broken_acquire
    retriever = PgVectorRetriever(settings, manifest, broken_pool, embedder)
    health = run_async(retriever.health())
    assert health.status.value == "offline"
    assert health.reason_code == "connection_refused"


def test_retriever_health_offline_on_asyncio_timeout():
    settings = make_base_settings()
    embedder = make_mock_embedder()
    from game_log_search.models import IndexManifest
    from helpers import MANIFEST_PATH
    manifest = IndexManifest.model_validate_json(MANIFEST_PATH.read_text(encoding="utf-8"))

    from contextlib import asynccontextmanager

    @asynccontextmanager
    async def _timeout_acquire():
        raise asyncio.TimeoutError()
        yield  # noqa: unreachable

    pool = MagicMock()
    pool.acquire = _timeout_acquire
    retriever = PgVectorRetriever(settings, manifest, pool, embedder)
    health = run_async(retriever.health())
    assert health.status.value == "offline"
    assert health.reason_code == "connection_timeout"


def test_retriever_health_offline_on_retrieval_503_fault():
    retriever = _make_retriever(fault_mode="retrieval_503", fixture_mode=True)
    health = run_async(retriever.health())
    assert health.status.value == "offline"
    assert health.reason_code == "retrieval_503"


def test_retriever_health_offline_on_retrieval_timeout_fault():
    retriever = _make_retriever(fault_mode="retrieval_timeout", fixture_mode=True)
    health = run_async(retriever.health())
    assert health.status.value == "offline"
    assert health.reason_code == "connection_timeout"


# ---------------------------------------------------------------------------
# PgVectorRetriever.retrieve — fault injection
# ---------------------------------------------------------------------------

def test_retriever_retrieve_raises_retrieval_unavailable_on_503_fault():
    retriever = _make_retriever(fault_mode="retrieval_503", fixture_mode=True)
    with pytest.raises(RetrievalUnavailable) as exc_info:
        run_async(retriever.retrieve(make_request()))
    assert exc_info.value.reason_code == "retrieval_503"


# ---------------------------------------------------------------------------
# _to_evidence field mapping
# ---------------------------------------------------------------------------

def _make_db_row(
    evidence_id: str = "E001",
    distance: float = 0.1,
    trust_class: str = "trusted_log",
) -> MagicMock:
    """Simulate an asyncpg Record returned by the SQL query."""
    from datetime import timezone, datetime as dt

    start_time = dt(2026, 8, 1, 10, 0, 0, tzinfo=timezone.utc)
    refreshed_at = dt(2026, 8, 8, 12, 0, 0, tzinfo=timezone.utc)

    data = {
        "evidence_id": evidence_id,
        "source_id": f"logs/{evidence_id}.log",
        "source_path": f"logs/{evidence_id}.log",
        "source_label": f"logs/{evidence_id}.log",
        "project_id": "Alpha",
        "entity_ids": [],
        "event_start_at": start_time,
        "event_end_at": None,
        "index_snapshot_id": INDEX_SNAPSHOT_ID,
        "index_refreshed_at": refreshed_at,
        "excerpt": "Some excerpt text content.",
        "excerpt_start": 0,
        "excerpt_end": 26,
        "content_sha256": "a" * 64,
        "trust_class": trust_class,
        "distance": distance,
    }
    row = MagicMock(spec=asyncpg.Record)
    row.__getitem__ = lambda _, k: data[k]
    return row


def test_to_evidence_score_equals_one_minus_distance():
    from game_log_search.retrieval import PgVectorRetriever
    row = _make_db_row(distance=0.25)
    request = make_request(query_id=QUERY_ID, correlation_id=CORR_ID)
    evidence = PgVectorRetriever._to_evidence(row, request=request, rank=1)
    assert evidence.score == pytest.approx(0.75)
    assert evidence.distance == pytest.approx(0.25)


def test_to_evidence_rank_is_passed_through():
    from game_log_search.retrieval import PgVectorRetriever
    row = _make_db_row(distance=0.1)
    request = make_request()
    evidence = PgVectorRetriever._to_evidence(row, request=request, rank=3)
    assert evidence.rank == 3


def test_to_evidence_forwards_query_and_correlation_ids():
    from game_log_search.retrieval import PgVectorRetriever
    row = _make_db_row()
    request = make_request(query_id=QUERY_ID, correlation_id=CORR_ID)
    evidence = PgVectorRetriever._to_evidence(row, request=request, rank=1)
    assert evidence.query_id == QUERY_ID
    assert evidence.correlation_id == CORR_ID


def test_to_evidence_trust_class_trusted_log():
    from game_log_search.retrieval import PgVectorRetriever
    from game_log_search.models import TrustClass
    row = _make_db_row(trust_class="trusted_log")
    request = make_request()
    evidence = PgVectorRetriever._to_evidence(row, request=request, rank=1)
    assert evidence.trust_class is TrustClass.TRUSTED_LOG


def test_to_evidence_trust_class_untrusted_data():
    from game_log_search.retrieval import PgVectorRetriever
    from game_log_search.models import TrustClass
    row = _make_db_row(trust_class="untrusted_data")
    request = make_request()
    evidence = PgVectorRetriever._to_evidence(row, request=request, rank=1)
    assert evidence.trust_class is TrustClass.UNTRUSTED_DATA
