---
type: Guide
title: Quick Start — Zoho Desk Node.js SDK Wiki
description: "Entry point to the Zoho Desk Node.js SDK documentation. Contains a task-routing table, knowledge base structure overview, and links to every major component page."
tags: [quickstart, navigation]
---

# OpenWiki Knowledge Base — @banana.inc/zoho-desk-nodejs-sdk

This wiki documents the hand-written layer (~3.5k LOC) of the [Zoho Desk Node.js SDK](https://github.com/dragonxsx/zoho-desk-nodejs-sdk), an ESM-only TypeScript SDK (Node >= 18) that wraps 126 Kiota-generated API client modules with OAuth, data-center routing, error translation, logging, proxy support, and token persistence.

> For installation, quick-start snippets, and per-grant-type usage, see **[README.md](/README.md)**. This wiki explains *how the pieces fit together and why*.

## Knowledge Base Structure

```
openwiki/
├── quickstart.md                  ← you are here
├── architecture/
│   └── overview.md                ← Hand-written vs generated split, module shape, init sequence, request flow
├── auth/
│   ├── oauth-overview.md          ← Token lifecycle, authenticate flow, persistence, revocation
│   └── grant-flows.md             ← All 7 grant types with sequence diagrams
├── http/
│   └── request-pipeline.md        ← Middleware chain, error translation, empty query stripping, proxy, retry
├── client/
│   └── facade.md                  ← ZohoDeskClient lazy getter pattern, all 126 module getters
├── codegen/
│   └── pipeline.md                ← Upstream OAS → Kiota → generated modules → facade
├── dc/
│   └── datacenters.md             ← 7-region support, URL resolution
├── store/
│   └── token-store.md             ← TokenStore interface, FileStore CSV implementation, custom stores
└── domain/
    ├── configuration.md           ← SDKConfig, Logger, RequestProxy, InitializeBuilder, Initializer
    └── exceptions.md              ← SDKException and ZohoApiError
```

## Task Routing

| Change area / user intent | Wiki page | Source entry points | Important symbols / types | Focused tests | Minimal validation |
|---|---|---|---|---|---|
| **Add or modify an OAuth grant type** | [OAuth Overview](./auth/oauth-overview.md) | `src/auth/oauth-token.ts`, `src/auth/oauth-builder.ts` | `OAuthToken`, `OAuthGrantType`, `OAuthBuilder` | `tests/oauth-token.test.ts`, `tests/client-credentials.test.ts`, `tests/oauth-builder.test.ts` | `npx vitest run tests/oauth-token.test.ts tests/oauth-builder.test.ts` |
| **Add or change PKCE logic** | [Grant Flows](./auth/grant-flows.md) | `src/auth/pkce.ts` | `generateCodeVerifier`, `generateCodeChallenge`, `generatePKCEPair`, `PKCEPair` | `tests/pkce.test.ts` | `npx vitest run tests/pkce.test.ts` |
| **Change device authorization flow** | [Grant Flows](./auth/grant-flows.md) | `src/auth/device-auth.ts` | `requestDeviceCode`, `pollForDeviceToken`, `DeviceCodeResponse`, `DeviceAuthOptions` | `tests/device-auth.test.ts` | `npx vitest run tests/device-auth.test.ts` |
| **Build/parse authorization URLs** | [Grant Flows](./auth/grant-flows.md) | `src/auth/authorization-url.ts` | `AuthorizationUrlBuilder`, `parseImplicitFragment` | `tests/authorization-url.test.ts` | `npx vitest run tests/authorization-url.test.ts` |
| **Add or modify middleware** | [Request Pipeline](./http/request-pipeline.md) | `src/http/zoho-error-middleware.ts`, `src/http/empty-query-param-middleware.ts`, `src/http/zoho-http-client.ts` | `ZohoErrorMiddleware`, `EmptyQueryParamMiddleware`, `createRequestAdapter` | `tests/zoho-error-middleware.test.ts`, `tests/empty-query-param-middleware.test.ts` | `npx vitest run tests/zoho-error-middleware.test.ts tests/empty-query-param-middleware.test.ts` |
| **Change proxy or retry behavior** | [Request Pipeline](./http/request-pipeline.md) | `src/proxy/request-proxy.ts`, `src/proxy/proxy-builder.ts`, `src/http/zoho-http-client.ts` | `RequestProxy`, `ProxyBuilder`, `createRequestAdapter` | `tests/proxy.test.ts` | `npx vitest run tests/proxy.test.ts` |
| **Add/remove a generated API module** | [Facade Client](./client/facade.md) + [Codegen Pipeline](./codegen/pipeline.md) | `scripts/generate-facade.ts`, `scripts/generate-clients.sh` | `ZohoDeskClient`, 126 factory functions | `tests/bundle-oas.test.ts`, `tests/oas-utils.test.ts` | `npx vitest run tests/bundle-oas.test.ts tests/oas-utils.test.ts` |
| **Regenerate after upstream OAS change** | [Codegen Pipeline](./codegen/pipeline.md) | `scripts/pull-and-generate.sh` | N/A (full pipeline) | N/A | `npm run generate` (requires Docker + internet) |
| **Regenerate facade only** | [Facade Client](./client/facade.md) | `scripts/generate-facade.ts` | `discoverModules()`, `generateFacade()` | N/A | `npx tsx scripts/generate-facade.ts` |
| **Add a new data center region** | [Data Centers](./dc/datacenters.md) | `src/dc/us-data-center.ts` (exemplar), `src/dc/data-center.ts`, `src/dc/environment.ts` | `DataCenter`, `Environment` | `tests/data-centers.test.ts` | `npx vitest run tests/data-centers.test.ts` |
| **Implement a custom TokenStore** | [Token Store](./store/token-store.md) | `src/store/token-store.ts`, `src/store/file-store.ts` | `TokenStore`, `FileStore` | `tests/file-store.test.ts` | `npx vitest run tests/file-store.test.ts` |
| **Change SDKConfig or initialization defaults** | [Configuration](./domain/configuration.md) | `src/config/sdk-config.ts`, `src/config/sdk-config-builder.ts`, `src/initializer/initialize-builder.ts`, `src/initializer/initializer.ts` | `SDKConfig`, `SDKConfigBuilder`, `InitializeBuilder`, `Initializer` | `tests/config.test.ts`, `tests/initializer.test.ts` | `npx vitest run tests/config.test.ts tests/initializer.test.ts` |
| **Change logging behavior** | [Configuration](./domain/configuration.md) | `src/logger/logger.ts`, `src/logger/log-builder.ts`, `src/logger/sdk-logger.ts` | `Logger`, `Levels`, `LogBuilder` | `tests/logger.test.ts` | `npx vitest run tests/logger.test.ts` |
| **Change exception classes** | [Exceptions](./domain/exceptions.md) | `src/exception/sdk-exception.ts`, `src/exception/zoho-api-error.ts` | `SDKException`, `ZohoApiError` | `tests/sdk-exception.test.ts` | `npx vitest run tests/sdk-exception.test.ts` |
| **Verify full build + test** | N/A | `tsconfig.json`, `vitest.config.ts` | N/A | All test files | `npm run build && npm test` |

## Cross-Cutting Relationships

- **OAuth token → TokenStore**: `OAuthToken.authenticate()` reads from store on entry, writes on success. See [OAuth Overview → authenticate](./auth/oauth-overview.md#authenticate-flow) and [Token Store](./store/token-store.md).
- **OAuth token → ZohoAuthenticationProvider**: Provider calls `token.authenticate()` in `authenticateRequest()`. See [OAuth Overview](./auth/oauth-overview.md) and [Request Pipeline](./http/request-pipeline.md).
- **AuthorizationUrlBuilder → Environment**: Builder resolves `getAuthorizationUrl()` from the environment. See [Grant Flows](./auth/grant-flows.md) and [Data Centers](./dc/datacenters.md).
- **Device auth → Environment**: `requestDeviceCode` uses `getDeviceCodeUrl()`, `pollForDeviceToken` uses `getAccountsUrl()`. See [Grant Flows](./auth/grant-flows.md).
- **ZohoDeskClient → Generated modules**: Each getter calls the factory function from the generated module. See [Facade Client](./client/facade.md).
- **Codegen pipeline → Generated modules → Facade**: Kiota generates 126 modules; `generate-facade.ts` scans them to produce `ZohoDeskClient`. See [Codegen Pipeline](./codegen/pipeline.md).
- **Initializer → ZohoAuthenticationProvider → FetchRequestAdapter**: `createAdapter()` assembles the auth provider and adapter. See [Configuration](./domain/configuration.md) and [Request Pipeline](./http/request-pipeline.md).

## Change Navigation Guidance

When changing any of the following areas, verify the full surface by checking these additional layers beyond the defining module:

| Change | Additional layers to verify |
|---|---|
| New OAuth grant type | `OAuthBuilder.build()` validation; `OAuthToken.authenticate()` dispatch + private `*AccessToken` method; `ZohoAuthenticationProvider` (unchanged); `InitializeBuilder` wiring; `src/index.ts` export |
| New middleware | `createRequestAdapter()` middleware array and unshift ordering; `HttpClient` construction; custom fetch proxy integration |
| New SDKConfig option | `SDKConfig` model constructor + getters; `SDKConfigBuilder` builder method; `InitializeBuilder.defaults`; `createRequestAdapter()` retry handler replacement |
| New TokenStore method | `TokenStore` interface; `FileStore` implementation; `OAuthToken` usage sites (store lookup, save, remove); custom store adoption in tests |

## Backlog

No current backlog items. All identified components are covered in the pages linked above.

## Related Pages

- [Architecture Overview](./architecture/overview.md) — start here for the big picture
- [OAuth Overview](./auth/oauth-overview.md) — most complex hand-written area
- [Request Pipeline](./http/request-pipeline.md) — middleware and error flow
- [Codegen Pipeline](./codegen/pipeline.md) — how ~99% of src/ is generated