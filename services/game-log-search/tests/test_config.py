"""Contract tests for game_log_search.config.

Covers:
- DEFAULT_EMBEDDING_MODEL identity (exact model name and 384-dim implication)
- load_settings() accepts valid minimal env maps
- Each required env var missing → ConfigurationError
- Invalid port, URL, schema/table identifier, api_style, fault_mode
- fixture_mode=0/1 parse; fault_mode non-none without fixture_mode=1 is rejected
- Qualified table name property
- synthesis_api_key optional / None when blank
- Settings dataclass is frozen (immutable)
"""
from __future__ import annotations

import pytest

from game_log_search.config import (
    DEFAULT_EMBEDDING_MODEL,
    ConfigurationError,
    Settings,
    load_settings,
)


# ---------------------------------------------------------------------------
# Baseline valid env
# ---------------------------------------------------------------------------

_MINIMAL_ENV = {
    "GAME_LOG_SEARCH_DATABASE_URL": "postgresql://localhost/testdb",
    "GAME_LOG_SEARCH_SYNTHESIS_API_STYLE": "ollama_chat",
    "GAME_LOG_SEARCH_SYNTHESIS_BASE_URL": "http://127.0.0.1:11434",
    "GAME_LOG_SEARCH_SYNTHESIS_MODEL": "llama3",
    "GAME_LOG_SEARCH_BUILD_ID": "test-build-1",
}


def _env(**overrides: str) -> dict[str, str]:
    merged = dict(_MINIMAL_ENV)
    merged.update(overrides)
    return merged


def _env_without(*keys: str) -> dict[str, str]:
    merged = dict(_MINIMAL_ENV)
    for key in keys:
        merged.pop(key, None)
    return merged


# ---------------------------------------------------------------------------
# DEFAULT_EMBEDDING_MODEL
# ---------------------------------------------------------------------------

def test_default_embedding_model_is_exact_paraphrase_multilingual_minilm():
    assert DEFAULT_EMBEDDING_MODEL == "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"


def test_default_embedding_model_is_384_dim_variant():
    # L12-v2 variant of MiniLM always produces 384-dimensional embeddings
    assert "L12-v2" in DEFAULT_EMBEDDING_MODEL
    assert "MiniLM" in DEFAULT_EMBEDDING_MODEL


def test_embedding_model_defaults_to_paraphrase_multilingual_when_env_absent(tmp_path):
    settings = load_settings(_env(), repo_root=tmp_path)
    assert settings.embedding_model == DEFAULT_EMBEDDING_MODEL


def test_embedding_model_env_override_is_respected(tmp_path):
    settings = load_settings(
        _env(GAME_LOG_SEARCH_EMBEDDING_MODEL="custom/my-model"),
        repo_root=tmp_path,
    )
    assert settings.embedding_model == "custom/my-model"


def test_embedding_model_blank_env_falls_back_to_default(tmp_path):
    settings = load_settings(
        _env(GAME_LOG_SEARCH_EMBEDDING_MODEL="   "),
        repo_root=tmp_path,
    )
    assert settings.embedding_model == DEFAULT_EMBEDDING_MODEL


# ---------------------------------------------------------------------------
# load_settings — valid minimal env
# ---------------------------------------------------------------------------

def test_load_settings_minimal_env_succeeds(tmp_path):
    settings = load_settings(_env(), repo_root=tmp_path)
    assert settings.database_url == "postgresql://localhost/testdb"
    assert settings.synthesis_api_style == "ollama_chat"
    assert settings.synthesis_model == "llama3"
    assert settings.build_id == "test-build-1"
    assert settings.fixture_mode is False
    assert settings.fault_mode == "none"


def test_load_settings_openai_compatible_style_succeeds(tmp_path):
    settings = load_settings(
        _env(GAME_LOG_SEARCH_SYNTHESIS_API_STYLE="openai_compatible"),
        repo_root=tmp_path,
    )
    assert settings.synthesis_api_style == "openai_compatible"


def test_load_settings_default_host_and_port(tmp_path):
    settings = load_settings(_env(), repo_root=tmp_path)
    assert settings.host == "127.0.0.1"
    assert settings.port == 7400


def test_load_settings_port_override(tmp_path):
    settings = load_settings(_env(GAME_LOG_SEARCH_PORT="8080"), repo_root=tmp_path)
    assert settings.port == 8080


# ---------------------------------------------------------------------------
# Missing required fields → ConfigurationError
# ---------------------------------------------------------------------------

def test_missing_database_url_raises(tmp_path):
    with pytest.raises(ConfigurationError, match="GAME_LOG_SEARCH_DATABASE_URL"):
        load_settings(_env_without("GAME_LOG_SEARCH_DATABASE_URL"), repo_root=tmp_path)


def test_missing_synthesis_base_url_raises(tmp_path):
    with pytest.raises(ConfigurationError, match="GAME_LOG_SEARCH_SYNTHESIS_BASE_URL"):
        load_settings(_env_without("GAME_LOG_SEARCH_SYNTHESIS_BASE_URL"), repo_root=tmp_path)


def test_missing_synthesis_model_raises(tmp_path):
    with pytest.raises(ConfigurationError, match="GAME_LOG_SEARCH_SYNTHESIS_MODEL"):
        load_settings(_env_without("GAME_LOG_SEARCH_SYNTHESIS_MODEL"), repo_root=tmp_path)


def test_missing_build_id_raises(tmp_path):
    with pytest.raises(ConfigurationError, match="GAME_LOG_SEARCH_BUILD_ID"):
        load_settings(_env_without("GAME_LOG_SEARCH_BUILD_ID"), repo_root=tmp_path)


def test_missing_synthesis_api_style_raises(tmp_path):
    with pytest.raises(ConfigurationError, match="GAME_LOG_SEARCH_SYNTHESIS_API_STYLE"):
        load_settings(_env_without("GAME_LOG_SEARCH_SYNTHESIS_API_STYLE"), repo_root=tmp_path)


# ---------------------------------------------------------------------------
# Invalid field values → ConfigurationError
# ---------------------------------------------------------------------------

def test_invalid_port_non_integer_raises(tmp_path):
    with pytest.raises(ConfigurationError, match="integer"):
        load_settings(_env(GAME_LOG_SEARCH_PORT="abc"), repo_root=tmp_path)


def test_invalid_port_zero_raises(tmp_path):
    with pytest.raises(ConfigurationError, match="65535"):
        load_settings(_env(GAME_LOG_SEARCH_PORT="0"), repo_root=tmp_path)


def test_invalid_port_above_65535_raises(tmp_path):
    with pytest.raises(ConfigurationError, match="65535"):
        load_settings(_env(GAME_LOG_SEARCH_PORT="65536"), repo_root=tmp_path)


def test_invalid_synthesis_api_style_raises(tmp_path):
    with pytest.raises(ConfigurationError, match="GAME_LOG_SEARCH_SYNTHESIS_API_STYLE"):
        load_settings(
            _env(GAME_LOG_SEARCH_SYNTHESIS_API_STYLE="grpc_streaming"),
            repo_root=tmp_path,
        )


def test_invalid_synthesis_base_url_not_http_raises(tmp_path):
    with pytest.raises(ConfigurationError, match="absolute http"):
        load_settings(
            _env(GAME_LOG_SEARCH_SYNTHESIS_BASE_URL="ftp://bad-url"),
            repo_root=tmp_path,
        )


def test_invalid_synthesis_base_url_relative_raises(tmp_path):
    with pytest.raises(ConfigurationError, match="absolute http"):
        load_settings(
            _env(GAME_LOG_SEARCH_SYNTHESIS_BASE_URL="/api/ollama"),
            repo_root=tmp_path,
        )


def test_invalid_database_url_not_postgres_raises(tmp_path):
    with pytest.raises(ConfigurationError, match="PostgreSQL URL"):
        load_settings(
            _env(GAME_LOG_SEARCH_DATABASE_URL="mysql://localhost/db"),
            repo_root=tmp_path,
        )


def test_invalid_postgres_schema_with_spaces_raises(tmp_path):
    with pytest.raises(ConfigurationError, match="plain PostgreSQL identifier"):
        load_settings(
            _env(GAME_LOG_SEARCH_POSTGRES_SCHEMA="bad schema"),
            repo_root=tmp_path,
        )


def test_invalid_postgres_table_with_hyphen_raises(tmp_path):
    with pytest.raises(ConfigurationError, match="plain PostgreSQL identifier"):
        load_settings(
            _env(GAME_LOG_SEARCH_POSTGRES_TABLE="log-shards"),
            repo_root=tmp_path,
        )


# ---------------------------------------------------------------------------
# fixture_mode and fault_mode
# ---------------------------------------------------------------------------

def test_fixture_mode_one_enables_fixture_mode(tmp_path):
    settings = load_settings(
        _env(GAME_LOG_SEARCH_FIXTURE_MODE="1", GAME_LOG_SEARCH_FAULT_MODE="none"),
        repo_root=tmp_path,
    )
    assert settings.fixture_mode is True


def test_fixture_mode_zero_is_disabled(tmp_path):
    settings = load_settings(
        _env(GAME_LOG_SEARCH_FIXTURE_MODE="0"),
        repo_root=tmp_path,
    )
    assert settings.fixture_mode is False


def test_invalid_fixture_mode_value_raises(tmp_path):
    with pytest.raises(ConfigurationError, match="GAME_LOG_SEARCH_FIXTURE_MODE"):
        load_settings(_env(GAME_LOG_SEARCH_FIXTURE_MODE="true"), repo_root=tmp_path)


def test_fault_mode_without_fixture_mode_raises(tmp_path):
    with pytest.raises(ConfigurationError, match="fixture mode"):
        load_settings(
            _env(GAME_LOG_SEARCH_FIXTURE_MODE="0", GAME_LOG_SEARCH_FAULT_MODE="retrieval_503"),
            repo_root=tmp_path,
        )


def test_all_fault_modes_valid_in_fixture_mode(tmp_path):
    fault_modes = [
        "retrieval_503", "retrieval_timeout", "synthesis_503",
        "synthesis_timeout", "malformed_retrieval", "malformed_synthesis",
    ]
    for mode in fault_modes:
        settings = load_settings(
            _env(GAME_LOG_SEARCH_FIXTURE_MODE="1", GAME_LOG_SEARCH_FAULT_MODE=mode),
            repo_root=tmp_path,
        )
        assert settings.fault_mode == mode


def test_invalid_fault_mode_raises(tmp_path):
    with pytest.raises(ConfigurationError, match="GAME_LOG_SEARCH_FAULT_MODE"):
        load_settings(
            _env(GAME_LOG_SEARCH_FIXTURE_MODE="1", GAME_LOG_SEARCH_FAULT_MODE="inject_junk"),
            repo_root=tmp_path,
        )


# ---------------------------------------------------------------------------
# synthesis_api_key optional
# ---------------------------------------------------------------------------

def test_synthesis_api_key_none_when_not_set(tmp_path):
    settings = load_settings(_env(), repo_root=tmp_path)
    assert settings.synthesis_api_key is None


def test_synthesis_api_key_none_when_blank(tmp_path):
    settings = load_settings(
        _env(GAME_LOG_SEARCH_SYNTHESIS_API_KEY="   "),
        repo_root=tmp_path,
    )
    assert settings.synthesis_api_key is None


def test_synthesis_api_key_set_when_provided(tmp_path):
    settings = load_settings(
        _env(GAME_LOG_SEARCH_SYNTHESIS_API_KEY="sk-test-key"),
        repo_root=tmp_path,
    )
    assert settings.synthesis_api_key == "sk-test-key"


# ---------------------------------------------------------------------------
# Settings dataclass is frozen
# ---------------------------------------------------------------------------

def test_settings_is_frozen_immutable(base_settings):
    with pytest.raises((AttributeError, TypeError)):
        base_settings.build_id = "mutated"  # type: ignore[misc]


def test_settings_qualified_table_uses_schema_and_table(base_settings):
    assert base_settings.qualified_table == '"game_log_search"."log_shards"'
