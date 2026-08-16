---
type: Concept
title: Exception Handling
description: "SDK exception hierarchy: SDKException for configuration/initialization/token errors and ZohoApiError for API response errors. Complete error code reference."
tags: [exceptions, errors, error-handling]
openwiki:
  roles: [domain]
  change_kinds: [public-api]
  source_paths: [src/exception/sdk-exception.ts, src/exception/zoho-api-error.ts, src/http/zoho-error-middleware.ts]
  symbols: [SDKException, ZohoApiError]
  test_paths: [tests/sdk-exception.test.ts, tests/zoho-error-middleware.test.ts]
  validation_commands: [npx vitest run tests/sdk-exception.test.ts tests/zoho-error-middleware.test.ts]
---

# Exception Handling

The SDK defines two custom error classes: `SDKException` for internal errors and `ZohoApiError` for API response errors.

## SDKException

`src/exception/sdk-exception.ts`

Used for all SDK-internal errors: missing configuration, invalid parameters, token errors, etc.

```typescript
class SDKException extends Error {
  code: string;                         // Machine-readable error code
  details: Record<string, unknown> | null;  // Additional error context
  cause: Error | null;                  // Original error (if wrapping)
  name: "SDKException";
}
```

The `message` is automatically augmented with JSON-serialized `details` and `cause.toString()` when those are present.

```typescript
override toString(): string {
  return `Caused By : [${this.code}] - ${this.message}`;
}
```

### Error Codes

| Code | Source | Description |
|---|---|---|
| `MANDATORY_VALUE_ERROR` | `OAuthBuilder.build()`, `AuthorizationUrlBuilder.build()`, `ProxyBuilder.build()` | Required parameter missing |
| `INITIALIZATION_ERROR` | `InitializeBuilder.initialize()` | Environment or token missing |
| `SDK_UNINITIALIZATION_ERROR` | `Initializer.getInitializer()` | Called `createDeskClient()` without initializing |
| `TOKEN_ERROR` | `OAuthToken.authenticate()` | Expired non-refreshable token, failed refresh/generation |
| `TOKEN_REVOKE_ERROR` | `OAuthToken.revoke()` | Revocation request failed |
| `TOKEN_STORE_ERROR` | `FileStore` (all methods) | CSV read/write failed |
| `DEVICE_AUTH_ERROR` | `device-auth.ts` | Device code request failure, polling errors, access denied, timeout |
| `INITIALIZATION_ERROR` (warn) | `Initializer.initialize()` | Eager token generation failed (non-fatal) |

## ZohoApiError

`src/exception/zoho-api-error.ts`

Thrown when the Zoho Desk API returns a non-2xx, non-3xx response. Implements Kiota's `ApiError` interface.

```typescript
class ZohoApiError extends Error implements ApiError {
  errorCode: string | undefined;                 // e.g., "INTERNAL_SERVER_ERROR"
  responseBody: Record<string, unknown> | undefined;  // Parsed JSON body
  rawBody: string | undefined;                   // Raw body text (if non-JSON)
  responseStatusCode: number | undefined;        // HTTP status code
  responseHeaders: Record<string, string[]> | undefined;
  requestUrl: string | undefined;
  name: "ZohoApiError";
}
```

### Error Response Shapes

Zoho error responses are parsed in `ZohoErrorMiddleware` (`src/http/zoho-error-middleware.ts`). The middleware attempts to extract error details from the JSON body, trying these field names in order:

1. `errorCode` (string)
2. `message` (string), fallback to `errorMessage`, fallback to `error`

The `message` property of `ZohoApiError` is composed as:
```
"Zoho API error {statusCode}: [{errorCode}] {message}"
```

### Error Categories

| Response Type | ZohoApiError Properties |
|---|---|
| JSON with Zoho error fields | `errorCode`, `responseBody`, `message` with details |
| JSON with only `error` field | `responseBody`, message from `error` field |
| Non-JSON body (e.g., HTML) | `rawBody`, message "Zoho API error: HTTP {status} (non-JSON response)" |
| Empty body | message "Zoho API error: HTTP {status} (empty response body)" |
| 2xx or 3xx | Not thrown (pass-through) |

## Examples

```typescript
import { SDKException, ZohoApiError } from "@banana.inc/zoho-desk-nodejs-sdk";

try {
  const tickets = await client.ticket.get();
} catch (err) {
  if (err instanceof ZohoApiError) {
    console.error(`Zoho API error [${err.responseStatusCode}]: ${err.errorCode} - ${err.message}`);
    console.error(`Request URL: ${err.requestUrl}`);
    console.error(`Response body:`, err.responseBody);
  } else if (err instanceof SDKException) {
    console.error(`SDK error [${err.code}]: ${err.message}`);
  } else {
    console.error("Unexpected error:", err);
  }
}
```

## Source References

- `src/exception/sdk-exception.ts` — internal error class (33 lines)
- `src/exception/zoho-api-error.ts` — API error class (33 lines)
- `src/http/zoho-error-middleware.ts` — error middleware that throws ZohoApiError (100 lines)
- `src/store/file-store.ts` — wraps file I/O failures in `SDKException` with `TOKEN_STORE_ERROR`

## Related Tests

- `tests/sdk-exception.test.ts` — error construction, message formatting, toString behavior
- `tests/zoho-error-middleware.test.ts` — 10 tests covering all error response categories

### Minimal Validation

```bash
npx vitest run tests/sdk-exception.test.ts tests/zoho-error-middleware.test.ts
```

## Related Pages

- [Request Pipeline](../http/request-pipeline.md) — how ZohoErrorMiddleware intercepts error responses
- [OAuth Overview](../auth/oauth-overview.md) — error codes from token operations
- [Grant Flows](../auth/grant-flows.md) — device auth error conditions