import type { Token } from "../auth/token.js";

/**
 * Interface for token persistence.
 */
export interface TokenStore {
  findToken(token: Token): Promise<Token | null>;
  findTokenById(id: string): Promise<Token | null>;
  saveToken(token: Token): Promise<void>;
  deleteToken(id: string): Promise<void>;
  getTokens(): Promise<Token[]>;
  deleteTokens(): Promise<void>;
}
