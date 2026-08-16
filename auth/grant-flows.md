---
type: Concept
title: OAuth Grant Flows
description: "Detailed documentation of all 7 OAuth grant types in the Zoho Desk SDK: refresh token, authorization code, client credentials, device code, implicit, direct access token, and stored token. Includes sequence diagrams."
tags: [oauth, grant-flows, authentication]
openwiki:
  roles: [domain, integration]
  change_kinds: [lifecycle, public-api]
  source_paths: [src/auth/oauth-builder.ts, src/auth/authorization-url.ts, src/auth/pkce.ts, src/auth/device-auth.ts]
  symbols: [OAuthBuilder, AuthorizationUrlBuilder, parseImplicitFragment, generateCodeVerifier, generateCodeChallenge, generatePKCEPair, requestDeviceCode, pollForDeviceToken]
  test_paths: [tests/authorization-url.test.ts, tests/client-credentials.test.ts, tests/device-auth.test.ts, tests/pkce.test.ts, tests/oauth-builder.test.ts]
  invariants: ["CLIENT_CREDENTIALS requires clientId, clientSecret, scope, and orgId; device polling handles authorization_pending and slow_down by retrying and +5s backoff until expires_in elapses; PKCE challenge is SHA-256 base64url."]
  validation_commands: [npx vitest run tests/authorization-url.test.ts tests/client-credentials.test.ts tests/device-auth.test.ts tests/pkce.test.ts tests/oauth-builder.test.ts]
---

# OAuth Grant Flows

The SDK supports 7 OAuth grant types through `OAuthBuilder` and dedicated auth modules. Each grant type produces an `OAuthToken` that implements the same `authenticate()` lifecycle (see [OAuth Overview](./oauth-overview.md)).

## Grant Type Reference

| OAuthGrantType | Builder Method | Key Fields | Use Case |
|---|---|---|---|
| `REFRESH_TOKEN` | `.refreshToken("...")` | clientId, clientSecret, refreshToken | Server-side long-lived access |
| `AUTHORIZATION_CODE` | `.grantToken("...")` | clientId, clientSecret, grantToken, redirectURL, (codeVerifier) | Web app OAuth callback |
| `CLIENT_CREDENTIALS` | `.clientCredentials()` | clientId, clientSecret, scope, orgId | Server-to-server |
| `DEVICE_CODE` | N/A (dedicated `requestDeviceCode()` / `pollForDeviceToken()`) | clientId, clientSecret, scope | Headless/IoT devices |
| `IMPLICIT` | `.build()` + `parseImplicitFragment()` | accessToken, expiresIn | Legacy browser apps |
| `ACCESS_TOKEN` | `.accessToken("...")` | accessToken | Quick testing |
| `STORED` | `.id("...")` | id, store | Resuming persisted session |

## Refresh Token Flow

```mermaid
sequenceDiagram
    participant App as Your App
    participant Token as OAuthToken
    participant Store as TokenStore
    participant Zoho as Zoho Accounts

    App->>Token: authenticate(environment)

    Note over Token: check store

    Token->>Store: findToken(token)
    Store-->>Token: null (first time)

    Note over Token: check expiry (no accessToken yet)

    Token->>Token: has refreshToken → refreshAccessToken()

    Token->>Zoho: POST /oauth/v2/token (grant_type=refresh_token, refresh_token, client_id, client_secret)
    Zoho-->>Token: {access_token, expires_in, refresh_token?}

    Token->>Token: set accessToken, expiresIn
    Token->>Store: saveToken(token)
    Store-->>Token: OK

    Token-->>App: access_token string

    Note over App: Later...

    App->>Token: authenticate(environment)
    Token->>Store: findToken(token)
    Store-->>Token: storedToken (with accessToken, expiresIn)

    Token->>Token: Date.now() < expiresIn - 5s? → return cached
    Token-->>App: access_token string (cached)

    Note over App: After expiry window...

    App->>Token: authenticate(environment)
    Token->>Store: findToken(token)
    Store-->>Token: storedToken (expired)
    Token->>Token: has refreshToken → refreshAccessToken()
    Token->>Zoho: POST /oauth/v2/token (refresh)
    Zoho-->>Token: {new access_token}
    Token->>Store: saveToken(token)
    Token-->>App: new access_token string
```

## Authorization Code with PKCE Flow

```mermaid
sequenceDiagram
    participant App as Your App
    participant User as Browser User
    participant Zoho as Zoho Accounts
    participant Token as OAuthToken

    App->>App: generatePKCEPair() → {codeVerifier, codeChallenge}

    App->>App: AuthorizationUrlBuilder with .pkce(pair)
    App->>User: redirect to authorization URL (with code_challenge=S256)

    User->>Zoho: user authorizes
    Zoho-->>App: redirect with ?code=authorization_code

    App->>Token: new OAuthToken({grantToken, codeVerifier, ...})
    App->>Token: authenticate(environment)

    Token->>Zoho: POST /oauth/v2/token (grant_type=authorization_code, code, code_verifier)
    Zoho-->>Token: {access_token, refresh_token, expires_in}

    Token->>App: access_token string
```

## Client Credentials Flow

```mermaid
sequenceDiagram
    participant App as Your App
    participant Token as OAuthToken
    participant Store as TokenStore
    participant Zoho as Zoho Accounts

    App->>App: new OAuthBuilder().clientCredentials().build()
    App->>Token: authenticate(environment)

    Note over Token: grantType === CLIENT_CREDENTIALS
    Note over Token: no store lookup needed

    Token->>Zoho: POST /oauth/v2/token (grant_type=client_credentials, soid=Desk.{orgId})
    Zoho-->>Token: {access_token, expires_in}

    Token->>Store: saveToken(token)
    Token-->>App: access_token string

    Note over App: On next call (expired)...

    Token->>Zoho: POST /oauth/v2/token (same params)
    Zoho-->>Token: {new access_token}
    Token->>Store: saveToken(token)
    Token-->>App: new access_token string
```

## Device Authorization Flow

```mermaid
sequenceDiagram
    participant App as Your App
    participant User as User
    participant Zoho as Zoho Accounts
    participant Device as Device Auth

    App->>Zoho: requestDeviceCode(env, clientId, scope)
    Zoho-->>App: {device_code, user_code, verification_url, expires_in, interval}

    App->>User: "Visit {verification_url} and enter code {user_code}"

    Note over App, User: User opens browser, authorizes

    par Polling Loop
        App->>Zoho: POST /oauth/v2/token (grant_type=device_code, code=device_code)
        Note over Zoho: while authorization_pending
        Zoho-->>App: {error: "authorization_pending"}
        App->>App: wait interval ms

        Note over Zoho: user authorized
        App->>Zoho: POST /oauth/v2/token
        Zoho-->>App: {access_token, refresh_token, expires_in}
    end

    App->>App: create OAuthToken from response
    App-->>App: token ready
```

## Key Source Files

- **OAuthBuilder** — `src/auth/oauth-builder.ts` (130 LOC). Validates required fields per grant type in `build()`.
- **AuthorizationUrlBuilder** — `src/auth/authorization-url.ts` (100 LOC). Builds OAuth consent URLs. Supports PKCE via `.pkce()`.
- **PKCE** — `src/auth/pkce.ts` (52 LOC). `generateCodeVerifier()`, `generateCodeChallenge()`, `generatePKCEPair()` using `node:crypto`.
- **Device Auth** — `src/auth/device-auth.ts` (210 LOC). `requestDeviceCode()` and `pollForDeviceToken()` with AbortSignal support.
- **Authorization URL parsing** — `src/auth/authorization-url.ts` also exports `parseImplicitFragment()` for extracting tokens from `#` fragments.

## Key Contracts and Invariants

### OAuthBuilder.build() Validation
- **CLIENT_CREDENTIALS**: clientId, clientSecret, scope, orgId all required
- **All other grants with grantToken/refreshToken**: clientId and clientSecret required
- **At least one of**: grantToken, refreshToken, accessToken, or id must be provided

### Device Auth Polling (`pollForDeviceToken`)
- Polls `POST {accountsUrl}` (the Zoho accounts token endpoint) with `grant_type=device_code` and `code=device_code`, at an interval taken from the device-code response (default 5s)
- Handles `authorization_pending` (retry), `slow_down` (increase interval by 5s and notify `onPoll("slow_down")`), `expired_token` (throw), `access_denied` (throw)
- Supports `AbortSignal` for cancellation, checked both before and after the sleep
- `onPoll` callback receives status updates (`"authorization_pending"`, `"slow_down"`, `"success"`)
- Respects the `expires_in` window from the device-code response; throws `DEVICE_AUTH_ERROR` if the window elapses without success
- `requestDeviceCode` posts to `environment.getDeviceCodeUrl()` (derived from the accounts URL by replacing `/token` with `/device/code`) and accepts `verification_uri` as a fallback for `verification_url`

### PKCE
- Code verifier: 43–128 URL-safe characters, `node:crypto.randomBytes`
- Code challenge: SHA-256 digest → base64url (no padding)
- RFC 7636 Appendix B test vector verified in `tests/pkce.test.ts`

## Related Tests

- `tests/authorization-url.test.ts` — URL building with various parameters, PKCE inclusion
- `tests/client-credentials.test.ts` — builder validation + token request (including `soid` parameter)
- `tests/device-auth.test.ts` — device code request, polling with various error states, success
- `tests/pkce.test.ts` — verifier size/clamping, challenge output, RFC 7636 test vector
- `tests/oauth-builder.test.ts` — builder validation for all grant type combinations

### Minimal Validation

```bash
npx vitest run tests/authorization-url.test.ts tests/client-credentials.test.ts tests/device-auth.test.ts tests/pkce.test.ts tests/oauth-builder.test.ts
```

## Related Pages

- [OAuth Overview](./oauth-overview.md) — authenticate() lifecycle, token caching, persistence
- [Token Store](../store/token-store.md) — how stored tokens are persisted and loaded
- [Data Centers](../dc/datacenters.md) — environment URL resolution for each grant type
- [Exceptions](../domain/exceptions.md) — error codes specific to OAuth operations