import { describe, it, expect } from "vitest";
import { AuthorizationUrlBuilder, parseImplicitFragment } from "../src/auth/authorization-url.js";
import { Environment } from "../src/dc/environment.js";
import { OAuthGrantType } from "../src/auth/oauth-token.js";
import { SDKException } from "../src/exception/sdk-exception.js";
import type { PKCEPair } from "../src/auth/pkce.js";

describe("AuthorizationUrlBuilder", () => {
  const usEnv = new Environment(
    "https://desk.zoho.com",
    "https://accounts.zoho.com/oauth/v2/token",
  );

  const euEnv = new Environment(
    "https://desk.zoho.eu",
    "https://accounts.zoho.eu/oauth/v2/token",
  );

  it("builds an authorization code URL with defaults", () => {
    const url = new AuthorizationUrlBuilder()
      .clientId("cid")
      .scope("Desk.tickets.ALL")
      .redirectUri("https://app.com/callback")
      .build(usEnv);

    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe(
      "https://accounts.zoho.com/oauth/v2/auth",
    );
    expect(parsed.searchParams.get("client_id")).toBe("cid");
    expect(parsed.searchParams.get("scope")).toBe("Desk.tickets.ALL");
    expect(parsed.searchParams.get("redirect_uri")).toBe("https://app.com/callback");
    expect(parsed.searchParams.get("response_type")).toBe("code");
    expect(parsed.searchParams.get("access_type")).toBe("offline");
  });

  it("builds an implicit flow URL", () => {
    const url = new AuthorizationUrlBuilder()
      .clientId("cid")
      .scope("Desk.tickets.READ")
      .redirectUri("https://app.com/callback")
      .responseType("token")
      .build(usEnv);

    const parsed = new URL(url);
    expect(parsed.searchParams.get("response_type")).toBe("token");
  });

  it("includes state and prompt parameters", () => {
    const url = new AuthorizationUrlBuilder()
      .clientId("cid")
      .scope("Desk.tickets.ALL")
      .redirectUri("https://app.com/callback")
      .state("csrf-token")
      .prompt("consent")
      .build(usEnv);

    const parsed = new URL(url);
    expect(parsed.searchParams.get("state")).toBe("csrf-token");
    expect(parsed.searchParams.get("prompt")).toBe("consent");
  });

  it("includes PKCE parameters", () => {
    const pkce: PKCEPair = {
      codeVerifier: "verifier-value",
      codeChallenge: "challenge-value",
      codeChallengeMethod: "S256",
    };

    const url = new AuthorizationUrlBuilder()
      .clientId("cid")
      .scope("Desk.tickets.ALL")
      .redirectUri("https://app.com/callback")
      .pkce(pkce)
      .build(usEnv);

    const parsed = new URL(url);
    expect(parsed.searchParams.get("code_challenge")).toBe("challenge-value");
    expect(parsed.searchParams.get("code_challenge_method")).toBe("S256");
  });

  it("uses correct endpoint for different data centers", () => {
    const url = new AuthorizationUrlBuilder()
      .clientId("cid")
      .scope("Desk.tickets.ALL")
      .redirectUri("https://app.com/callback")
      .build(euEnv);

    expect(url).toContain("https://accounts.zoho.eu/oauth/v2/auth");
  });

  it("sets access_type to online", () => {
    const url = new AuthorizationUrlBuilder()
      .clientId("cid")
      .scope("Desk.tickets.ALL")
      .redirectUri("https://app.com/callback")
      .accessType("online")
      .build(usEnv);

    const parsed = new URL(url);
    expect(parsed.searchParams.get("access_type")).toBe("online");
  });

  it("throws if clientId is missing", () => {
    expect(() => {
      new AuthorizationUrlBuilder()
        .scope("Desk.tickets.ALL")
        .redirectUri("https://app.com/callback")
        .build(usEnv);
    }).toThrow("clientId is required");
  });

  it("throws if scope is missing", () => {
    expect(() => {
      new AuthorizationUrlBuilder()
        .clientId("cid")
        .redirectUri("https://app.com/callback")
        .build(usEnv);
    }).toThrow("scope is required");
  });

  it("throws if redirectUri is missing", () => {
    expect(() => {
      new AuthorizationUrlBuilder()
        .clientId("cid")
        .scope("Desk.tickets.ALL")
        .build(usEnv);
    }).toThrow("redirectUri is required");
  });
});

describe("parseImplicitFragment", () => {
  it("parses access_token and expires_in from fragment", () => {
    const fragment = "access_token=at-123&expires_in=3600&token_type=Bearer";
    const token = parseImplicitFragment(fragment);

    expect(token.getAccessToken()).toBe("at-123");
    expect(token.getGrantType()).toBe(OAuthGrantType.IMPLICIT);
    expect(token.getExpiresIn()).not.toBeNull();

    const expiresIn = parseInt(token.getExpiresIn()!, 10);
    expect(expiresIn).toBeGreaterThan(Date.now());
  });

  it("handles fragment without expires_in", () => {
    const fragment = "access_token=at-456";
    const token = parseImplicitFragment(fragment);

    expect(token.getAccessToken()).toBe("at-456");
    expect(token.getExpiresIn()).toBeNull();
  });

  it("throws if access_token is missing", () => {
    expect(() => {
      parseImplicitFragment("token_type=Bearer&expires_in=3600");
    }).toThrow("No access_token found");
  });

  it("returns a token that cannot be refreshed", async () => {
    const fragment = "access_token=at-789&expires_in=3600";
    const token = parseImplicitFragment(fragment);

    const env = new Environment(
      "https://desk.zoho.com",
      "https://accounts.zoho.com/oauth/v2/token",
    );

    // Should return the token as-is (it's not expired yet)
    const result = await token.authenticate(env);
    expect(result).toBe("at-789");
  });

  it("throws on expired implicit token", async () => {
    const fragment = "access_token=at-expired&expires_in=3600";
    const token = parseImplicitFragment(fragment);

    // Force expiry
    token.setExpiresIn(String(Date.now() - 10000));

    const env = new Environment(
      "https://desk.zoho.com",
      "https://accounts.zoho.com/oauth/v2/token",
    );

    await expect(token.authenticate(env)).rejects.toThrow(
      "cannot be refreshed",
    );
  });
});
