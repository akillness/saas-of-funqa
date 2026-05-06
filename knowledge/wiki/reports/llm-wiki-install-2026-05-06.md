# llm-wiki Install 2026-05-06

## Result

llm-wiki support was installed into the existing `knowledge/` vault without re-bootstrapping or overwriting the vault.

## Installed Helpers

- `scripts/bootstrap-vault.sh`
- `scripts/ingest-url.sh`
- `scripts/new-query-note.sh`
- `scripts/lint-wiki.py`

## npm Scripts

```bash
npm run wiki:bootstrap
npm run wiki:ingest-url -- "<url>"
npm run wiki:new-query -- "<title>" --question "<question>"
npm run wiki:lint
npm run wiki:lint:json
```

## Verification

`npm run wiki:lint` passed after installing the helpers and repairing existing structural drift.

```text
Vault: /Users/jangyoung/.superset/projects/saas-of-funqa/knowledge
Pages: 27
No structural issues found.
```

`npm run wiki:lint:json` also reported no missing paths, broken links, or orphan pages.

## Notes

- The vault already existed, so `bootstrap-vault.sh` is available for future bootstraps but was not used to overwrite `knowledge/`.
- `scripts/lint-wiki.py` was adjusted for this repo so valid `raw/sources/**` citations are not treated as broken wiki links.
- `knowledge/index.md` now links the previously orphaned consensus reports.

## Source

- `knowledge/raw/sources/2026-05-06-llm-wiki-install.md`

