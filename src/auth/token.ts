import type { Environment } from "../dc/environment.js";

/**
 * Abstract base for authentication tokens.
 */
export abstract class Token {
  abstract authenticate(environment: Environment): Promise<string>;
  abstract remove(): Promise<void>;
  abstract generateToken(environment: Environment): Promise<void>;
  async revoke(_environment: Environment): Promise<void> {
    throw new Error("revoke() is not supported on this token type.");
  }
  abstract getId(): string | null;

  // No-op by default; overridden in OAuthToken.
  setId(_id: string | null): void {}

  abstract getClientId(): string | null;
  abstract getClientSecret(): string | null;
  abstract getRefreshToken(): string | null;
  abstract getAccessToken(): string | null;
  abstract getGrantToken(): string | null;
  abstract getExpiresIn(): string | null;
  abstract getRedirectURL(): string | null;
}
