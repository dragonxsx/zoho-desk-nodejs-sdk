import fs from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import type { TokenStore } from "./token-store.js";
import type { Token } from "../auth/token.js";
import { OAuthToken, OAuthGrantType } from "../auth/oauth-token.js";
import { SDKException } from "../exception/sdk-exception.js";

const HEADERS = [
  "id",
  "client_id",
  "client_secret",
  "refresh_token",
  "access_token",
  "grant_token",
  "expiry_time",
  "redirect_url",
  "grant_type",
  "scope",
];

/**
 * CSV-based token persistence.
 */
export class FileStore implements TokenStore {
  private readonly filePath: string;
  private _lock: Promise<void> = Promise.resolve();

  constructor(filePath: string) {
    this.filePath = filePath;
    this.ensureFile();
  }

  private ensureFile(): void {
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, HEADERS.join(",") + "\n", "utf-8");
    }
  }

  private async serialize<T>(fn: () => Promise<T>): Promise<T> {
    const prev = this._lock;
    let release!: () => void;
    this._lock = new Promise<void>((resolve) => {
      release = resolve;
    });
    await prev;
    try {
      return await fn();
    } finally {
      release();
    }
  }

  private async readAllRows(): Promise<string[][]> {
    const content = (await readFile(this.filePath, "utf-8")).trim();
    const lines = content.split("\n");
    // Skip header
    return lines.slice(1).map((line) => line.split(","));
  }

  private async writeAllRows(rows: string[][]): Promise<void> {
    const lines = [HEADERS.join(","), ...rows.map((r) => r.join(","))];
    await writeFile(this.filePath, lines.join("\n") + "\n", "utf-8");
  }

  private rowToToken(row: string[]): OAuthToken {
    const token = new OAuthToken({
      clientId: row[1] || undefined,
      clientSecret: row[2] || undefined,
      refreshToken: row[3] || undefined,
      accessToken: row[4] || undefined,
      grantToken: row[5] || undefined,
      redirectURL: row[7] || undefined,
      grantType: (row[8] as OAuthGrantType) || undefined,
      scope: row[9] || undefined,
    });
    token.setId(row[0] || null);
    token.setExpiresIn(row[6] || null);
    return token;
  }

  async findToken(token: Token): Promise<Token | null> {
    try {
      const rows = await this.readAllRows();
      for (const row of rows) {
        if (row.length < 8) continue;
        const clientId = token.getClientId();
        const grantToken = token.getGrantToken();
        const refreshToken = token.getRefreshToken();
        const grantType = token.getGrantType();

        if (clientId && row[1] === clientId) {
          // Client credentials tokens match by clientId + grantType
          if (grantType === OAuthGrantType.CLIENT_CREDENTIALS && row[8] === OAuthGrantType.CLIENT_CREDENTIALS) {
            return this.rowToToken(row);
          }
          if (grantToken && row[5] === grantToken) {
            return this.rowToToken(row);
          }
          if (refreshToken && row[3] === refreshToken) {
            return this.rowToToken(row);
          }
        }
      }
      return null;
    } catch (err) {
      throw new SDKException(
        "TOKEN_STORE_ERROR",
        "Error finding token in file store.",
        null,
        err instanceof Error ? err : null,
      );
    }
  }

  async findTokenById(id: string): Promise<Token | null> {
    try {
      const rows = await this.readAllRows();
      for (const row of rows) {
        if (row.length >= 8 && row[0] === id) {
          return this.rowToToken(row);
        }
      }
      return null;
    } catch (err) {
      throw new SDKException(
        "TOKEN_STORE_ERROR",
        "Error finding token by ID in file store.",
        null,
        err instanceof Error ? err : null,
      );
    }
  }

  async saveToken(token: Token): Promise<void> {
    await this.serialize(async () => {
      try {
        const rows = await this.readAllRows();

        const generatedId = token.getId() || String(rows.length + 1);
        const newRow = [
          generatedId,
          token.getClientId() || "",
          token.getClientSecret() || "",
          token.getRefreshToken() || "",
          token.getAccessToken() || "",
          token.getGrantToken() || "",
          token.getExpiresIn() || "",
          token.getRedirectURL() || "",
          token.getGrantType() || "",
          token.getScope() || "",
        ];

        if (!token.getId()) {
          token.setId(generatedId);
        }

        // Update existing or append
        let found = false;
        for (let i = 0; i < rows.length; i++) {
          if (rows[i].length >= 2 && rows[i][0] === newRow[0]) {
            rows[i] = newRow;
            found = true;
            break;
          }
        }
        if (!found) {
          rows.push(newRow);
        }

        await this.writeAllRows(rows);
      } catch (err) {
        throw new SDKException(
          "TOKEN_STORE_ERROR",
          "Error saving token to file store.",
          null,
          err instanceof Error ? err : null,
        );
      }
    });
  }

  async deleteToken(id: string): Promise<void> {
    await this.serialize(async () => {
      try {
        const rows = await this.readAllRows();
        const filtered = rows.filter((r) => r[0] !== id);
        await this.writeAllRows(filtered);
      } catch (err) {
        throw new SDKException(
          "TOKEN_STORE_ERROR",
          "Error deleting token from file store.",
          null,
          err instanceof Error ? err : null,
        );
      }
    });
  }

  async getTokens(): Promise<Token[]> {
    try {
      const rows = await this.readAllRows();
      return rows.filter((r) => r.length >= 8).map((r) => this.rowToToken(r));
    } catch (err) {
      throw new SDKException(
        "TOKEN_STORE_ERROR",
        "Error reading tokens from file store.",
        null,
        err instanceof Error ? err : null,
      );
    }
  }

  async deleteTokens(): Promise<void> {
    await this.serialize(async () => {
      try {
        await writeFile(
          this.filePath,
          HEADERS.join(",") + "\n",
          "utf-8",
        );
      } catch (err) {
        throw new SDKException(
          "TOKEN_STORE_ERROR",
          "Error deleting all tokens from file store.",
          null,
          err instanceof Error ? err : null,
        );
      }
    });
  }
}
