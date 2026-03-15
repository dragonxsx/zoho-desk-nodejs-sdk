import { randomBytes, createHash } from "node:crypto";

const CODE_VERIFIER_CHARSET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";

/**
 * Generate a cryptographically random code verifier (43–128 characters, URL-safe).
 */
export function generateCodeVerifier(length: number = 128): string {
  const clamped = Math.max(43, Math.min(128, length));
  const bytes = randomBytes(clamped);
  let result = "";
  for (let i = 0; i < clamped; i++) {
    result += CODE_VERIFIER_CHARSET[bytes[i] % CODE_VERIFIER_CHARSET.length];
  }
  return result;
}

/**
 * Generate a code challenge from a code verifier using SHA-256 + base64url.
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const digest = createHash("sha256").update(verifier).digest();
  return base64UrlEncode(new Uint8Array(digest));
}

export interface PKCEPair {
  codeVerifier: string;
  codeChallenge: string;
  codeChallengeMethod: "S256";
}

/**
 * Generate a complete PKCE pair (verifier + challenge).
 */
export async function generatePKCEPair(): Promise<PKCEPair> {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  return {
    codeVerifier,
    codeChallenge,
    codeChallengeMethod: "S256",
  };
}

function base64UrlEncode(buffer: Uint8Array): string {
  let binary = "";
  for (const byte of buffer) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
