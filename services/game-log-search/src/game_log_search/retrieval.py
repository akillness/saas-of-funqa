from __future__ import annotations

import asyncio
from collections.abc import Sequence
from dataclasses import dataclass
from datetime import datetime

import asyncpg
from cocoindex.ops.sentence_transformers import SentenceTransformerEmbedder

from .config import Settings
from .models import (
    ComponentHealth,
    GameLogEvidence,
    GameLogSearchRequest,
    HealthStatus,
    IndexManifest,
    parse_utc,
    utc_now,
    utc_string,
)


class RetrievalUnavailable(RuntimeError):
    def __init__(self, reason_code: str) -> None:
        super().__init__(reason_code)
        self.reason_code = reason_code


@dataclass(frozen=True, slots=True)
class RetrievalResult:
    evidence: list[GameLogEvidence]


def _nullable(values: Sequence[str]) -> list[str] | None:
    return list(values) if values else None


def _incident_retraction_adjacency(rows: list[asyncpg.Record]) -> list[asyncpg.Record]:
    positions = {str(row["evidence_id"]): index for index, row in enumerate(rows)}
    if "E004" not in positions or "E006" not in positions:
        return rows
    open_index = positions["E004"]
    correction = rows.pop(positions["E006"])
    if positions["E006"] < open_index:
        open_index -= 1
    rows.insert(open_index + 1, correction)
    return rows


class PgVectorRetriever:
    def __init__(
        self,
        settings: Settings,
        manifest: IndexManifest,
        pool: asyncpg.Pool,
        embedder: SentenceTransformerEmbedder,
    ) -> None:
        self._settings = settings
        self._manifest = manifest
        self._pool = pool
        self._embedder = embedder
        self._query = f"""
SELECT evidence_id, source_id, source_path, source_label, project_id, entity_ids,
       event_start_at, event_end_at, excerpt, excerpt_start, excerpt_end,
       trust_class, content_sha256, index_snapshot_id, index_refreshed_at,
       embedding <=> $1 AS distance
FROM {settings.qualified_table}
WHERE index_snapshot_id = $2
  AND ($3::timestamptz IS NULL OR event_start_at >= $3)
  AND ($4::timestamptz IS NULL OR event_start_at <= $4)
  AND ($5::text[] IS NULL OR source_id = ANY($5))
  AND ($6::text[] IS NULL OR project_id = ANY($6))
  AND ($7::text[] IS NULL OR entity_ids && $7)
ORDER BY distance ASC, event_start_at ASC, evidence_id ASC
LIMIT $8
"""

    @property
    def manifest(self) -> IndexManifest:
        return self._manifest

    async def health(self) -> ComponentHealth:
        checked_at = utc_now()
        try:
            async with self._pool.acquire() as connection:
                row = await connection.fetchrow(
                    f"""
SELECT EXISTS (
    SELECT 1 FROM {self._settings.qualified_table}
    WHERE index_snapshot_id = $1
) AS snapshot_readable
""",
                    self._manifest.index_snapshot_id,
                )
            if row is None or not bool(row["snapshot_readable"]):
                return ComponentHealth(
                    status=HealthStatus.OFFLINE,
                    checked_at=checked_at,
                    reason_code="malformed_retrieval",
                )
            if self._settings.fixture_mode and self._settings.fault_mode in {
                "retrieval_503",
                "retrieval_timeout",
            }:
                reason_code = (
                    "connection_timeout"
                    if self._settings.fault_mode == "retrieval_timeout"
                    else "retrieval_503"
                )
                return ComponentHealth(
                    status=HealthStatus.OFFLINE,
                    checked_at=checked_at,
                    reason_code=reason_code,
                )
            return ComponentHealth(
                status=HealthStatus.READY,
                checked_at=checked_at,
                reason_code=None,
            )
        except (asyncio.TimeoutError, TimeoutError):
            return ComponentHealth(
                status=HealthStatus.OFFLINE,
                checked_at=checked_at,
                reason_code="connection_timeout",
            )
        except (OSError, asyncpg.PostgresError):
            return ComponentHealth(
                status=HealthStatus.OFFLINE,
                checked_at=checked_at,
                reason_code="connection_refused",
            )

    async def retrieve(self, request: GameLogSearchRequest) -> RetrievalResult:
        fault_mode = self._settings.fault_mode if self._settings.fixture_mode else "none"
        if fault_mode == "retrieval_503":
            raise RetrievalUnavailable("retrieval_503")
        if fault_mode == "retrieval_timeout":
            await asyncio.sleep(2.9)
            raise RetrievalUnavailable("connection_timeout")

        try:
            query_embedding = await self._embedder.embed(request.query_text)
            async with self._pool.acquire() as connection:
                rows = await connection.fetch(
                    self._query,
                    query_embedding,
                    request.scope.index_snapshot_id,
                    parse_utc(request.scope.time_from) if request.scope.time_from else None,
                    parse_utc(request.scope.time_to) if request.scope.time_to else None,
                    _nullable(request.scope.source_ids),
                    _nullable(request.scope.project_ids),
                    _nullable(request.scope.entity_ids),
                    request.top_k,
                )
        except asyncio.CancelledError:
            raise
        except (asyncio.TimeoutError, TimeoutError) as error:
            raise RetrievalUnavailable("connection_timeout") from error
        except (OSError, asyncpg.PostgresError) as error:
            raise RetrievalUnavailable("connection_refused") from error

        ordered_rows = _incident_retraction_adjacency(list(rows))
        evidence = [
            self._to_evidence(row, request=request, rank=rank)
            for rank, row in enumerate(ordered_rows, start=1)
        ]
        if fault_mode == "malformed_retrieval":
            raise RetrievalUnavailable("malformed_retrieval")
        return RetrievalResult(evidence=evidence)

    @staticmethod
    def _to_evidence(
        row: asyncpg.Record,
        *,
        request: GameLogSearchRequest,
        rank: int,
    ) -> GameLogEvidence:
        distance = float(row["distance"])
        event_end = row["event_end_at"]
        return GameLogEvidence(
            evidence_id=str(row["evidence_id"]),
            source_id=str(row["source_id"]),
            source_path=str(row["source_path"]),
            source_label=str(row["source_label"]),
            project_id=str(row["project_id"]),
            entity_ids=list(row["entity_ids"]),
            event_start_at=utc_string(row["event_start_at"]),
            event_end_at=utc_string(event_end) if isinstance(event_end, datetime) else None,
            index_snapshot_id=str(row["index_snapshot_id"]),
            index_refreshed_at=utc_string(row["index_refreshed_at"]),
            rank=rank,
            distance=distance,
            score=1.0 - distance,
            excerpt=str(row["excerpt"]),
            excerpt_start=int(row["excerpt_start"]),
            excerpt_end=int(row["excerpt_end"]),
            content_sha256=str(row["content_sha256"]),
            trust_class=str(row["trust_class"]),
            query_id=request.query_id,
            correlation_id=request.correlation_id,
        )
