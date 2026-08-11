from __future__ import annotations

from collections.abc import AsyncIterator

import asyncpg
import cocoindex as coco
from cocoindex.connectors import localfs, postgres
from cocoindex.resources.file import FileLike, PatternFilePathMatcher

from .config import Settings, load_settings
from .models import (
    EMBEDDER_CONTEXT,
    IndexManifest,
    LogShardTarget,
    SimulatedGameLogRecord,
    content_sha256,
    parse_utc,
)
from cocoindex.ops.sentence_transformers import SentenceTransformerEmbedder

SETTINGS = load_settings()
PG_POOL = coco.ContextKey[asyncpg.Pool]("game_log_search_postgres_pool")


def load_index_manifest(settings: Settings = SETTINGS) -> IndexManifest:
    return IndexManifest.model_validate_json(settings.index_manifest_path.read_text(encoding="utf-8"))


@coco.lifespan
async def coco_lifespan(builder: coco.EnvironmentBuilder) -> AsyncIterator[None]:
    async with asyncpg.create_pool(SETTINGS.database_url) as pool:
        builder.provide(PG_POOL, pool)
        builder.provide(
            EMBEDDER_CONTEXT,
            SentenceTransformerEmbedder(SETTINGS.embedding_model),
        )
        yield


@coco.fn(memo=True)
async def process_log_file(
    file: FileLike,
    target: postgres.TableTarget[LogShardTarget],
    manifest: IndexManifest,
) -> None:
    raw = await file.read_text()
    lines = [line for line in raw.splitlines() if line.strip()]
    if len(lines) != 1:
        raise ValueError(f"{file.file_path.path} must contain exactly one JSONL record")
    record = SimulatedGameLogRecord.model_validate_json(lines[0])
    if record.frozen_index_membership == "excluded_freshness_fixture":
        return
    if record.evidence_id not in manifest.indexed_evidence_ids:
        raise ValueError(f"included record {record.evidence_id} is absent from index manifest")

    excerpt_start = 0
    excerpt_end = len(record.excerpt)
    embedding = await coco.use_context(EMBEDDER_CONTEXT).embed(record.excerpt)
    target.declare_row(
        row=LogShardTarget(
            evidence_id=record.evidence_id,
            source_id=record.source_id,
            source_path=record.source_path,
            source_label=record.source_label,
            project_id=record.project_id,
            entity_ids=record.entity_ids,
            event_start_at=parse_utc(record.event_start_at),
            event_end_at=parse_utc(record.event_end_at) if record.event_end_at else None,
            excerpt=record.excerpt,
            excerpt_start=excerpt_start,
            excerpt_end=excerpt_end,
            trust_class=record.trust_class.value,
            content_sha256=content_sha256(record.excerpt),
            index_snapshot_id=manifest.index_snapshot_id,
            index_refreshed_at=parse_utc(manifest.index_refreshed_at),
            embedding=embedding,
        )
    )


@coco.fn
async def app_main(sourcedir: str) -> None:
    manifest = load_index_manifest()
    target = await postgres.mount_table_target(
        PG_POOL,
        table_name=SETTINGS.postgres_table,
        table_schema=await postgres.TableSchema.from_class(
            LogShardTarget,
            primary_key=["evidence_id"],
        ),
        pg_schema_name=SETTINGS.postgres_schema,
    )
    target.declare_vector_index(column="embedding", metric="cosine")
    target.declare_sql_command_attachment(
        name="snapshot_event_evidence",
        setup_sql=(
            f"CREATE INDEX IF NOT EXISTS {SETTINGS.postgres_table}__snapshot_event_evidence "
            f"ON {SETTINGS.qualified_table} (index_snapshot_id, event_start_at, evidence_id)"
        ),
        teardown_sql=(
            f'DROP INDEX IF EXISTS "{SETTINGS.postgres_schema}".'
            f'"{SETTINGS.postgres_table}__snapshot_event_evidence"'
        ),
    )
    target.declare_sql_command_attachment(
        name="source_snapshot",
        setup_sql=(
            f"CREATE INDEX IF NOT EXISTS {SETTINGS.postgres_table}__source_snapshot "
            f"ON {SETTINGS.qualified_table} (source_id, index_snapshot_id)"
        ),
        teardown_sql=(
            f'DROP INDEX IF EXISTS "{SETTINGS.postgres_schema}".'
            f'"{SETTINGS.postgres_table}__source_snapshot"'
        ),
    )
    constraint_name = f"{SETTINGS.postgres_table}__row_invariants"
    target.declare_sql_command_attachment(
        name="row_invariants",
        setup_sql=(
            f"ALTER TABLE {SETTINGS.qualified_table} "
            f"DROP CONSTRAINT IF EXISTS {constraint_name}; "
            f"ALTER TABLE {SETTINGS.qualified_table} "
            f"ADD CONSTRAINT {constraint_name} CHECK ("
            "trust_class IN ('trusted_log', 'untrusted_data') "
            "AND content_sha256 ~ '^[0-9a-f]{64}$' "
            "AND excerpt_start >= 0 AND excerpt_end > excerpt_start)"
        ),
        teardown_sql=(
            f"ALTER TABLE {SETTINGS.qualified_table} "
            f"DROP CONSTRAINT IF EXISTS {constraint_name}"
        ),
    )

    files = localfs.walk_dir(
        sourcedir,
        recursive=True,
        path_matcher=PatternFilePathMatcher(included_patterns=["**/*.jsonl"]),
        live=True,
    )
    await coco.mount_each(process_log_file, files.items(), target, manifest)


app = coco.App(
    coco.AppConfig(name="funqa_game_log_search"),
    app_main,
    sourcedir=str(SETTINGS.source_dir),
)


async def refresh_once() -> None:
    await app.update()


if __name__ == "__main__":
    app.update_blocking()
