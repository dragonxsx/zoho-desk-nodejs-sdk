---
type: Concept
title: Data Centers
description: "7-region data center support: DataCenter abstract class, region-specific subclasses, and the Environment object that resolves accounts and API base URLs."
tags: [datacenter, environment, url-resolution]
---

# Data Centers

The SDK supports all 7 Zoho Desk data center regions through a `DataCenter` abstract class and per-region subclasses.

## Architecture

```
DataCenter (abstract, src/dc/data-center.ts)
  ├── USDataCenter (src/dc/us-data-center.ts)
  ├── EUDataCenter (src/dc/eu-data-center.ts)
  ├── INDataCenter (src/dc/in-data-center.ts)
  ├── AUDataCenter (src/dc/au-data-center.ts)
  ├── CADataCenter (src/dc/ca-data-center.ts)
  ├── CNDataCenter (src/dc/cn-data-center.ts)
  └── JPDataCenter (src/dc/jp-data-center.ts)
```

## DataCenter Base Class

```typescript
abstract class DataCenter {
  abstract getIAMUrl(): string;  // Returns the IAM OAuth token endpoint URL

  static setEnvironment(url: string, accountsUrl: string): Environment {
    return new Environment(url, accountsUrl);
  }
}
```

## Region Reference

| Region | Class | API Base URL | Accounts URL (IAM) | Production Environment |
|---|---|---|---|---|
| US | `USDataCenter` | `https://desk.zoho.com` | `https://accounts.zoho.com/oauth/v2/token` | `USDataCenter.PRODUCTION()` |
| EU | `EUDataCenter` | `https://desk.zoho.eu` | `https://accounts.zoho.eu/oauth/v2/token` | `EUDataCenter.PRODUCTION()` |
| IN | `INDataCenter` | `https://desk.zoho.in` | `https://accounts.zoho.in/oauth/v2/token` | `INDataCenter.PRODUCTION()` |
| AU | `AUDataCenter` | `https://desk.zoho.au` | `https://accounts.zoho.au/oauth/v2/token` | `AUDataCenter.PRODUCTION()` |
| CA | `CADataCenter` | `https://desk.zoho.ca` | `https://accounts.zoho.ca/oauth/v2/token` | `CADataCenter.PRODUCTION()` |
| CN | `CNDataCenter` | `https://desk.zoho.cn` | `https://accounts.zoho.cn/oauth/v2/token` | `CNDataCenter.PRODUCTION()` |
| JP | `JPDataCenter` | `https://desk.zoho.jp` | `https://accounts.zoho.jp/oauth/v2/token` | `JPDataCenter.PRODUCTION()` |

## Environment Object

`src/dc/environment.ts`

The `Environment` class is created by each data center's `PRODUCTION()` static method and holds two URLs:

```typescript
class Environment {
  constructor(url: string, accountsUrl: string) { ... }

  getUrl(): string;              // Zoho Desk API base (e.g., https://desk.zoho.com)
  getAccountsUrl(): string;      // OAuth token endpoint (e.g., https://accounts.zoho.com/oauth/v2/token)
  getAuthorizationUrl(): string; // Derived: accountsUrl -> /auth (e.g., .../oauth/v2/auth)
  getDeviceCodeUrl(): string;    // Derived: accountsUrl -> /device/code (e.g., .../oauth/v2/device/code)
}
```

The authorization URL and device code URL are derived from the accounts URL by replacing the `/token` suffix with `/auth` and `/device/code` respectively.

## Data Center Usage

Each data center class uses a singleton pattern with lazy initialization:

```typescript
export class USDataCenter extends DataCenter {
  private static _PRODUCTION: Environment | null = null;
  private static readonly US = new USDataCenter();

  static PRODUCTION(): Environment {
    if (!this._PRODUCTION) {
      this._PRODUCTION = DataCenter.setEnvironment(
        "https://desk.zoho.com",
        this.US.getIAMUrl(),  // "https://accounts.zoho.com/oauth/v2/token"
      );
    }
    return this._PRODUCTION;
  }

  getIAMUrl(): string {
    return "https://accounts.zoho.com/oauth/v2/token";
  }
}
```

## Custom Environments

For testing or non-production environments, create an `Environment` directly:

```typescript
import { Environment } from "@banana.inc/zoho-desk-nodejs-sdk";

const staging = new Environment(
  "https://desk-staging.zoho.com",
  "https://accounts-staging.zoho.com/oauth/v2/token",
);
```

## Source References

- `src/dc/data-center.ts` — abstract base (9 lines)
- `src/dc/environment.ts` — environment model (25 lines)
- `src/dc/us-data-center.ts` — US region exemplar (21 lines)
- `src/dc/eu-data-center.ts`, `src/dc/in-data-center.ts`, `src/dc/cn-data-center.ts`, `src/dc/au-data-center.ts`, `src/dc/jp-data-center.ts`, `src/dc/ca-data-center.ts` — one file per region

## Related Tests

- `tests/data-centers.test.ts` — URL correctness for all 7 regions, Environment URL derivation

### Minimal Validation

```bash
npx vitest run tests/data-centers.test.ts
```

## Related Pages

- [OAuth Overview](../auth/oauth-overview.md) — how environment URLs drive token requests
- [Grant Flows](../auth/grant-flows.md) — authorization URL and device code URL derivation
- [Configuration](../domain/configuration.md) — how environment is set in InitializeBuilder