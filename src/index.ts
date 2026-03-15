// Auth
export { Token } from "./auth/token.js";
export { OAuthToken, OAuthGrantType } from "./auth/oauth-token.js";
export { OAuthBuilder } from "./auth/oauth-builder.js";
export { ZohoAuthenticationProvider } from "./auth/zoho-auth-provider.js";
export {
  generateCodeVerifier,
  generateCodeChallenge,
  generatePKCEPair,
} from "./auth/pkce.js";
export type { PKCEPair } from "./auth/pkce.js";
export { AuthorizationUrlBuilder, parseImplicitFragment } from "./auth/authorization-url.js";
export { requestDeviceCode, pollForDeviceToken } from "./auth/device-auth.js";
export type { DeviceCodeResponse, DeviceAuthOptions } from "./auth/device-auth.js";

// Data Centers
export { Environment } from "./dc/environment.js";
export { DataCenter } from "./dc/data-center.js";
export { USDataCenter } from "./dc/us-data-center.js";
export { EUDataCenter } from "./dc/eu-data-center.js";
export { INDataCenter } from "./dc/in-data-center.js";
export { CNDataCenter } from "./dc/cn-data-center.js";
export { AUDataCenter } from "./dc/au-data-center.js";
export { JPDataCenter } from "./dc/jp-data-center.js";
export { CADataCenter } from "./dc/ca-data-center.js";

// Token Stores
export type { TokenStore } from "./store/token-store.js";
export { FileStore } from "./store/file-store.js";

// Logger
export { Logger, Levels } from "./logger/logger.js";
export { LogBuilder } from "./logger/log-builder.js";

// Config
export { SDKConfig } from "./config/sdk-config.js";
export { SDKConfigBuilder } from "./config/sdk-config-builder.js";

// Proxy
export { RequestProxy } from "./proxy/request-proxy.js";
export { ProxyBuilder } from "./proxy/proxy-builder.js";

// Exception
export { SDKException } from "./exception/sdk-exception.js";
export { ZohoApiError } from "./exception/zoho-api-error.js";

// HTTP
export { createRequestAdapter } from "./http/zoho-http-client.js";

// Initializer
export { Initializer } from "./initializer/initializer.js";
export { InitializeBuilder } from "./initializer/initialize-builder.js";

// Generated facade client
export { ZohoDeskClient } from "./client/zoho-desk-client.js";

// Factory
import { Initializer } from "./initializer/initializer.js";
import { ZohoDeskClient } from "./client/zoho-desk-client.js";

/**
 * Factory function to create a configured ZohoDeskClient.
 * Must call `InitializeBuilder.initialize()` before calling this.
 */
export function createDeskClient(): ZohoDeskClient {
  const initializer = Initializer.getInitializer();
  const adapter = initializer.createAdapter();
  return new ZohoDeskClient(adapter);
}
