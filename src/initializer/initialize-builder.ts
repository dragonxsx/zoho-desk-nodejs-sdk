import type { Environment } from "../dc/environment.js";
import type { TokenStore } from "../store/token-store.js";
import type { OAuthToken } from "../auth/oauth-token.js";
import type { SDKConfig } from "../config/sdk-config.js";
import type { RequestProxy } from "../proxy/request-proxy.js";
import type { Logger } from "../logger/logger.js";
import { Initializer } from "./initializer.js";
import { FileStore } from "../store/file-store.js";
import { SDKConfigBuilder } from "../config/sdk-config-builder.js";
import { LogBuilder } from "../logger/log-builder.js";
import { Levels } from "../logger/logger.js";
import { SDKException } from "../exception/sdk-exception.js";

export class InitializeBuilder {
  private _environment: Environment | null = null;
  private _store: TokenStore | null = null;
  private _token: OAuthToken | null = null;
  private _sdkConfig: SDKConfig | null = null;
  private _requestProxy: RequestProxy | null = null;
  private _logger: Logger | null = null;

  environment(environment: Environment): this {
    this._environment = environment;
    return this;
  }

  store(store: TokenStore): this {
    this._store = store;
    return this;
  }

  token(token: OAuthToken): this {
    this._token = token;
    return this;
  }

  SDKConfig(sdkConfig: SDKConfig): this {
    this._sdkConfig = sdkConfig;
    return this;
  }

  requestProxy(requestProxy: RequestProxy): this {
    this._requestProxy = requestProxy;
    return this;
  }

  logger(logger: Logger): this {
    this._logger = logger;
    return this;
  }

  async initialize(): Promise<void> {
    if (!this._environment) {
      throw new SDKException(
        "INITIALIZATION_ERROR",
        "Environment is required for SDK initialization.",
      );
    }

    if (!this._token) {
      throw new SDKException(
        "INITIALIZATION_ERROR",
        "Token is required for SDK initialization.",
      );
    }

    // Defaults
    const store = this._store ?? new FileStore("./zoho_desk_tokens.csv");
    const sdkConfig = this._sdkConfig ?? new SDKConfigBuilder().build();
    const logger =
      this._logger ?? new LogBuilder().level(Levels.OFF).build();

    await Initializer.initialize(
      this._environment,
      store,
      this._token,
      sdkConfig,
      this._requestProxy,
      logger,
    );
  }
}
