from __future__ import annotations

import asyncio
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import cast

import asyncpg
import httpx
from cocoindex.ops.sentence_transformers import SentenceTransformerEmbedder
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pgvector.asyncpg import register_vector
from pydantic import BaseModel

from .config import Settings, load_settings
from .models import (
    GameLogSearchCancelAck,
    GameLogSearchCancelRequest,
    GameLogSearchRequest,
    GameLogSearchUpstreamHealth,
    IndexManifest,
)
from .orchestrator import DispatchOrchestrator
from .retrieval import PgVectorRetriever
from .synthesis import OllamaSynthesizer

NDJSON_MEDIA_TYPE = "application/x-ndjson"


def _load_manifest(settings: Settings) -> IndexManifest:
    return IndexManifest.model_validate_json(settings.index_manifest_path.read_text(encoding="utf-8"))


def create_app(settings: Settings | None = None) -> FastAPI:
    configured = settings or load_settings()
    manifest = _load_manifest(configured)

    @asynccontextmanager
    async def lifespan(application: FastAPI) -> AsyncIterator[None]:
        pool: asyncpg.Pool | None = None
        retrieval_reason: str | None = None
        client = httpx.AsyncClient(base_url=configured.synthesis_base_url)
        try:
            try:
                pool = await asyncpg.create_pool(
                    configured.database_url,
                    min_size=1,
                    max_size=10,
                    init=register_vector,
                )
            except (asyncio.TimeoutError, TimeoutError):
                retrieval_reason = "connection_timeout"
            except (OSError, asyncpg.PostgresError):
                retrieval_reason = "connection_refused"

            embedder = SentenceTransformerEmbedder(configured.embedding_model)
            retriever = (
                PgVectorRetriever(configured, manifest, pool, embedder)
                if pool is not None
                else None
            )
            application.state.orchestrator = DispatchOrchestrator(
                configured,
                manifest,
                retriever,
                OllamaSynthesizer(configured, client),
                retrieval_unavailable_reason=retrieval_reason,
            )
            yield
        finally:
            await client.aclose()
            if pool is not None:
                await pool.close()

    application = FastAPI(
        title="FunQA Game-Log Search",
        version="1.0.0",
        lifespan=lifespan,
        docs_url=None,
        redoc_url=None,
        openapi_url=None,
    )
    application.state.settings = configured
    application.state.manifest = manifest

    @application.get("/health", response_model=GameLogSearchUpstreamHealth)
    async def health() -> GameLogSearchUpstreamHealth:
        orchestrator = cast(DispatchOrchestrator, application.state.orchestrator)
        return await orchestrator.health()

    @application.post("/v1/search", response_class=StreamingResponse)
    async def search(request: GameLogSearchRequest) -> StreamingResponse:
        orchestrator = cast(DispatchOrchestrator, application.state.orchestrator)

        async def ndjson_frames() -> AsyncIterator[bytes]:
            async for frame in orchestrator.stream(request):
                model = cast(BaseModel, frame)
                yield (model.model_dump_json() + "\n").encode("utf-8")

        return StreamingResponse(
            ndjson_frames(),
            media_type=NDJSON_MEDIA_TYPE,
            headers={
                "Cache-Control": "no-store",
                "X-Content-Type-Options": "nosniff",
            },
        )

    @application.post(
        "/v1/search/{query_id}/cancel",
        response_model=GameLogSearchCancelAck,
    )
    async def cancel(query_id: str, request: GameLogSearchCancelRequest) -> GameLogSearchCancelAck:
        if request.query_id != query_id:
            raise HTTPException(status_code=409, detail="query_id_mismatch")
        orchestrator = cast(DispatchOrchestrator, application.state.orchestrator)
        return await orchestrator.cancel(query_id, request.correlation_id)

    return application


app = create_app()
