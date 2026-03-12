import { Token } from "./token.js";
import type { Environment } from "../dc/environment.js";
import type { TokenStore } from "../store/token-store.js";
import { SDKException } from "../exception/sdk-exception.js";
import { getLogger } from "../logger/sdk-logger.js";

const EXPIRY_BUFFER_MS = 5000;

interface OAuthTokenOptions {
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
  accessToken?: string;
  grantToken?: string;
  redirectURL?: string;
  id?: string;
}

export class OAuthToken extends Token {
  private _clientId: string | null;
  private _clientSecret: string | null;
  private _refreshToken: string | null;
  private _accessToken: string | null;
  private _grantToken: string | null;
  private _redirectURL: string | null;
  private _expiresIn: string | null = null;
  private _id: string | null;

  private _store: TokenStore | null = null;

  constructor(options: OAuthTokenOptions = {}) {
    super();
    this._clientId = options.clientId ?? null;
    this._clientSecret = options.clientSecret ?? null;
    this._refreshToken = options.refreshToken ?? null;
    this._accessToken = options.accessToken ?? null;
    this._grantToken = options.grantToken ?? null;
    this._redirectURL = options.redirectURL ?? null;
    this._id = options.id ?? null;
  }

  // Getters
  getClientId(): string | null {
    return this._clientId;
  }
  getClientSecret(): string | null {
    return this._clientSecret;
  }
  getRefreshToken(): string | null {
    return this._refreshToken;
  }
  getAccessToken(): string | null {
    return this._accessToken;
  }
  getGrantToken(): string | null {
    return this._grantToken;
  }
  getRedirectURL(): string | null {
    return this._redirectURL;
  }
  getExpiresIn(): string | null {
    return this._expiresIn;
  }
  getId(): string | null {
    return this._id;
  }

  // Setters
  setId(id: string | null): void {
    this._id = id;
  }
  setExpiresIn(expiresIn: string | null): void {
    this._expiresIn = expiresIn;
  }
  setRefreshToken(refreshToken: string | null): void {
    this._refreshToken = refreshToken;
  }
  setAccessToken(accessToken: string | null): void {
    this._accessToken = accessToken;
  }
  setStore(store: TokenStore): void {
    this._store = store;
  }

  /**
   * Authenticate and return the access token string.
   */
  async authenticate(environment: Environment): Promise<string> {
    const logger = getLogger();

    // Check if we have a valid token from the store
    if (this._store) {
      const storedToken = (await this._store.findToken(this)) as OAuthToken | null;
      if (storedToken) {
        this._accessToken = storedToken.getAccessToken();
        this._expiresIn = storedToken.getExpiresIn();
        this._refreshToken =
          storedToken.getRefreshToken() || this._refreshToken;
        this._id = storedToken.getId() || this._id;
      }
    }

    // Check expiry
    if (this._accessToken && this._expiresIn) {
      const expiryTime = parseInt(this._expiresIn, 10);
      if (Date.now() < expiryTime - EXPIRY_BUFFER_MS) {
        logger.debug("Using existing access token (not expired).");
        return this._accessToken;
      }
    }

    // Need to refresh or generate
    if (this._refreshToken) {
      logger.info("Refreshing access token...");
      await this.refreshAccessToken(environment);
    } else if (this._grantToken) {
      logger.info("Generating access token from grant token...");
      await this.generateAccessToken(environment);
    } else {
      throw new SDKException(
        "TOKEN_ERROR",
        "No refresh token or grant token available to obtain an access token.",
      );
    }

    if (!this._accessToken) {
      throw new SDKException(
        "TOKEN_ERROR",
        "Failed to obtain access token.",
      );
    }

    return this._accessToken;
  }

  /**
   * Generate token from the store or OAuth endpoint.
   */
  async generateToken(environment: Environment): Promise<void> {
    await this.authenticate(environment);
  }

  async remove(): Promise<void> {
    if (this._store && this._id) {
      await this._store.deleteToken(this._id);
    }
  }

  /**
   * Refresh access token using refresh_token grant.
   */
  private async refreshAccessToken(environment: Environment): Promise<void> {
    const logger = getLogger();
    const accountsUrl = environment.getAccountsUrl();

    const params = new URLSearchParams({
      client_id: this._clientId || "",
      client_secret: this._clientSecret || "",
      grant_type: "refresh_token",
      refresh_token: this._refreshToken || "",
    });

    try {
      const response = await fetch(accountsUrl, {
        method: "POST",
        body: params,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      const data = (await response.json()) as Record<string, unknown>;

      if (data.error) {
        throw new SDKException(
          "TOKEN_ERROR",
          `Token refresh failed: ${data.error as string}`,
          data,
        );
      }

      this._accessToken = data.access_token as string;
      const expiresInSec = data.expires_in as number;
      this._expiresIn = String(Date.now() + expiresInSec * 1000);

      if (data.refresh_token) {
        this._refreshToken = data.refresh_token as string;
      }

      logger.info("Access token refreshed successfully.");

      // Persist to store
      if (this._store) {
        await this._store.saveToken(this);
      }
    } catch (err) {
      if (err instanceof SDKException) throw err;
      throw new SDKException(
        "TOKEN_ERROR",
        "Error refreshing access token.",
        null,
        err instanceof Error ? err : null,
      );
    }
  }

  /**
   * Generate access token using authorization_code grant.
   */
  private async generateAccessToken(environment: Environment): Promise<void> {
    const logger = getLogger();
    const accountsUrl = environment.getAccountsUrl();

    const params = new URLSearchParams({
      client_id: this._clientId || "",
      client_secret: this._clientSecret || "",
      grant_type: "authorization_code",
      code: this._grantToken || "",
    });

    if (this._redirectURL) {
      params.set("redirect_uri", this._redirectURL);
    }

    try {
      const response = await fetch(accountsUrl, {
        method: "POST",
        body: params,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      const data = (await response.json()) as Record<string, unknown>;

      if (data.error) {
        throw new SDKException(
          "TOKEN_ERROR",
          `Token generation failed: ${data.error as string}`,
          data,
        );
      }

      this._accessToken = data.access_token as string;
      this._refreshToken = (data.refresh_token as string) || this._refreshToken;
      const expiresInSec = data.expires_in as number;
      this._expiresIn = String(Date.now() + expiresInSec * 1000);

      logger.info("Access token generated from grant token successfully.");

      // Persist to store
      if (this._store) {
        await this._store.saveToken(this);
      }
    } catch (err) {
      if (err instanceof SDKException) throw err;
      throw new SDKException(
        "TOKEN_ERROR",
        "Error generating access token from grant token.",
        null,
        err instanceof Error ? err : null,
      );
    }
  }
}
