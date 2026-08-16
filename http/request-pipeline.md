---
type: Concept
title: Request Pipeline — HTTP Middleware & Transport
description: "How the Kiota FetchRequestAdapter is created with Zoho middleware, proxy, and retry configuration. Covers middleware ordering, error translation, and the EmptyQueryParamMiddleware fix."
tags: [http, middleware, request-pipeline, kiota]
---

# Request Pipeline — HTTP Middleware & Transport

The HTTP transport layer is built on Kiota's `FetchRequestAdapter` with a custom middleware chain that handles Zoho-specific requirements. The adapter is created by `createRequestAdapter()` in `src/http/zoho-http-client.ts`.

## Middleware Chain Order

<!-- openwiki: mermaid parse failed and this diagram was converted to a text fence so it does not break rendering. Fix the diagram source and restore the mermaid fence. Parser error: Parse error on line 3: ...->|adapter.sendAsync()| B[FetchRequestAd Expecting 'SQE', 'DOUBLECIRCLEEND', 'PE', '-)', 'STADIUMEND', 'SUBROUTINEEND', 'PIPE', 'CYLINDEREND', 'DIAMOND_STOP', 'TAGEND', 'TRAPEND', 'INVTRAPEND', 'UNICODE_TEXT', 'TEXT', 'TAGSTART', got 'PS' -->
```text
flowchart LR
    A[Generated Request Builder]
    A -->|adapter.sendAsync()| B[FetchRequestAdapter]
    B --> C[EmptyQueryParamMiddleware]
    C --> D[ZohoErrorMiddleware]
    D --> E[RetryHandler (custom)]
    E --> F[Kiota Default Middlewares]
    F -->|custom fetch| G[Node fetch via undici]
    G --> H[Zoho Desk API]

    H -.->|non-2xx response| D
    D -.-> I[ZohoApiError]
```

The middleware array is built in `createRequestAdapter()` with a specific ordering (lines 40–58):

```typescript
const middlewares = MiddlewareFactory.getDefaultMiddlewares(customFetch);

// Insert error middleware first so it runs AFTER retry/redirect in the response flow
middlewares.unshift(new ZohoErrorMiddleware());

// Strip empty query params before anything else (fixes orgId="" → HTTP 500)
middlewares.unshift(new EmptyQueryParamMiddleware());
```

The `unshift()` calls mean:
1. **Last in, first executed in request direction**: `EmptyQueryParamMiddleware` runs first on request (URL cleaning), last on response
2. **First in, first in response direction**: `ZohoErrorMiddleware` is inside `EmptyQueryParamMiddleware`, so it receives the response after `RetryHandler` — meaning retries for 429/503/504 happen transparently before error translation

## EmptyQueryParamMiddleware

`src/http/empty-query-param-middleware.ts`

**Problem:** The Zoho OAS marks some params (e.g. `orgId`) as required, causing Kiota to hardcode them in URI templates. When not provided, they expand to `?orgId=`, which the Zoho API rejects with HTTP 500.

**Solution:** This middleware strips any query parameters with empty string values from the URL before the request proceeds.

```typescript
async execute(url, requestInit, requestOptions): Promise<Response> {
  const cleanedUrl = this.stripEmptyParams(url);
  return this.next.execute(cleanedUrl, requestInit, requestOptions);
}
```

**Behavior (from tests in `tests/empty-query-param-middleware.test.ts`):**
- Strips a single empty param: `?orgId=` → no query string
- Strips multiple empty params: `?orgId=&departmentId=` → no query string
- Preserves non-empty params while stripping empty ones: `?orgId=&departmentId=123` → `?departmentId=123`
- No-op when there is no query string or all params have values

## ZohoErrorMiddleware

`src/http/zoho-error-middleware.ts`

Intercepts non-2xx, non-3xx responses and throws a `ZohoApiError` with structured details. Placed inside `EmptyQueryParamMiddleware` and before `RetryHandler` so retries still work.

**Response flow (from `execute()` lines 36–100):**
1. Let the response come back through the middleware chain
2. If `response.ok` or 3xx redirect, pass through unchanged
3. Try to read the response body as text
4. Parse as JSON if possible; extract Zoho error fields (`errorCode`, `message`/`errorMessage`/`error`)
5. Construct and throw `ZohoApiError` with appropriate fields

**Error categories:**
- JSON with Zoho fields → `ZohoApiError` with `errorCode`, `responseBody`, `message`
- Non-JSON body → `ZohoApiError` with `rawBody`, message "non-JSON response"
- Empty body → `ZohoApiError` with message "(empty response body)"

See [Exceptions](../domain/exceptions.md) for the full `ZohoApiError` structure.

## Retry Handler

The default `RetryHandler` from Kiota is replaced when `SDKConfig` provides non-default values:

```typescript
if (sdkConfig) {
  const retryIndex = middlewares.findIndex((m) => m instanceof RetryHandler);
  if (retryIndex !== -1) {
    middlewares[retryIndex] = new RetryHandler(
      new RetryHandlerOptions({
        maxRetries: sdkConfig.getMaxRetries(),
        delay: sdkConfig.getRetryDelay(),
      }),
    );
  }
}
```

Default: maxRetries=3, delay=3s. Configured via `SDKConfigBuilder.maxRetries()` (0–10) and `.retryDelay()` (0–180 seconds).

## Proxy Support

When a `RequestProxy` is configured via `InitializeBuilder.requestProxy()`, the `createRequestAdapter()` function wraps the native `fetch` call with an `undici` `ProxyAgent`:

```typescript
if (proxy) {
  const proxyUrl = buildProxyUrl(proxy); // http://user:pass@host:port
  const proxyAgent = new ProxyAgent(proxyUrl);
  customFetch = (request, init) => fetch(request, { ...init, dispatcher: proxyAgent });
}
```

This is Node.js-specific (uses `undici` dispatcher). The proxy URL is `http://` only (no HTTPS proxy support).

## Custom Fetch

When no proxy is configured, `customFetch` remains `undefined` and Kiota uses its default fetch implementation. When a proxy is configured, the custom fetch wraps every call with the undici dispatcher.

## Source References

- `src/http/zoho-http-client.ts` — `createRequestAdapter()` (78 LOC)
- `src/http/zoho-error-middleware.ts` — error middleware (100 LOC)
- `src/http/empty-query-param-middleware.ts` — query param cleaning (51 LOC)
- `src/proxy/request-proxy.ts` — proxy model (34 LOC)
- `src/proxy/proxy-builder.ts` — proxy builder (45 LOC)
- `src/config/sdk-config.ts` — SDKConfig with retry options (41 LOC)

## Related Tests

- `tests/zoho-error-middleware.test.ts` — 10 tests covering JSON errors, non-JSON, empty body, 2xx/3xx passthrough
- `tests/empty-query-param-middleware.test.ts` — 7 tests covering all stripping scenarios
- `tests/proxy.test.ts` — proxy builder validation

### Minimal Validation

```bash
npx vitest run tests/zoho-error-middleware.test.ts tests/empty-query-param-middleware.test.ts
```

## Related Pages

- [OAuth Overview](../auth/oauth-overview.md) — how the AuthenticationProvider feeds into the adapter
- [Configuration](../domain/configuration.md) — SDKConfig retry settings and proxy configuration
- [Exceptions](../domain/exceptions.md) — ZohoApiError structure
- [Facade Client](../client/facade.md) — how the adapter is created in createAdapter()
- [Architecture Overview](../architecture/overview.md) — request flow diagrammd) — request flow diagram