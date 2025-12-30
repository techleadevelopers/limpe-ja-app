# Auth Error Contract

Server-side 401 and 403 responses now return a predictable payload so the client can distinguish expiration vs revocation without parsing unstructured text:

```
{
  statusCode: 401 | 403,
  message: string,                // translated/friendly text
  code: 'TOKEN_EXPIRED' | 'TOKEN_REVOKED' | 'UNAUTHORIZED',
  requestId?: string              // echoes `x-request-id` / `X-Client-Request-Id`
}
```

- `TOKEN_EXPIRED` is issued by the `JwtAuthGuard` when the token's `exp` is in the past.
- `TOKEN_REVOKED` is used whenever the guard cannot find the user (logout, account deletion, revoke events).
- `UNAUTHORIZED` is the fallback for generic 401/403s.
- `requestId` is included whenever the incoming request already carried `x-request-id`/`X-Client-Request-Id` so the client can correlate logs.

`POST /auth/logout-device` (protected by `JwtAuthGuard`) removes the push token associated with the current session and resolves with `{ message: 'Token do dispositivo removido com sucesso.' }`. Clients should call it before clearing local state.

