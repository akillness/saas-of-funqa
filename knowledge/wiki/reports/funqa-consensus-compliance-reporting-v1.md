# FunQA Consensus Compliance Reporting V1

## Summary

FunQA V1 release approval uses one frozen `Consensus Release Gate Report` rather than a rolling production average.

## Decision

- Aggregation window:
  - one complete run of the frozen curated evaluation set against one release-candidate build SHA
  - completed within the final `24 hours` before the launch decision
  - if rerun for the same SHA, only the latest completed run is authoritative
  - if the SHA changes, the report must be regenerated
- Calculation:
  - `consensusAgreementRate = passedConsensusCases / eligibleConsensusCases`
  - eligible cases include both expected synthesis passes and expected evidence-only safety cases
  - a case passes only when the observed `consensusGate` decision and output mode match the expected safe outcome
- Threshold:
  - release requires `consensusAgreementRate >= 0.90`
- Approval artifact:
  - operator-facing `rag-lab` release-gate dashboard panel
  - persisted stable report pair under `knowledge/wiki/reports/` for the evaluated build SHA:
    - canonical JSON payload for machine comparison
    - canonical markdown rendering for operator inspection
  - release-decision packet members retained alongside the report pair:
    - frozen dataset manifest and case payload set
    - per-case evidence bundle export
    - canonical `consensus.outcome` telemetry export
    - integrity manifest with artifact hashes
    - approval record for the final release state

## Required Report Fields

- report-format version
- build SHA
- report timestamp
- eval set version
- dataset path or manifest pointer
- total frozen case count
- evaluated total case count
- evaluated boundary-control case count
- total boundary-control case count
- passed, eligible, and failed case counts
- agreement percent
- aggregate raw-agreement mean, min, and max across evaluated consensus cases
- aggregate outcome-conformance mean plus decision-match and answer-mode-match rates
- pass/fail line against the `90%` threshold
- release state and score-band classification
- `documentSnapshotId` and `graphSnapshotId`
- graph-core retrieval compliance result for the same release window
- artifact-integrity status
- replayability status
- failure-reason breakdown
- per-case rows including case ID, verdict, eligibility, observed decision, observed answer mode, observed agreement, threshold, decision-match, answer-mode-match, outcome-conformance, primary reason code, trace ID, and evidence bundle handle
- links or stable handles to failing cases with retrieved docs, graph paths, and final output mode
- optional non-blocking latency appendix with percentile and stage-breakdown summaries, clearly labeled as informational only

## Retained Evidence Requirements

- Retain one immutable release-decision packet per authoritative release run.
- Permanent packet members:
  - markdown report
  - JSON report
  - integrity manifest
  - approval record
  - frozen dataset manifest referenced by the decision
- Retain for at least `365 days`:
  - per-case evaluation evidence export
  - canonical `consensus.outcome` telemetry export
  - trace export or trace-linked event payload export for the run
  - structured log export required to verify the telemetry
- Treat the release as not auditable if any required retained artifact cannot be read, cannot be hash-verified, or no longer matches the recorded build SHA, dataset version, document snapshot, graph snapshot, or policy version

## Non-Blocking Latency Observability

- Latency measurements for ingest, retrieval, consensus evaluation, response assembly, and total request handling are allowed in the release-review dashboard and report appendix as operator-facing observability only.
- These measurements must not change the release verdict, merge decision, threshold calculation, score band, or approval state in V1.
- Missing, delayed, or regressed latency summaries do not by themselves fail the authoritative `Consensus Release Gate Report`.
- If included, latency summaries must link to retained observability exports or warehouse queries kept for at least `30 days`, separate from the immutable blocking release packet.

## Example Output Shape

Example machine-readable decision summary:

```json
{
  "decisionId": "funqa-release-baseline-ccc4bde-fq_eval_v1",
  "releaseState": "clear-pass",
  "buildSha": "baseline-ccc4bde",
  "datasetVersion": "fq_eval_v1",
  "policyVersion": "funqa-consensus-rag-v1",
  "documentSnapshotId": "docs-2026-04-22",
  "graphSnapshotId": "graph-2026-04-22",
  "releaseEligibleConsensusSuccessRate": 0.94,
  "consensusAgreementThreshold": 0.9,
  "graphCoreRetrievalCompliance": 1,
  "artifactIntegrityStatus": "verified",
  "replayabilityStatus": "replayable",
  "retainedArtifacts": [
    "report.json",
    "report.md",
    "case-bundles.jsonl",
    "consensus-outcome-events.jsonl",
    "integrity-manifest.json"
  ]
}
```

Example operator summary:

```md
- Release state: `clear-pass`
- Build SHA: `baseline-ccc4bde`
- Consensus success rate: `94.0%`
- Graph-core retrieval compliance: `100.0%`
- Artifact integrity: `verified`
- Replayability: `replayable`
```

## Why This Shape

- It matches the launch gate to the exact release candidate instead of hiding regressions inside a rolling average.
- It counts safe evidence-only behavior as success when disagreement is the correct answer.
- It keeps launch review inspectable through `rag-lab` while preserving a durable markdown artifact in the repo.
- It makes the release decision replayable and auditable after launch because the report is paired with retained case, trace, and telemetry evidence rather than screenshots or mutable dashboards.

## References

- [FunQA Consensus RAG V1](/Users/jangyoung/.superset/projects/saas-of-funqa/docs/spec/funqa-consensus-rag-v1.md)
