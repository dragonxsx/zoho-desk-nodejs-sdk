import { OAuthToken, OAuthGrantType } from "./oauth-token.js";
import { SDKException } from "../exception/sdk-exception.js";

export class OAuthBuilder {
  private _clientId: string | null = null;
  private _clientSecret: string | null = null;
  private _refreshToken: string | null = null;
  private _grantToken: string | null = null;
  private _accessToken: string | null = null;
  private _redirectURL: string | null = null;
  private _id: string | null = null;
  private _codeVerifier: string | null = null;
  private _grantType: OAuthGrantType | null = null;
  private _scope: string | null = null;
  private _orgId: string | null = null;

  clientId(clientId: string): this {
    this._clientId = clientId;
    return this;
  }

  clientSecret(clientSecret: string): this {
    this._clientSecret = clientSecret;
    return this;
  }

  refreshToken(refreshToken: string): this {
    this._refreshToken = refreshToken;
    return this;
  }

  grantToken(grantToken: string): this {
    this._grantToken = grantToken;
    return this;
  }

  accessToken(accessToken: string): this {
    this._accessToken = accessToken;
    return this;
  }

  redirectURL(redirectURL: string): this {
    this._redirectURL = redirectURL;
    return this;
  }

  id(id: string): this {
    this._id = id;
    return this;
  }

  codeVerifier(codeVerifier: string): this {
    this._codeVerifier = codeVerifier;
    return this;
  }

  scope(scope: string): this {
    this._scope = scope;
    return this;
  }

  orgId(orgId: string): this {
    this._orgId = orgId;
    return this;
  }

  clientCredentials(): this {
    this._grantType = OAuthGrantType.CLIENT_CREDENTIALS;
    return this;
  }

  build(): OAuthToken {
    // Client credentials validation
    if (this._grantType === OAuthGrantType.CLIENT_CREDENTIALS) {
      if (!this._clientId || !this._clientSecret) {
        throw new SDKException(
          "MANDATORY_VALUE_ERROR",
          "clientId and clientSecret are required for client_credentials grant.",
        );
      }
      if (!this._scope) {
        throw new SDKException(
          "MANDATORY_VALUE_ERROR",
          "scope is required for client_credentials grant.",
        );
      }
      return new OAuthToken({
        clientId: this._clientId,
        clientSecret: this._clientSecret,
        id: this._id ?? undefined,
        grantType: OAuthGrantType.CLIENT_CREDENTIALS,
        scope: this._scope,
        orgId: this._orgId ?? undefined,
      });
    }

    // Existing validation
    if (!this._grantToken && !this._refreshToken && !this._accessToken && !this._id) {
      throw new SDKException(
        "MANDATORY_VALUE_ERROR",
        "At least one of grantToken, refreshToken, accessToken, or id must be provided.",
      );
    }

    if ((this._grantToken || this._refreshToken) && (!this._clientId || !this._clientSecret)) {
      throw new SDKException(
        "MANDATORY_VALUE_ERROR",
        "clientId and clientSecret are required when using grantToken or refreshToken.",
      );
    }

    return new OAuthToken({
      clientId: this._clientId ?? undefined,
      clientSecret: this._clientSecret ?? undefined,
      refreshToken: this._refreshToken ?? undefined,
      grantToken: this._grantToken ?? undefined,
      accessToken: this._accessToken ?? undefined,
      redirectURL: this._redirectURL ?? undefined,
      id: this._id ?? undefined,
      codeVerifier: this._codeVerifier ?? undefined,
      scope: this._scope ?? undefined,
    });
  }
}
