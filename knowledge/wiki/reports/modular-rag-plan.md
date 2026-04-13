# Modular RAG Plan

## Summary

RAG must be verifiable before it is sophisticated. The system now treats each processing step as its own minimal module so ingest and search can be tested end to end without hosted model dependencies.

## Process Units

- normalize
- extract
- chunk
- embed
- index
- retrieve
- answer

## Verification Rule

Every module should be callable in-process, and the whole pipeline should be runnable through one smoke test using a deterministic local embedding backend.

