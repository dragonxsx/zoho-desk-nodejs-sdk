import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { FileStore } from "../src/store/file-store.js";
import { OAuthToken } from "../src/auth/oauth-token.js";

describe("FileStore", () => {
  let tmpFile: string;
  let store: FileStore;

  beforeEach(() => {
    tmpFile = path.join(os.tmpdir(), `test-tokens-${Date.now()}.csv`);
    store = new FileStore(tmpFile);
  });

  afterEach(() => {
    if (fs.existsSync(tmpFile)) {
      fs.unlinkSync(tmpFile);
    }
  });

  it("creates file with headers on construction", () => {
    expect(fs.existsSync(tmpFile)).toBe(true);
    const content = fs.readFileSync(tmpFile, "utf-8");
    expect(content).toContain("id,client_id");
  });

  it("saves and retrieves a token", async () => {
    const token = new OAuthToken({
      clientId: "cid",
      clientSecret: "csecret",
      refreshToken: "rtoken",
    });
    token.setId("1");

    await store.saveToken(token);

    const found = await store.findToken(token);
    expect(found).not.toBeNull();
    expect(found!.getClientId()).toBe("cid");
    expect(found!.getRefreshToken()).toBe("rtoken");
  });

  it("finds token by ID", async () => {
    const token = new OAuthToken({
      clientId: "cid",
      clientSecret: "csecret",
      refreshToken: "rtoken",
    });
    token.setId("42");

    await store.saveToken(token);

    const found = await store.findTokenById("42");
    expect(found).not.toBeNull();
    expect(found!.getClientId()).toBe("cid");
  });

  it("returns null for missing token", async () => {
    const found = await store.findTokenById("999");
    expect(found).toBeNull();
  });

  it("deletes a token", async () => {
    const token = new OAuthToken({
      clientId: "cid",
      clientSecret: "csecret",
      refreshToken: "rtoken",
    });
    token.setId("1");

    await store.saveToken(token);
    await store.deleteToken("1");

    const found = await store.findTokenById("1");
    expect(found).toBeNull();
  });

  it("gets all tokens", async () => {
    const t1 = new OAuthToken({ clientId: "c1", refreshToken: "r1" });
    t1.setId("1");
    const t2 = new OAuthToken({ clientId: "c2", refreshToken: "r2" });
    t2.setId("2");

    await store.saveToken(t1);
    await store.saveToken(t2);

    const all = await store.getTokens();
    expect(all.length).toBe(2);
  });

  it("deletes all tokens", async () => {
    const token = new OAuthToken({ clientId: "c1", refreshToken: "r1" });
    token.setId("1");
    await store.saveToken(token);

    await store.deleteTokens();

    const all = await store.getTokens();
    expect(all.length).toBe(0);
  });

  it("updates existing token on save", async () => {
    const token = new OAuthToken({
      clientId: "cid",
      clientSecret: "csecret",
      refreshToken: "rtoken",
    });
    token.setId("1");
    await store.saveToken(token);

    token.setAccessToken("new-access");
    await store.saveToken(token);

    const all = await store.getTokens();
    expect(all.length).toBe(1);
    expect(all[0].getAccessToken()).toBe("new-access");
  });
});
