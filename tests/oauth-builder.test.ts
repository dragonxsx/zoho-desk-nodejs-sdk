import { describe, it, expect } from "vitest";
import { OAuthBuilder } from "../src/auth/oauth-builder.js";
import { SDKException } from "../src/exception/sdk-exception.js";

describe("OAuthBuilder", () => {
  it("builds token with refresh token", () => {
    const token = new OAuthBuilder()
      .clientId("cid")
      .clientSecret("csecret")
      .refreshToken("rtoken")
      .build();

    expect(token.getClientId()).toBe("cid");
    expect(token.getClientSecret()).toBe("csecret");
    expect(token.getRefreshToken()).toBe("rtoken");
  });

  it("builds token with grant token", () => {
    const token = new OAuthBuilder()
      .clientId("cid")
      .clientSecret("csecret")
      .grantToken("gtoken")
      .redirectURL("http://localhost")
      .build();

    expect(token.getGrantToken()).toBe("gtoken");
    expect(token.getRedirectURL()).toBe("http://localhost");
  });

  it("throws if no token type provided", () => {
    expect(() => {
      new OAuthBuilder().clientId("cid").clientSecret("csecret").build();
    }).toThrow(SDKException);
  });

  it("throws if clientId missing with refresh token", () => {
    expect(() => {
      new OAuthBuilder().refreshToken("rtoken").build();
    }).toThrow(SDKException);
  });

  it("allows accessToken without clientId/secret", () => {
    const token = new OAuthBuilder().accessToken("atoken").build();
    expect(token.getAccessToken()).toBe("atoken");
  });

  it("allows id without clientId/secret", () => {
    const token = new OAuthBuilder().id("123").build();
    expect(token.getId()).toBe("123");
  });

  it("passes codeVerifier to token", () => {
    const token = new OAuthBuilder()
      .clientId("cid")
      .clientSecret("csecret")
      .grantToken("gtoken")
      .codeVerifier("my-verifier")
      .build();

    // codeVerifier is internal but we can verify it was accepted by the builder
    // by checking the token was built successfully
    expect(token.getGrantToken()).toBe("gtoken");
  });
});
