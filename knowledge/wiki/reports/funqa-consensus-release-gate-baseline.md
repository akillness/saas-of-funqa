# Consensus Release Gate Report

## Metadata

- Report version: `funqa-consensus-report-v1`
- Generated at: `2026-04-22T15:37:53.431Z`
- Build SHA: `baseline-ccc4bde`
- Dataset version: `fq_eval_fixture_v1`
- Policy version: `funqa-consensus-rag-v1`
- Dataset path: `/Users/jangyoung/.superset/projects/saas-of-funqa/data/evals/fixtures/funqa-consensus-eval-fixture.json`
- Decision ID: `funqa-release-baseline-ccc4bde-fq_eval_fixture_v1`
- Release state: `clear-pass`
- Document snapshot ID: `docs-2026-04-22`
- Graph snapshot ID: `graph-2026-04-22`
- Artifact integrity status: `verified`
- Replayability status: `replayable`

## Aggregate Agreement

- Evaluation status: `pass`
- Agreement threshold: `90.0%`
- Overall agreement rate: `100.0%`
- Threshold confirmation: `100.0% >= 90.0%` (meets or exceeds threshold)
- Eligible consensus cases: `1`
- Evaluated eligible cases: `1`
- Passed consensus cases: `1`
- Failed consensus cases: `0`
- Total frozen cases: `2`
- Evaluated total cases: `2`
- Total boundary-control cases: `1`
- Evaluated boundary-control cases: `1`
- Raw agreement mean/min/max: `0.0% / 0.0% / 0.0%`
- Outcome-conformance mean: `100.0%`
- Decision-match rate: `100.0%`
- Answer-mode-match rate: `100.0%`
- Graph-core retrieval compliance: `100.0%`

## Failure Reasons

| Reason code | Count |
| --- | ---: |
| none | 0 |

## Per-Case Results

| Case ID | Verdict | Decision | Answer Mode | Agreement | Decision Match | Answer Mode Match | Outcome Conformance | Reasons |
| --- | --- | --- | --- | ---: | --- | --- | ---: | --- |
| fq_eval_fixture_case_01_graph_unavailable | pass | evidence-only | evidence-only | 0.0% | yes | yes | 100.0% | graph-coverage-unavailable |
| fq_eval_fixture_case_02_member_boundary | not-applicable | non-applicable | deterministic-response | 0.0% | yes | yes | 100.0% | none |

## Comparison Handles

- Missing case IDs: none
- Failing case IDs: none

## Retained Evidence

| Artifact | Handle | Retention |
| --- | --- | --- |
| Canonical JSON report | `funqa-consensus-release-gate-baseline.json` | permanent |
| Canonical Markdown report | `funqa-consensus-release-gate-baseline.md` | permanent |
| Per-case evidence bundle export | `funqa-consensus-release-gate-baseline.case-bundles.jsonl` | 365 days minimum |
| Consensus outcome telemetry export | `funqa-consensus-release-gate-baseline.events.jsonl` | 365 days minimum |
| Integrity manifest | `funqa-consensus-release-gate-baseline.integrity.json` | permanent |

## Audit Checks

- Packet hash verification: `pass`
- Build/snapshot consistency: `pass`
- Blocked-case evidence-only verification: `pass`
- Replayability from retained artifacts: `pass`
