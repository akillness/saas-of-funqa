# Security Policies

## Authentication
- Handled via Firebase Auth (defined in `packages/auth`).
- The API verifies Firebase Auth tokens on protected routes.

## Database Access
- Firestore Rules (`infra/firestore.rules`) provide the primary data security boundary for direct client access.
- Admin SDK (`firebase-admin`) is used in `apps/api` and `functions/` and bypasses rules. Ensure business logic validates permissions before accessing data on behalf of a user.

## Secrets
- Never commit `.env` or service account keys (e.g., `saas-of-funqa-firebase-adminsdk-*.json`).
- Use Firebase Secret Manager or environment variables for API keys in Cloud Functions.
