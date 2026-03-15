import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { OAuthBuilder } from "../src/auth/oauth-builder.js";
import { OAuthToken, OAuthGrantType } from "../src/auth/oauth-token.js";
import { Environment } from "../src/dc/environment.js";
import { SDKException } from "../src/exception/sdk-exception.js";

describe("Client Credentials Grant", () => {
  const env = new Environment(
    "https://desk.zoho.com",
    "https://accounts.zoho.com/oauth/v2/token",
  );

  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, "fetch");
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  describe("OAuthBuilder — client credentials", () => {
    it("builds a client_credentials token with scope", () => {
      const token = new OAuthBuilder()
        .clientId("cid")
        .clientSecret("csecret")
        .scope("Desk.tickets.ALL")
        .orgId("12345")
        .clientCredentials()
        .build();

      expect(token.getClientId()).toBe("cid");
      expect(token.getClientSecret()).toBe("csecret");
      expect(token.getGrantType()).toBe(OAuthGrantType.CLIENT_CREDENTIALS);
      expect(token.getScope()).toBe("Desk.tickets.ALL");
    });

    it("throws if clientId missing for client_credentials", () => {
      expect(() => {
        new OAuthBuilder()
          .clientSecret("csecret")
          .scope("Desk.tickets.ALL")
          .orgId("12345")
          .clientCredentials()
          .build();
      }).toThrow(SDKException);
    });

    it("throws if clientSecret missing for client_credentials", () => {
      expect(() => {
        new OAuthBuilder()
          .clientId("cid")
          .scope("Desk.tickets.ALL")
          .orgId("12345")
          .clientCredentials()
          .build();
      }).toThrow(SDKException);
    });

    it("throws if scope missing for client_credentials", () => {
      expect(() => {
        new OAuthBuilder()
          .clientId("cid")
          .clientSecret("csecret")
          .clientCredentials()
          .build();
      }).toThrow(SDKException);
    });

    it("throws if orgId missing for client_credentials", () => {
      expect(() => {
        new OAuthBuilder()
          .clientId("cid")
          .clientSecret("csecret")
          .scope("Desk.tickets.ALL")
          .clientCredentials()
          .build();
      }).toThrow(SDKException);
    });

    it("builds a client_credentials token with orgId", () => {
      const token = new OAuthBuilder()
        .clientId("cid")
        .clientSecret("csecret")
        .scope("Desk.tickets.ALL")
        .orgId("12345")
        .clientCredentials()
        .build();

      expect(token.getOrgId()).toBe("12345");
    });
  });

  describe("OAuthToken.authenticate — client_credentials", () => {
    it("requests token with correct parameters including soid", async () => {
      fetchSpy.mockResolvedValueOnce(
        new Response(
          JSON.stringify({ access_token: "at-123", expires_in: 3600 }),
          { status: 200 },
        ),
      );

      const token = new OAuthToken({
        clientId: "cid",
        clientSecret: "csecret",
        grantType: OAuthGrantType.CLIENT_CREDENTIALS,
        scope: "Desk.tickets.ALL",
        orgId: "12345",
      });

      const result = await token.authenticate(env);

      expect(result).toBe("at-123");
      expect(fetchSpy).toHaveBeenCalledWith(
        "https://accounts.zoho.com/oauth/v2/token",
        expect.objectContaining({ method: "POST" }),
      );

      // Verify the body contains correct grant_type and soid
      const call = fetchSpy.mock.calls[0];
      const body = call[1]!.body as URLSearchParams;
      expect(body.get("grant_type")).toBe("client_credentials");
      expect(body.get("scope")).toBe("Desk.tickets.ALL");
      expect(body.get("client_id")).toBe("cid");
      expect(body.get("client_secret")).toBe("csecret");
      expect(body.get("soid")).toBe("Desk.12345");
    });

    it("sends pre-formatted soid as-is", async () => {
      fetchSpy.mockResolvedValueOnce(
        new Response(
          JSON.stringify({ access_token: "at-123", expires_in: 3600 }),
          { status: 200 },
        ),
      );

      const token = new OAuthToken({
        clientId: "cid",
        clientSecret: "csecret",
        grantType: OAuthGrantType.CLIENT_CREDENTIALS,
        scope: "Desk.tickets.ALL",
        orgId: "Desk.12345",
      });

      await token.authenticate(env);

      const call = fetchSpy.mock.calls[0];
      const body = call[1]!.body as URLSearchParams;
      expect(body.get("soid")).toBe("Desk.12345");
    });

    it("does not send soid when not set", async () => {
      fetchSpy.mockResolvedValueOnce(
        new Response(
          JSON.stringify({ access_token: "at-123", expires_in: 3600 }),
          { status: 200 },
        ),
      );

      const token = new OAuthToken({
        clientId: "cid",
        clientSecret: "csecret",
        grantType: OAuthGrantType.CLIENT_CREDENTIALS,
        scope: "Desk.tickets.ALL",
      });

      await token.authenticate(env);

      const call = fetchSpy.mock.calls[0];
      const body = call[1]!.body as URLSearchParams;
      expect(body.has("soid")).toBe(false);
    });

    it("re-requests on expiry instead of refreshing", async () => {
      // First call — returns a token
      fetchSpy.mockResolvedValueOnce(
        new Response(
          JSON.stringify({ access_token: "at-1", expires_in: 1 }),
          { status: 200 },
        ),
      );

      const token = new OAuthToken({
        clientId: "cid",
        clientSecret: "csecret",
        grantType: OAuthGrantType.CLIENT_CREDENTIALS,
        scope: "Desk.tickets.ALL",
      });

      await token.authenticate(env);

      // Simulate expiry
      token.setExpiresIn(String(Date.now() - 10000));

      // Second call — re-requests
      fetchSpy.mockResolvedValueOnce(
        new Response(
          JSON.stringify({ access_token: "at-2", expires_in: 3600 }),
          { status: 200 },
        ),
      );

      const result = await token.authenticate(env);
      expect(result).toBe("at-2");
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    it("throws on error response", async () => {
      fetchSpy.mockResolvedValueOnce(
        new Response(
          JSON.stringify({ error: "invalid_client" }),
          { status: 401 },
        ),
      );

      const token = new OAuthToken({
        clientId: "cid",
        clientSecret: "csecret",
        grantType: OAuthGrantType.CLIENT_CREDENTIALS,
        scope: "Desk.tickets.ALL",
      });

      await expect(token.authenticate(env)).rejects.toThrow(SDKException);
    });
  });

  describe("OAuthToken.revoke — client_credentials (access token only)", () => {
    it("revokes the access token when no refresh token exists", async () => {
      fetchSpy.mockResolvedValueOnce(
        new Response(JSON.stringify({ status: "success" }), { status: 200 }),
      );

      const token = new OAuthToken({
        clientId: "cid",
        clientSecret: "csecret",
        accessToken: "at-123",
        grantType: OAuthGrantType.CLIENT_CREDENTIALS,
        scope: "Desk.tickets.ALL",
      });

      await token.revoke(env);

      expect(fetchSpy).toHaveBeenCalledWith(
        "https://accounts.zoho.com/oauth/v2/token/revoke",
        expect.objectContaining({ method: "POST" }),
      );

      const call = fetchSpy.mock.calls[0];
      const body = call[1]!.body as URLSearchParams;
      expect(body.get("token")).toBe("at-123");
    });

    it("throws when no token available to revoke", async () => {
      const token = new OAuthToken({
        clientId: "cid",
        clientSecret: "csecret",
        grantType: OAuthGrantType.CLIENT_CREDENTIALS,
        scope: "Desk.tickets.ALL",
      });

      await expect(token.revoke(env)).rejects.toThrow("No token available to revoke");
    });
  });
});
