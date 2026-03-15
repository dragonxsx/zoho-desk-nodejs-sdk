import type { Environment } from "../dc/environment.js";
import type { PKCEPair } from "./pkce.js";
import { OAuthToken, OAuthGrantType } from "./oauth-token.js";
import { SDKException } from "../exception/sdk-exception.js";

export class AuthorizationUrlBuilder {
  private _clientId: string | null = null;
  private _scope: string | null = null;
  private _redirectUri: string | null = null;
  private _responseType: "code" | "token" = "code";
  private _accessType: "offline" | "online" = "offline";
  private _state: string | null = null;
  private _prompt: string | null = null;
  private _codeChallenge: string | null = null;
  private _codeChallengeMethod: string | null = null;

  clientId(clientId: string): this {
    this._clientId = clientId;
    return this;
  }

  scope(scope: string): this {
    this._scope = scope;
    return this;
  }

  redirectUri(redirectUri: string): this {
    this._redirectUri = redirectUri;
    return this;
  }

  responseType(responseType: "code" | "token"): this {
    this._responseType = responseType;
    return this;
  }

  accessType(accessType: "offline" | "online"): this {
    this._accessType = accessType;
    return this;
  }

  state(state: string): this {
    this._state = state;
    return this;
  }

  prompt(prompt: string): this {
    this._prompt = prompt;
    return this;
  }

  pkce(pair: PKCEPair): this {
    this._codeChallenge = pair.codeChallenge;
    this._codeChallengeMethod = pair.codeChallengeMethod;
    return this;
  }

  build(environment: Environment): string {
    if (!this._clientId) {
      throw new SDKException(
        "MANDATORY_VALUE_ERROR",
        "clientId is required to build an authorization URL.",
      );
    }
    if (!this._scope) {
      throw new SDKException(
        "MANDATORY_VALUE_ERROR",
        "scope is required to build an authorization URL.",
      );
    }
    if (!this._redirectUri) {
      throw new SDKException(
        "MANDATORY_VALUE_ERROR",
        "redirectUri is required to build an authorization URL.",
      );
    }

    const authUrl = environment.getAuthorizationUrl();
    const params = new URLSearchParams({
      client_id: this._clientId,
      scope: this._scope,
      redirect_uri: this._redirectUri,
      response_type: this._responseType,
      access_type: this._accessType,
    });

    if (this._state) {
      params.set("state", this._state);
    }
    if (this._prompt) {
      params.set("prompt", this._prompt);
    }
    if (this._codeChallenge) {
      params.set("code_challenge", this._codeChallenge);
      params.set("code_challenge_method", this._codeChallengeMethod || "S256");
    }

    return `${authUrl}?${params.toString()}`;
  }
}

/**
 * Parse an OAuth 2.0 implicit flow URL fragment into an OAuthToken.
 * The fragment should be the hash portion of the redirect URL (without the leading #).
 */
export function parseImplicitFragment(fragment: string): OAuthToken {
  const params = new URLSearchParams(fragment);
  const accessToken = params.get("access_token");

  if (!accessToken) {
    throw new SDKException(
      "TOKEN_ERROR",
      "No access_token found in URL fragment.",
    );
  }

  const expiresIn = params.get("expires_in");
  const token = new OAuthToken({
    accessToken,
    grantType: OAuthGrantType.IMPLICIT,
  });

  if (expiresIn) {
    const expiresInMs = parseInt(expiresIn, 10) * 1000;
    token.setExpiresIn(String(Date.now() + expiresInMs));
  }

  return token;
}
