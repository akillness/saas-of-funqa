# Graphify Codex Install 2026-05-05

## Result

Graphify was installed for Codex in this project with:

```bash
rtk graphify codex install
```

The command reported:

- Graphify section written to `AGENTS.md`
- `PreToolUse` hook registered in `.codex/hooks.json`
- Codex should check the knowledge graph before architecture/codebase answers when `graphify-out/graph.json` exists
- The generated rebuild hint was adjusted to use `graphify update .` because the CLI is installed in a pipx-style environment while the default `python3` cannot import `graphify`.

## Installed Artifacts

- `AGENTS.md`
- `.codex/hooks.json`

Existing graph artifacts were present:

- `graphify-out/GRAPH_REPORT.md`
- `graphify-out/graph.json`

## Verification

- `graphify --help` lists `codex install` and `codex uninstall`.
- `which graphify` resolves to `/Users/jangyoung/.local/bin/graphify`.
- `which codex` resolves to `/Users/jangyoung/.superset/bin/codex`.
- `.codex/hooks.json` contains a `PreToolUse` hook that emits context when `graphify-out/graph.json` exists.

## Environment Note

The Graphify CLI is installed through a pipx-style virtual environment:

```text
/Users/jangyoung/.local/pipx/venvs/graphifyy/bin/python
```

The default `python3` environment does not currently import `graphify`. Prefer the `graphify` CLI for normal use unless the Python package is intentionally installed into the default interpreter.

## Source

- `knowledge/raw/sources/2026-05-05-graphify-codex-install.md`
