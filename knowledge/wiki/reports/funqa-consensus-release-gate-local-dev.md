# Consensus Release Gate Report

## Metadata

- Report version: `funqa-consensus-report-v1`
- Generated at: `2026-07-02T13:43:52.941Z`
- Build SHA: `local-dev`
- Dataset version: `fq_eval_fixture_v1`
- Policy version: `funqa-consensus-rag-v1`
- Dataset path: `/Users/jangyoung/.superset/projects/saas-of-funqa/data/evals/fixtures/funqa-consensus-eval-fixture.json`

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
