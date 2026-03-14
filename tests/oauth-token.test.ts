import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { OAuthToken } from "../src/auth/oauth-token.js";
import { Environment } from "../src/dc/environment.js";
import { SDKException } from "../src/exception/sdk-exception.js";

describe("OAuthToken.revoke", () => {
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

  it("throws if no refresh token is available", async () => {
    const token = new OAuthToken({ accessToken: "atoken" });
    await expect(token.revoke(env)).rejects.toThrow(SDKException);
    await expect(token.revoke(env)).rejects.toThrow("No refresh token");
  });

  it("calls the correct revoke URL", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ status: "success" }), { status: 200 }),
    );

    const token = new OAuthToken({
      clientId: "cid",
      clientSecret: "csecret",
      refreshToken: "rtoken",
      accessToken: "atoken",
    });

    await token.revoke(env);

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://accounts.zoho.com/oauth/v2/token/revoke",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("derives correct revoke URL for different data centers", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ status: "success" }), { status: 200 }),
    );

    const euEnv = new Environment(
      "https://desk.zoho.eu",
      "https://accounts.zoho.eu/oauth/v2/token",
    );

    const token = new OAuthToken({
      clientId: "cid",
      clientSecret: "csecret",
      refreshToken: "rtoken",
    });

    await token.revoke(euEnv);

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://accounts.zoho.eu/oauth/v2/token/revoke",
      expect.any(Object),
    );
  });

  it("clears token state on success", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ status: "success" }), { status: 200 }),
    );

    const token = new OAuthToken({
      clientId: "cid",
      clientSecret: "csecret",
      refreshToken: "rtoken",
      accessToken: "atoken",
    });
    token.setExpiresIn(String(Date.now() + 60000));

    await token.revoke(env);

    expect(token.getAccessToken()).toBeNull();
    expect(token.getRefreshToken()).toBeNull();
    expect(token.getExpiresIn()).toBeNull();
  });

  it("throws on revocation error response", async () => {
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({ error: "invalid_token" }), { status: 400 }),
    );

    const token = new OAuthToken({
      clientId: "cid",
      clientSecret: "csecret",
      refreshToken: "rtoken",
    });

    await expect(token.revoke(env)).rejects.toThrow(SDKException);

    try {
      await token.revoke(env);
    } catch (e) {
      expect((e as SDKException).code).toBe("TOKEN_REVOKE_ERROR");
    }
  });
});
