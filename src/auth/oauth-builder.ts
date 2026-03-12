import { OAuthToken } from "./oauth-token.js";
import { SDKException } from "../exception/sdk-exception.js";

export class OAuthBuilder {
  private _clientId: string | null = null;
  private _clientSecret: string | null = null;
  private _refreshToken: string | null = null;
  private _grantToken: string | null = null;
  private _accessToken: string | null = null;
  private _redirectURL: string | null = null;
  private _id: string | null = null;

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

  build(): OAuthToken {
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
    });
  }
}
