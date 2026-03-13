# @banana.inc/zoho-desk-nodejs-sdk

[![npm version](https://img.shields.io/npm/v/@banana.inc/zoho-desk-nodejs-sdk)](https://www.npmjs.com/package/@banana.inc/zoho-desk-nodejs-sdk)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A comprehensive, type-safe TypeScript SDK for the [Zoho Desk API](https://desk.zoho.com/DeskAPIDocument) with OAuth 2.0, multi-data-center support, and token persistence.

## Philosophy

This SDK is built on four core principles:

- **Spec-driven** — API clients are auto-generated from [Zoho's official OpenAPI specs](https://github.com/zoho/zohodesk-oas) using [Microsoft Kiota](https://learn.microsoft.com/en-us/openapi/kiota/overview). Every endpoint, model, and parameter stays in sync with the source of truth. No hand-written API wrappers to maintain or fall out of date.

- **Type-safe by default** — Strict TypeScript throughout. Builder patterns for fluent, discoverable configuration. Full autocompletion and compile-time validation so issues surface in your editor, not at runtime.

- **Batteries-included but extensible** — Ships with sensible defaults (file-based token store, configurable logging, proxy support) while keeping every component pluggable. Swap in your own token store, adjust SDK behavior, or route through a corporate proxy — all through clean interfaces.

- **Modern ESM stack** — ESM-only with ES2022 target and NodeNext module resolution. No CommonJS baggage, no dual-package hazards. Designed for the Node.js ecosystem as it is today.

## Features

- **128+ API modules** auto-generated from official Zoho Desk OpenAPI specs
- **OAuth 2.0** with 4 grant types: refresh token, authorization code, direct access token, and stored token
- **Automatic token refresh** with 5-second expiry buffer
- **7-region data center support** — US, EU, IN, AU, CA, CN, JP
- **Pluggable token persistence** with built-in CSV file store
- **HTTP proxy support** via undici ProxyAgent
- **Configurable logging** powered by Winston
- **Lazy-loaded API clients** for minimal startup overhead
- **TypeScript strict mode** with full declaration maps

## Installation

```bash
npm install @banana.inc/zoho-desk-nodejs-sdk
```

Requires **Node.js >= 18**. This package is ESM-only (`"type": "module"`).

## Quick Start

```typescript
import {
  InitializeBuilder,
  OAuthBuilder,
  USDataCenter,
  FileStore,
  createDeskClient,
} from "@banana.inc/zoho-desk-nodejs-sdk";

// 1. Build the OAuth token
const token = new OAuthBuilder()
  .clientId("your-client-id")
  .clientSecret("your-client-secret")
  .refreshToken("your-refresh-token")
  .build();

// 2. Initialize the SDK
await new InitializeBuilder()
  .environment(USDataCenter.PRODUCTION())
  .token(token)
  .store(new FileStore("./tokens.csv"))
  .initialize();

// 3. Create the client and call APIs
const client = createDeskClient();
const tickets = await client.tickets.get();
```

## Authentication

The SDK supports four OAuth grant types through `OAuthBuilder`:

### Refresh Token

For server-side applications with long-lived access.

```typescript
const token = new OAuthBuilder()
  .clientId("your-client-id")
  .clientSecret("your-client-secret")
  .refreshToken("your-refresh-token")
  .build();
```

### Grant Token (Authorization Code)

For exchanging a one-time authorization code for tokens.

```typescript
const token = new OAuthBuilder()
  .clientId("your-client-id")
  .clientSecret("your-client-secret")
  .grantToken("your-grant-token")
  .redirectURL("https://your-app.com/callback")
  .build();
```

### Direct Access Token

For quick testing or short-lived scripts where you already have an access token.

```typescript
const token = new OAuthBuilder()
  .accessToken("your-access-token")
  .build();
```

### Stored Token by ID

For resuming a previously persisted token session.

```typescript
const token = new OAuthBuilder()
  .id("stored-token-id")
  .build();
```

## Data Centers

The SDK supports all 7 Zoho Desk data center regions:

| Region | Class | Production Environment |
|--------|-------|----------------------|
| US | `USDataCenter` | `USDataCenter.PRODUCTION()` |
| EU | `EUDataCenter` | `EUDataCenter.PRODUCTION()` |
| IN | `INDataCenter` | `INDataCenter.PRODUCTION()` |
| AU | `AUDataCenter` | `AUDataCenter.PRODUCTION()` |
| CA | `CADataCenter` | `CADataCenter.PRODUCTION()` |
| CN | `CNDataCenter` | `CNDataCenter.PRODUCTION()` |
| JP | `JPDataCenter` | `JPDataCenter.PRODUCTION()` |

## Configuration

### SDK Config

Customize SDK behavior with `SDKConfigBuilder`:

```typescript
import { SDKConfigBuilder } from "@banana.inc/zoho-desk-nodejs-sdk";

const config = new SDKConfigBuilder()
  .autoRefreshFields(true)
  .pickListValidation(true)
  .timeout(30000) // request timeout in ms
  .build();

await new InitializeBuilder()
  .environment(USDataCenter.PRODUCTION())
  .token(token)
  .SDKConfig(config)
  .initialize();
```

### Logging

Enable Winston-based logging with `LogBuilder`:

```typescript
import { LogBuilder, Levels } from "@banana.inc/zoho-desk-nodejs-sdk";

const logger = new LogBuilder()
  .level(Levels.INFO)
  .filePath("./sdk.log")
  .build();

await new InitializeBuilder()
  .environment(USDataCenter.PRODUCTION())
  .token(token)
  .logger(logger)
  .initialize();
```

Available levels: `INFO`, `DEBUG`, `WARN`, `VERBOSE`, `ERROR`, `SILLY`, `OFF`

### HTTP Proxy

Route requests through a proxy with `ProxyBuilder`:

```typescript
import { ProxyBuilder } from "@banana.inc/zoho-desk-nodejs-sdk";

const proxy = new ProxyBuilder()
  .host("proxy.example.com")
  .port(8080)
  .user("proxy-user")       // optional
  .password("proxy-pass")   // optional
  .build();

await new InitializeBuilder()
  .environment(USDataCenter.PRODUCTION())
  .token(token)
  .requestProxy(proxy)
  .initialize();
```

### Token Persistence

The SDK persists tokens via the `TokenStore` interface. The built-in `FileStore` saves tokens to a CSV file:

```typescript
import { FileStore } from "@banana.inc/zoho-desk-nodejs-sdk";

const store = new FileStore("./zoho_desk_tokens.csv");
```

To implement a custom store (e.g., database-backed), implement the `TokenStore` interface:

```typescript
import type { TokenStore, Token } from "@banana.inc/zoho-desk-nodejs-sdk";

class DatabaseStore implements TokenStore {
  async findToken(token: Token): Promise<Token | null> { /* ... */ }
  async findTokenById(id: string): Promise<Token | null> { /* ... */ }
  async saveToken(token: Token): Promise<void> { /* ... */ }
  async deleteToken(id: string): Promise<void> { /* ... */ }
  async getTokens(): Promise<Token[]> { /* ... */ }
  async deleteTokens(): Promise<void> { /* ... */ }
}
```

## Code Generation Pipeline

The SDK's 128+ API modules are generated from Zoho's official OpenAPI specifications through a four-stage pipeline:

```
Pull OAS specs ──> Bundle per module ──> Kiota generate ──> Generate facade
```

1. **Pull** — Clones the latest OpenAPI specs from [`zoho/zohodesk-oas`](https://github.com/zoho/zohodesk-oas)
2. **Bundle** — Creates self-contained spec bundles per API module with a manifest
3. **Generate** — Runs Microsoft Kiota (via Docker) to produce TypeScript clients for each module
4. **Facade** — Scans all generated clients and produces a unified `ZohoDeskClient` with lazy-loaded getters

To regenerate:

```bash
npm run generate
```

> **Note:** Files under `src/generated/` and `src/client/zoho-desk-client.ts` are auto-generated. Do not edit them by hand.

## License

[MIT](LICENSE)
