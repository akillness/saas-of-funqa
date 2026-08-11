FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    GAME_LOG_SEARCH_HOST=0.0.0.0 \
    GAME_LOG_SEARCH_PORT=7400 \
    GAME_LOG_SEARCH_SOURCE_DIR=/app/fixtures/sim-game-logs-v1/logs \
    GAME_LOG_SEARCH_INDEX_MANIFEST_PATH=/app/fixtures/sim-game-logs-v1/index-manifest.json \
    GAME_LOG_SEARCH_QUERY_MANIFEST_PATH=/app/fixtures/sim-game-logs-v1/queries.json

WORKDIR /app

COPY pyproject.toml ./
COPY src ./src
RUN python -m pip install --upgrade pip && python -m pip install .

COPY fixtures ./fixtures

RUN useradd --create-home --uid 10001 game-log-search \
    && chown -R game-log-search:game-log-search /app
USER game-log-search

EXPOSE 7400
CMD ["python", "-m", "game_log_search"]
