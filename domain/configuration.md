---
type: Concept
title: Configuration & Initialization
description: "SDK configuration: SDKConfig, Logger, RequestProxy, InitializeBuilder, and Initializer singleton. Covers all builder classes, default values, and initialization flow."
tags: [configuration, initialization, sdkconfig, logger, proxy]
---

# Configuration & Initialization

This page documents all configuration objects and the initialization sequence that wires them together. There are four configuration domains (SDKConfig, Logger, RequestProxy) and a single initialization entry point (InitializeBuilder → Initializer singleton).

## Configuration Objects Overview

```mermaid
erDiagram
    InitializeBuilder ||--|| Environment : "requires"
    InitializeBuilder ||--|| OAuthToken : "requires"
    InitializeBuilder ||--o| TokenStore : "default: FileStore"
    InitializeBuilder ||--o| SDKConfig : "default: SDKConfigBuilder defaults"
    InitializeBuilder ||--o| Logger : "default: OFF, no file"
    InitializeBuilder ||--o| RequestProxy : "optional"
    InitializeBuilder ||--|| Initializer : "creates singleton"

    SDKConfig ||--|{ RetrySettings: "contains"
    SDKConfig {
        boolean autoRefreshFields
        boolean pickListValidation
        number timeout
        number maxRetries
        number retryDelay
    }

    Logger {
        Levels level
        string filePath
    }

    RequestProxy {
        string host
        number port
        string user optional
        string password optional
    }

    Initializer {
        Environment environment
        TokenStore store
        OAuthToken token
        SDKConfig sdkConfig
        RequestProxy requestProxy
        Logger logger
    }
```

## InitializeBuilder

`src/initializer/initialize-builder.ts`

The main entry point for SDK initialization. Fluent builder pattern.

```typescript
class InitializeBuilder {
  environment(env: Environment): this;
  token(token: OAuthToken): this;
  store(store: TokenStore): this;
  SDKConfig(sdkConfig: SDKConfig): this;
  requestProxy(requestProxy: RequestProxy): this;
  logger(logger: Logger): this;
  async initialize(): Promise<void>;
}
```

**Defaults applied in `initialize()`:**

| Property | Default |
|---|---|
| store | `new FileStore("./zoho_desk_tokens.csv")` |
| sdkConfig | `new SDKConfigBuilder().build()` (see below) |
| logger | `new LogBuilder().level(OFF).build()` (silent) |

**Validation:**
- Environment is required (throws `INITIALIZATION_ERROR` if null)
- Token is required (throws `INITIALIZATION_ERROR` if null)

## Initializer Singleton

`src/initializer/initializer.ts`

Holds all configuration and provides the `createAdapter()` method that assembles the HTTP transport.

```typescript
class Initializer {
  static async initialize(
    environment: Environment,
    store: TokenStore,
    token: OAuthToken,
    sdkConfig: SDKConfig,
    requestProxy: RequestProxy | null,
    logger: Logger,
  ): Promise<void>;

  static getInitializer(): Initializer;   // Throws SDK_UNINITIALIZATION_ERROR if not initialized

  createAdapter(): FetchRequestAdapter;   // Creates ZohoAuthenticationProvider → createRequestAdapter()
}
```

**Initialization sequence:**
1. Initialize the logger (via `initializeLogger()`)
2. Wire the store into the token (`token.setStore(store)`)
3. Store the singleton instance
4. **Eager token validation:** calls `token.generateToken(environment)`. Failure logs a warning but does NOT throw — the SDK will retry on the first API call.

## SDKConfig

`src/config/sdk-config.ts` + `src/config/sdk-config-builder.ts`

```typescript
class SDKConfig {
  getAutoRefreshFields(): boolean;  // Default: false
  getPickListValidation(): boolean; // Default: true
  getTimeout(): number;             // Default: 0 (no timeout)
  getMaxRetries(): number;          // Default: 3
  getRetryDelay(): number;          // Default: 3 (seconds)
}
```

**SDKConfigBuilder constraints:**
- `maxRetries`: clamped to 0–10
- `retryDelay`: clamped to 0–180 seconds
- `timeout`: negative values set to 0

**Where SDKConfig is used:**
- In `createRequestAdapter()` — replaces the default `RetryHandler` with one configured from SDKConfig

## Logger

`src/logger/logger.ts` + `src/logger/log-builder.ts`

```typescript
enum Levels { INFO, DEBUG, WARN, VERBOSE, ERROR, SILLY, OFF }

class Logger {
  getLevel(): Levels;
  getFilePath(): string;
}
```

The actual Winston logger is managed in `src/logger/sdk-logger.ts`:
- `initializeLogger(logger)` — creates a Winston logger with file transport or silent mode
- `getLogger()` — returns the current Winston logger (creates a silent one if not initialized)

**When level is OFF or no filePath is set:** Winston is initialized with `{ silent: true }`.

## RequestProxy

`src/proxy/request-proxy.ts` + `src/proxy/proxy-builder.ts`

```typescript
class RequestProxy {
  getHost(): string;
  getPort(): number;
  getUser(): string | null;
  getPassword(): string | null;
}
```

**ProxyBuilder validation:**
- Host is required (throws `MANDATORY_VALUE_ERROR` if null)
- Port is required

The proxy URL is built as `http://user:pass@host:port` (or `http://host:port` without auth) and passed to undici's `ProxyAgent`.

## Full Initialization Example

```typescript
import {
  InitializeBuilder,
  OAuthBuilder,
  USDataCenter,
  SDKConfigBuilder,
  LogBuilder,
  Levels,
  FileStore,
  ProxyBuilder,
} from "@banana.inc/zoho-desk-nodejs-sdk";

// Token
const token = new OAuthBuilder()
  .clientId("cid")
  .clientSecret("csecret")
  .refreshToken("rtoken")
  .build();

// Config
const config = new SDKConfigBuilder()
  .maxRetries(5)
  .retryDelay(10)
  .build();

// Logger
const logger = new LogBuilder()
  .level(Levels.INFO)
  .filePath("./sdk.log")
  .build();

// Proxy (optional)
const proxy = new ProxyBuilder()
  .host("proxy.example.com")
  .port(8080)
  .build();

// Initialize
await new InitializeBuilder()
  .environment(USDataCenter.PRODUCTION())
  .token(token)
  .store(new FileStore("./my-tokens.csv"))
  .SDKConfig(config)
  .logger(logger)
  .requestProxy(proxy)
  .initialize();

// Use client
const client = createDeskClient();
```

## Source References

- `src/initializer/initialize-builder.ts` — fluent builder (82 LOC)
- `src/initializer/initializer.ts` — singleton (129 LOC)
- `src/config/sdk-config.ts` — config model (41 LOC)
- `src/config/sdk-config-builder.ts` — config builder (44 LOC)
- `src/logger/logger.ts` — logger model (26 lines)
- `src/logger/log-builder.ts` — logger builder (20 lines)
- `src/logger/sdk-logger.ts` — Winston integration (29 lines)
- `src/proxy/request-proxy.ts` — proxy model (34 lines)
- `src/proxy/proxy-builder.ts` — proxy builder (45 lines)

## Related Tests

- `tests/config.test.ts` — SDKConfig builder defaults and clamping
- `tests/initializer.test.ts` — initialization validation
- `tests/logger.test.ts` — logger building
- `tests/proxy.test.ts` — proxy builder validation

### Minimal Validation

```bash
npx vitest run tests/config.test.ts tests/initializer.test.ts tests/logger.test.ts tests/proxy.test.ts
```

## Related Pages

- [Architecture Overview](../architecture/overview.md) — initialization sequence diagram
- [OAuth Overview](../auth/oauth-overview.md) — how the token is wired
- [Request Pipeline](../http/request-pipeline.md) — how SDKConfig affects retry middleware and proxy
- [Data Centers](../dc/datacenters.md) — how Environment is resolved
- [Token Store](../store/token-store.md) — store defaults and custom stores