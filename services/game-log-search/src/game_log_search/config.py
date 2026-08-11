from __future__ import annotations

import os
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Literal, Mapping, cast
from urllib.parse import urlparse

SynthesisApiStyle = Literal["ollama_chat", "openai_compatible"]
FaultMode = Literal[
    "none",
    "retrieval_503",
    "retrieval_timeout",
    "synthesis_503",
    "synthesis_timeout",
    "malformed_retrieval",
    "malformed_synthesis",
]

_VALID_FAULT_MODES = {
    "none",
    "retrieval_503",
    "retrieval_timeout",
    "synthesis_503",
    "synthesis_timeout",
    "malformed_retrieval",
    "malformed_synthesis",
}
_IDENTIFIER_RE = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")
DEFAULT_EMBEDDING_MODEL = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"


class ConfigurationError(ValueError):
    """The service environment violates its frozen startup contract."""


@dataclass(frozen=True, slots=True)
class Settings:
    host: str
    port: int
    database_url: str
    postgres_schema: str
    postgres_table: str
    source_dir: Path
    index_manifest_path: Path
    query_manifest_path: Path
    embedding_model: str
    synthesis_api_style: SynthesisApiStyle
    synthesis_base_url: str
    synthesis_model: str
    synthesis_model_quantization: str | None
    synthesis_api_key: str | None
    build_id: str
    fixture_mode: bool
    fault_mode: FaultMode

    @property
    def qualified_table(self) -> str:
        return f'"{self.postgres_schema}"."{self.postgres_table}"'


def _required(env: Mapping[str, str], name: str) -> str:
    value = env.get(name, "").strip()
    if not value:
        raise ConfigurationError(f"{name} is required")
    return value


def _absolute_http_url(value: str, name: str) -> str:
    parsed = urlparse(value)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise ConfigurationError(f"{name} must be an absolute http(s) URL")
    return value.rstrip("/")


def _database_url(value: str) -> str:
    parsed = urlparse(value)
    if parsed.scheme not in {"postgres", "postgresql"} or not parsed.hostname:
        raise ConfigurationError("GAME_LOG_SEARCH_DATABASE_URL must be a PostgreSQL URL")
    return value


def _identifier(value: str, name: str) -> str:
    if not _IDENTIFIER_RE.fullmatch(value):
        raise ConfigurationError(f"{name} must be a plain PostgreSQL identifier")
    return value


def _port(value: str) -> int:
    try:
        parsed = int(value)
    except ValueError as error:
        raise ConfigurationError("GAME_LOG_SEARCH_PORT must be an integer") from error
    if not 1 <= parsed <= 65535:
        raise ConfigurationError("GAME_LOG_SEARCH_PORT must be between 1 and 65535")
    return parsed


def load_settings(env: Mapping[str, str] | None = None, *, repo_root: Path | None = None) -> Settings:
    values = os.environ if env is None else env
    root = repo_root or Path(__file__).resolve().parents[4]
    fixture_root = root / "services/game-log-search/fixtures/sim-game-logs-v1"

    api_style = _required(values, "GAME_LOG_SEARCH_SYNTHESIS_API_STYLE")
    if api_style not in {"ollama_chat", "openai_compatible"}:
        raise ConfigurationError(
            "GAME_LOG_SEARCH_SYNTHESIS_API_STYLE must be ollama_chat or openai_compatible"
        )

    fixture_value = values.get("GAME_LOG_SEARCH_FIXTURE_MODE", "0").strip()
    if fixture_value not in {"0", "1"}:
        raise ConfigurationError("GAME_LOG_SEARCH_FIXTURE_MODE must be 0 or 1")
    fixture_mode = fixture_value == "1"

    fault_value = values.get("GAME_LOG_SEARCH_FAULT_MODE", "none").strip()
    if fault_value not in _VALID_FAULT_MODES:
        raise ConfigurationError(f"unsupported GAME_LOG_SEARCH_FAULT_MODE: {fault_value}")
    if not fixture_mode and fault_value != "none":
        raise ConfigurationError("GAME_LOG_SEARCH_FAULT_MODE requires fixture mode")

    return Settings(
        host=values.get("GAME_LOG_SEARCH_HOST", "127.0.0.1").strip() or "127.0.0.1",
        port=_port(values.get("GAME_LOG_SEARCH_PORT", "7400")),
        database_url=_database_url(_required(values, "GAME_LOG_SEARCH_DATABASE_URL")),
        postgres_schema=_identifier(
            values.get("GAME_LOG_SEARCH_POSTGRES_SCHEMA", "game_log_search").strip(),
            "GAME_LOG_SEARCH_POSTGRES_SCHEMA",
        ),
        postgres_table=_identifier(
            values.get("GAME_LOG_SEARCH_POSTGRES_TABLE", "log_shards").strip(),
            "GAME_LOG_SEARCH_POSTGRES_TABLE",
        ),
        source_dir=Path(
            values.get("GAME_LOG_SEARCH_SOURCE_DIR", str(fixture_root / "logs"))
        ).expanduser(),
        index_manifest_path=Path(
            values.get(
                "GAME_LOG_SEARCH_INDEX_MANIFEST_PATH", str(fixture_root / "index-manifest.json")
            )
        ).expanduser(),
        query_manifest_path=Path(
            values.get("GAME_LOG_SEARCH_QUERY_MANIFEST_PATH", str(fixture_root / "queries.json"))
        ).expanduser(),
        embedding_model=values.get(
            "GAME_LOG_SEARCH_EMBEDDING_MODEL", DEFAULT_EMBEDDING_MODEL
        ).strip()
        or DEFAULT_EMBEDDING_MODEL,
        synthesis_api_style=cast(SynthesisApiStyle, api_style),
        synthesis_base_url=_absolute_http_url(
            _required(values, "GAME_LOG_SEARCH_SYNTHESIS_BASE_URL"),
            "GAME_LOG_SEARCH_SYNTHESIS_BASE_URL",
        ),
        synthesis_model=_required(values, "GAME_LOG_SEARCH_SYNTHESIS_MODEL"),
        synthesis_model_quantization=(
            values.get("GAME_LOG_SEARCH_SYNTHESIS_MODEL_QUANTIZATION") or ""
        ).strip()
        or None,
        synthesis_api_key=(values.get("GAME_LOG_SEARCH_SYNTHESIS_API_KEY") or "").strip() or None,
        build_id=_required(values, "GAME_LOG_SEARCH_BUILD_ID"),
        fixture_mode=fixture_mode,
        fault_mode=cast(FaultMode, fault_value),
    )
