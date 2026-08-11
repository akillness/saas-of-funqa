# Reproducibility

## Scope

This artifact rebuilds the derived tables and vector figures for a nine-record, ten-query, single-run vertical-slice case study. It does not rerun Ollama, PostgreSQL, CocoIndex, the web application, production code, or any project-wide test suite. Raw artifacts under `_workspace/current/` remain authoritative.

## Requirements

- Python 3.10 or newer; `scripts/build_results.py` uses only the standard library.
- `pdflatex` and `bibtex` for the manuscript.
- Run commands from the checked-out repository unless a step says otherwise.

## Rebuild results and figures

From the repository root:

```bash
python3 study/genai-game-log-rag/scripts/build_results.py
```

Expected extraction summary:

```text
validated 3 runs, 30 query observations, and 420 assertions
assertions: qwen2.5:0.5b=130/140, qwen2.5:1.5b=130/140, qwen2.5:3b=136/140
wrote 8 result files and 4 figure files
```

The exact byte counts and SHA-256 values are recorded after each rebuild in:

- `results/manifest.json`
- `figures/manifest.json`

The builder exits with status 2 before generating outputs if it finds a model-profile, quantization, corpus-hash, query-hash, snapshot, index-membership, stream-identity, assertion, terminal-schema, or supported-finding inconsistency.

## Compile the manuscript

From `study/genai-game-log-rag/`:

```bash
pdflatex -interaction=nonstopmode -halt-on-error paper.tex
bibtex paper
pdflatex -interaction=nonstopmode -halt-on-error paper.tex
pdflatex -interaction=nonstopmode -halt-on-error paper.tex
```

The output is `paper.pdf`. Generated LaTeX auxiliaries and `paper.pdf` are build products, not inputs to `scripts/build_results.py`.

### PDF reproducibility boundary

`pdfTeX` writes build-time `CreationDate` and `ModDate` metadata, so this project does not promise a byte-identical `paper.pdf` across rebuild times. The SHA-256 of the tracked `paper.pdf` identifies the published binary. Rebuild verification instead requires:

- a clean checkout;
- an unchanged result/figure artifact tree after `scripts/build_results.py`;
- the same eight-page count;
- no unresolved citations or references; and
- identical normalized text from `pdftotext`.

For the currently published artifact, the binary SHA-256 is `b5f5eab6ab0c71a22e2c7f3dd2244aad5ccba432d75b299b4ad900a8cc6c5db7`; its `pdftotext` SHA-256 is `db8df9c2e9e91807508225f555635b17497a119630f32569c728df99fc0c6d3c`.

## Authoritative raw inputs

Exact-Q4_K_M fixture runs:

- `_workspace/current/qa/evidence/stage-1/fixture-run-qwen0_5b-schema/`
- `_workspace/current/qa/evidence/stage-1/fixture-run-qwen1_5b/`
- `_workspace/current/qa/evidence/stage-1/fixture-run-qwen3b/`

Each run must contain the fixture and index manifests, copied query manifest, corpus/query hash files, assertion rows, streams, correlated spans, canary scan, command, allowlisted environment, timestamps, duration, exit code, stdout, and stderr.

Isolated CocoIndex evidence:

- `_workspace/current/engineering/evidence/stage-1/cocoindex-experiment-baseline.txt`
- `_workspace/current/engineering/evidence/stage-1/cocoindex-experiment-noop.txt`
- `_workspace/current/engineering/evidence/stage-1/cocoindex-experiment-one-change.txt`
- `_workspace/current/engineering/evidence/stage-1/cocoindex-experiment-target-row.txt`

The builder also recomputes the corpus hash from:

- `services/game-log-search/fixtures/sim-game-logs-v1/logs/**/*.jsonl`

## Derived outputs

- `results/run_summary.csv`: one row per model arm, including common hashes/profile, record/query counts, exact assertion counts, schema/semantic categories, full-run duration, exit code, and raw path.
- `results/query_results.csv`: one row per model/query observation with identities, outcome/owner, duration, evidence IDs, assertion failures, schema/semantic status, token fields, and raw paths.
- `results/assertions.csv`: 420 independently reconstructed assertion rows with raw assertion path.
- `results/retrieval_by_query.csv`: ordered retrieval IDs, Recall@5 numerators/denominators, exact-ID rank where defined, snapshot, and raw stream path.
- `results/canary_summary.csv`: five raw canary counters, explicit instrumentation boundary, and source path.
- `results/cocoindex_incremental.csv`: baseline/no-op/one-change file classifications, displayed elapsed observation, and source path.
- `results/cocoindex_target_row.csv`: isolated post-change target row and source path.
- `figures/assertions-and-semantics.pdf`: assertion totals and Q01/Q03 terminal states.
- `figures/latency-q01-q03.pdf`: raw whole-case latency for Q01/Q03; no error bars.
- `figures/incremental-dataflow.pdf`: isolated added/reprocessed/unchanged classifications.

## Evidence boundaries

- There is one ten-query run per model arm and only Q01/Q03 are normal synthesis-dependent cases. Comparisons are descriptive.
- A synthesis timeout is classified as `synthesis_schema_status=not_observed`, not schema-valid or schema-invalid.
- The three raw model runs predate the production validator's generalization. The current gate no longer embeds P42, incident-184, or E001/E004/E006/E009 branches; fixture-specific expected values and IDs remain in the fixture-runner oracle. Regeneration re-derives the historical run tables and does not re-execute the current synthesizer, so these results do not evaluate the generalized gate.
- `synthesis_schema_status=valid` means a draft reached semantic validation; it does not mean the draft passed semantic strictness.
- Per-case duration includes fixture setup, including construction of a sentence-transformer embedder; it is not isolated model latency.
- The CocoIndex displayed elapsed values are single tool observations, not a throughput benchmark.
- The fixture runner observes its own `httpx` requests and serialized streams. Its cached-answer and prior-knowledge counters are constants, so the canary output is not proof of browser-, process-, or host-wide network isolation.
- No hardware metadata, repeated trials, confidence intervals, p-values, percentiles, privacy guarantees, user study, or production-scale evidence is present.
