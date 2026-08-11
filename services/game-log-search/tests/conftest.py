"""pytest configuration: path bootstrap and shared fixtures."""
from __future__ import annotations

import sys
from pathlib import Path

import pytest

# Bootstrap: make src/ and tests/ importable before any module imports
_TESTS = Path(__file__).parent
_SRC = Path(__file__).parents[1] / "src"
for _p in (_TESTS, _SRC):
    if str(_p) not in sys.path:
        sys.path.insert(0, str(_p))

from helpers import (  # noqa: E402
    load_index_manifest,
    make_base_settings,
)
from game_log_search.config import Settings
from game_log_search.models import IndexManifest


@pytest.fixture(scope="session")
def index_manifest() -> IndexManifest:
    return load_index_manifest()


@pytest.fixture
def base_settings() -> Settings:
    return make_base_settings()


@pytest.fixture
def fixture_settings() -> Settings:
    return make_base_settings(fixture_mode=True, fault_mode="none")
