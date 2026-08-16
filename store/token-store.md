---
type: Concept
title: Token Store — Persistence
description: "Token persistence contract: TokenStore interface, FileStore CSV implementation, and guidance for implementing custom stores."
tags: [token-store, persistence, token]
---

# Token Store — Persistence

The token store system provides pluggable persistence for OAuth tokens, allowing the SDK to save, find, and delete tokens between application restarts.

## TokenStore Interface

`src/store/token-store.ts`

```typescript
interface TokenStore {
  findToken(token: Token): Promise<Token | null>;
  findTokenById(id: string): Promise<Token | null>;
  saveToken(token: Token): Promise<void>;
  deleteToken(id: string): Promise<void>;
  getTokens(): Promise<Token[]>;
  deleteTokens(): Promise<void>;
}
```

## FileStore (CSV Implementation)

`src/store/file-store.ts`

The default implementation that persists tokens to a CSV file with the following columns:

```
id, client_id, client_secret, refresh_token, access_token, grant_token, expiry_time, redirect_url, grant_type, scope, org_id
```

**File creation:** The file is created with headers on construction if it doesn't exist.

**Thread safety:** Uses a serializing lock pattern (a chain of promises) to prevent concurrent read/write races:

```typescript
private async serialize<T>(fn: () => Promise<T>): Promise<T> {
  const prev = this._lock;
  let release!: () => void;
  this._lock = new Promise<void>((resolve) => { release = resolve; });
  await prev;
  try { return await fn(); }
  finally { release(); }
}
```

**Token matching in `findToken()`** (lines 83–117):
Iterates stored tokens and matches by:
1. `clientId` + `grantType` — first priority
2. `grantToken` value — second priority
3. `refreshToken` value — third priority (if no grantToken)

**Token ID:** Generated externally (not by the store). The caller (or consumer) sets the ID via `token.setId()`. The ID is used for `findTokenById()` and `deleteToken()`.

## Implementing a Custom Store

To create a custom token store (e.g., database-backed, encrypted, cloud-based):

```typescript
import type { TokenStore, Token } from "@banana.inc/zoho-desk-nodejs-sdk";

class MyDatabaseStore implements TokenStore {
  async findToken(token: Token): Promise<Token | null> {
    // Match by clientId + grantType, or grantToken, or refreshToken
  }
  async findTokenById(id: string): Promise<Token | null> {
    // Direct ID lookup
  }
  async saveToken(token: Token): Promise<void> {
    // Persist all token fields
  }
  async deleteToken(id: string): Promise<void> {
    // Remove by ID
  }
  async getTokens(): Promise<Token[]> {
    // Return all stored tokens
  }
  async deleteTokens(): Promise<void> {
    // Clear all tokens
  }
}
```

Then supply it during initialization:

```typescript
await new InitializeBuilder()
  .environment(USDataCenter.PRODUCTION())
  .token(token)
  .store(new MyDatabaseStore())
  .initialize();
```

## How Tokens Flow Through the Store

1. **Initialization:** `token.setStore(store)` is called in `Initializer.initialize()`
2. **On Authentication:** `OAuthToken.authenticate()` calls `store.findToken()` to check for a previously saved token
3. **On Token Acquisition/Refresh:** After a successful token request, `store.saveToken()` is called in each private method:
   - `refreshAccessToken()` — saves on refresh
   - `generateAccessToken()` — saves on authorization code exchange
   - `clientCredentialsAccessToken()` — saves on client credentials grant
4. **On Revocation:** `OAuthToken.revoke()` calls `store.deleteToken()` via `this.remove()`
5. **On Remove:** `OAuthToken.remove()` calls `store.deleteToken(this._id)`

## Source References

- `src/store/token-store.ts` — interface (13 lines)
- `src/store/file-store.ts` — CSV implementation (200+ LOC)
- `src/auth/oauth-token.ts` — store usage in `authenticate()`, `refreshAccessToken()`, `generateAccessToken()`, `clientCredentialsAccessToken()`, `remove()`

## Related Tests

- `tests/file-store.test.ts` — file creation, save/find/delete, ID lookup, getTokens, deleteTokens, thread safety

### Minimal Validation

```bash
npx vitest run tests/file-store.test.ts
```

## Related Pages

- [OAuth Overview](../auth/oauth-overview.md) — how the store is used in the authenticate flow
- [Configuration](../domain/configuration.md) — how the store is wired during initialization