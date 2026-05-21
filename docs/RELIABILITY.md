# Reliability Standards

## SLA / SLO
- The web app and API are hosted on Firebase, relying on its uptime.
- **RAG Pipeline**: Responses must have graceful degradation if Genkit/LLM fails.

## Error Handling
- Use structured errors.
- Do not expose internal stack traces to the client.
- Functions must be idempotent where possible.

## Incident Response
- Check Firebase Console for App Hosting and Cloud Functions logs.
- RAG pipeline errors will be logged in Cloud Logging via `packages/monitoring`.
