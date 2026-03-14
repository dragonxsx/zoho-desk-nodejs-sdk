import type { Environment } from "../dc/environment.js";

/**
 * Abstract base for authentication tokens.
 */
export abstract class Token {
  abstract authenticate(environment: Environment): Promise<string>;
  abstract remove(): Promise<void>;
  abstract generateToken(environment: Environment): Promise<void>;
  abstract revoke(environment: Environment): Promise<void>;
  abstract getId(): string | null;

  abstract getClientId(): string | null;
  abstract getClientSecret(): string | null;
  abstract getRefreshToken(): string | null;
  abstract getAccessToken(): string | null;
  abstract getGrantToken(): string | null;
  abstract getExpiresIn(): string | null;
  abstract getRedirectURL(): string | null;
}
