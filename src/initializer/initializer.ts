import type { FetchRequestAdapter } from "@microsoft/kiota-http-fetchlibrary";
import type { Environment } from "../dc/environment.js";
import type { TokenStore } from "../store/token-store.js";
import type { OAuthToken } from "../auth/oauth-token.js";
import type { SDKConfig } from "../config/sdk-config.js";
import type { RequestProxy } from "../proxy/request-proxy.js";
import type { Logger } from "../logger/logger.js";
import { ZohoAuthenticationProvider } from "../auth/zoho-auth-provider.js";
import { createRequestAdapter } from "../http/zoho-http-client.js";
import { initializeLogger, getLogger } from "../logger/sdk-logger.js";
import { SDKException } from "../exception/sdk-exception.js";

/**
 * SDK initialization singleton. Holds all configuration needed to create API clients.
 */
export class Initializer {
  private static instance: Initializer | null = null;

  private readonly _environment: Environment;
  private readonly _store: TokenStore;
  private readonly _token: OAuthToken;
  private readonly _sdkConfig: SDKConfig;
  private readonly _requestProxy: RequestProxy | null;
  private readonly _logger: Logger;

  private constructor(
    environment: Environment,
    store: TokenStore,
    token: OAuthToken,
    sdkConfig: SDKConfig,
    requestProxy: RequestProxy | null,
    logger: Logger,
  ) {
    this._environment = environment;
    this._store = store;
    this._token = token;
    this._sdkConfig = sdkConfig;
    this._requestProxy = requestProxy;
    this._logger = logger;
  }

  static async initialize(
    environment: Environment,
    store: TokenStore,
    token: OAuthToken,
    sdkConfig: SDKConfig,
    requestProxy: RequestProxy | null,
    logger: Logger,
  ): Promise<void> {
    initializeLogger(logger);

    // Wire the store into the token
    token.setStore(store);

    const initializer = new Initializer(
      environment,
      store,
      token,
      sdkConfig,
      requestProxy,
      logger,
    );

    Initializer.instance = initializer;

    const sdkLogger = getLogger();
    sdkLogger.info("Zoho Desk SDK initialized successfully.");

    // Generate token eagerly to validate credentials
    try {
      await token.generateToken(environment);
    } catch (err) {
      sdkLogger.warn(
        "Token generation during initialization failed. Will retry on first API call.",
      );
    }
  }

  static getInitializer(): Initializer {
    if (!Initializer.instance) {
      throw new SDKException(
        "SDK_UNINITIALIZATION_ERROR",
        "SDK is not initialized. Call InitializeBuilder.initialize() first.",
      );
    }
    return Initializer.instance;
  }

  getEnvironment(): Environment {
    return this._environment;
  }

  getStore(): TokenStore {
    return this._store;
  }

  getToken(): OAuthToken {
    return this._token;
  }

  getSDKConfig(): SDKConfig {
    return this._sdkConfig;
  }

  getRequestProxy(): RequestProxy | null {
    return this._requestProxy;
  }

  getLogger(): Logger {
    return this._logger;
  }

  /**
   * Create a Kiota FetchRequestAdapter configured with Zoho auth and proxy.
   */
  createAdapter(): FetchRequestAdapter {
    const authProvider = new ZohoAuthenticationProvider(
      this._token,
      this._environment,
    );

    return createRequestAdapter(
      authProvider,
      this._environment.getUrl(),
      this._requestProxy,
      this._sdkConfig,
    );
  }
}
