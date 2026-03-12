# @banana.inc/zoho-desk-nodejs-sdk

TypeScript SDK for the [Zoho Desk API](https://desk.zoho.com/DeskAPIDocument) with OAuth 2.0, multi-data-center support, and token persistence.

## Installation

```bash
npm install @banana.inc/zoho-desk-nodejs-sdk
```

Requires Node.js >= 18.

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
  .environment(USDataCenter.PRODUCTION)
  .token(token)
  .store(new FileStore("./tokens.csv"))
  .initialize();

// 3. Create the client and call APIs
const client = createDeskClient();
const tickets = await client.tickets.get();
```

## Data Centers

| Region | Class | Production Environment |
|--------|-------|----------------------|
| US | `USDataCenter` | `USDataCenter.PRODUCTION` |
| EU | `EUDataCenter` | `EUDataCenter.PRODUCTION` |
| IN | `INDataCenter` | `INDataCenter.PRODUCTION` |
| AU | `AUDataCenter` | `AUDataCenter.PRODUCTION` |
| CA | `CADataCenter` | `CADataCenter.PRODUCTION` |
| CN | `CNDataCenter` | `CNDataCenter.PRODUCTION` |
| JP | `JPDataCenter` | `JPDataCenter.PRODUCTION` |

## Token Persistence

The SDK supports pluggable token stores via the `TokenStore` interface. A `FileStore` implementation is included that persists tokens to a CSV file.

## License

[MIT](LICENSE)
