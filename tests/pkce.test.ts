import { describe, it, expect } from "vitest";
import {
  generateCodeVerifier,
  generateCodeChallenge,
  generatePKCEPair,
} from "../src/auth/pkce.js";

const URL_SAFE_REGEX = /^[A-Za-z0-9\-._~]+$/;

describe("PKCE utilities", () => {
  describe("generateCodeVerifier", () => {
    it("defaults to 128 characters", () => {
      const verifier = generateCodeVerifier();
      expect(verifier.length).toBe(128);
    });

    it("respects custom length", () => {
      const verifier = generateCodeVerifier(64);
      expect(verifier.length).toBe(64);
    });

    it("clamps to minimum 43 characters", () => {
      const verifier = generateCodeVerifier(10);
      expect(verifier.length).toBe(43);
    });

    it("clamps to maximum 128 characters", () => {
      const verifier = generateCodeVerifier(200);
      expect(verifier.length).toBe(128);
    });

    it("contains only URL-safe characters", () => {
      const verifier = generateCodeVerifier();
      expect(verifier).toMatch(URL_SAFE_REGEX);
    });

    it("generates unique values", () => {
      const v1 = generateCodeVerifier();
      const v2 = generateCodeVerifier();
      expect(v1).not.toBe(v2);
    });
  });

  describe("generateCodeChallenge", () => {
    it("produces a base64url-encoded string", async () => {
      const challenge = await generateCodeChallenge("test-verifier");
      // base64url: no +, /, or = padding
      expect(challenge).not.toContain("+");
      expect(challenge).not.toContain("/");
      expect(challenge).not.toContain("=");
    });

    it("produces consistent output for same input", async () => {
      const c1 = await generateCodeChallenge("same-verifier");
      const c2 = await generateCodeChallenge("same-verifier");
      expect(c1).toBe(c2);
    });

    it("produces different output for different input", async () => {
      const c1 = await generateCodeChallenge("verifier-a");
      const c2 = await generateCodeChallenge("verifier-b");
      expect(c1).not.toBe(c2);
    });

    // Known test vector: SHA-256 of "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk" should produce
    // "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM" (RFC 7636 Appendix B)
    it("matches RFC 7636 Appendix B test vector", async () => {
      const challenge = await generateCodeChallenge(
        "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk",
      );
      expect(challenge).toBe("E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
    });
  });

  describe("generatePKCEPair", () => {
    it("returns verifier, challenge, and method", async () => {
      const pair = await generatePKCEPair();
      expect(pair.codeVerifier).toBeDefined();
      expect(pair.codeChallenge).toBeDefined();
      expect(pair.codeChallengeMethod).toBe("S256");
    });

    it("challenge matches verifier", async () => {
      const pair = await generatePKCEPair();
      const challenge = await generateCodeChallenge(pair.codeVerifier);
      expect(pair.codeChallenge).toBe(challenge);
    });

    it("verifier is 128 characters", async () => {
      const pair = await generatePKCEPair();
      expect(pair.codeVerifier.length).toBe(128);
    });
  });
});
