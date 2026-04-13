# Security & Secrets

## Goal

사용자 또는 테넌트 단위의 제공자 API 키를 DB에 저장하되, 저장 시점과 사용 시점 모두 서버 경계 안에서만 처리한다.

## Storage Model

Recommended logical record:

```json
{
  "tenantId": "tenant_123",
  "provider": "gemini",
  "label": "primary-search-key",
  "ciphertext": "...",
  "nonce": "...",
  "authTag": "...",
  "aad": "tenant_123:gemini:v1",
  "keyVersion": "v1",
  "algorithm": "aes-256-gcm",
  "createdAt": "2026-04-13T00:00:00.000Z",
  "updatedAt": "2026-04-13T00:00:00.000Z",
  "lastUsedAt": null,
  "rotatedAt": null
}
```

## Encryption Boundary

- Browser never sees raw provider keys after initial admin submit.
- API receives raw key over authenticated HTTPS only.
- API encrypts before DB write.
- DB stores ciphertext only.
- API decrypts only inside a dedicated secrets service immediately before provider use.
- Monitoring and logs never record raw key material.

## Initial Implementation

Initial scaffold uses AES-256-GCM envelope encryption with a server-managed master key loaded from environment or Firebase Secret Manager.

Required server env:

- `SECRET_ENCRYPTION_KEY`
- `SECRET_ENCRYPTION_KEY_VERSION`
- `FIREBASE_SERVICE_ACCOUNT_PATH`

## Production Upgrade Path

Phase 1:

- Application-managed AES-GCM key in secret manager
- Firestore for encrypted records

Phase 2:

- Cloud KMS envelope encryption
- Per-tenant key version rotation
- Audit log on save/read/rotate/delete

## Guardrails

- Do not commit service-account JSON or provider keys.
- Do not persist raw key values in React state, browser storage, analytics, or error payloads.
- Do not return decrypted keys from any API.
- Restrict provider-key routes to admin role only.

