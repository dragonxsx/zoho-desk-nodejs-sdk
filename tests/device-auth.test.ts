import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { requestDeviceCode, pollForDeviceToken } from "../src/auth/device-auth.js";
import type { DeviceCodeResponse } from "../src/auth/device-auth.js";
import { Environment } from "../src/dc/environment.js";
import { OAuthGrantType } from "../src/auth/oauth-token.js";
import { SDKException } from "../src/exception/sdk-exception.js";

describe("Device Authorization Grant", () => {
  const env = new Environment(
    "https://desk.zoho.com",
    "https://accounts.zoho.com/oauth/v2/token",
  );

  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, "fetch");
    vi.useFakeTimers();
  });

  afterEach(() => {
    fetchSpy.mockRestore();
    vi.useRealTimers();
  });

  describe("requestDeviceCode", () => {
    it("posts to the device code endpoint", async () => {
      fetchSpy.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            device_code: "dc-123",
            user_code: "ABCD-1234",
            verification_url: "https://accounts.zoho.com/oauth/v2/device",
            expires_in: 600,
            interval: 5,
          }),
          { status: 200 },
        ),
      );

      const result = await requestDeviceCode(env, "cid", "Desk.tickets.ALL");

      expect(fetchSpy).toHaveBeenCalledWith(
        "https://accounts.zoho.com/oauth/v2/device/code",
        expect.objectContaining({ method: "POST" }),
      );

      expect(result.device_code).toBe("dc-123");
      expect(result.user_code).toBe("ABCD-1234");
      expect(result.verification_url).toBe(
        "https://accounts.zoho.com/oauth/v2/device",
      );
      expect(result.expires_in).toBe(600);
      expect(result.interval).toBe(5);
    });

    it("sends correct parameters", async () => {
      fetchSpy.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            device_code: "dc",
            user_code: "UC",
            verification_url: "https://example.com",
            expires_in: 600,
            interval: 5,
          }),
          { status: 200 },
        ),
      );

      await requestDeviceCode(env, "my-client", "Desk.tickets.READ");

      const call = fetchSpy.mock.calls[0];
      const body = call[1]!.body as URLSearchParams;
      expect(body.get("client_id")).toBe("my-client");
      expect(body.get("scope")).toBe("Desk.tickets.READ");
      expect(body.get("grant_type")).toBe("device_code");
    });

    it("throws on error response", async () => {
      fetchSpy.mockResolvedValueOnce(
        new Response(
          JSON.stringify({ error: "invalid_scope" }),
          { status: 400 },
        ),
      );

      await expect(
        requestDeviceCode(env, "cid", "Bad.scope"),
      ).rejects.toThrow(SDKException);
    });

    it("uses verification_uri as fallback", async () => {
      fetchSpy.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            device_code: "dc",
            user_code: "UC",
            verification_uri: "https://fallback.com/verify",
            expires_in: 600,
            interval: 5,
          }),
          { status: 200 },
        ),
      );

      const result = await requestDeviceCode(env, "cid", "scope");
      expect(result.verification_url).toBe("https://fallback.com/verify");
    });
  });

  describe("pollForDeviceToken", () => {
    const deviceCode: DeviceCodeResponse = {
      device_code: "dc-123",
      user_code: "ABCD-1234",
      verification_url: "https://accounts.zoho.com/device",
      expires_in: 600,
      interval: 1,
    };

    it("returns token on immediate success", async () => {
      fetchSpy.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            access_token: "at-device",
            refresh_token: "rt-device",
            expires_in: 3600,
          }),
          { status: 200 },
        ),
      );

      const promise = pollForDeviceToken(env, deviceCode, {
        clientId: "cid",
        clientSecret: "csecret",
      });

      await vi.advanceTimersByTimeAsync(1000);

      const token = await promise;
      expect(token.getAccessToken()).toBe("at-device");
      expect(token.getRefreshToken()).toBe("rt-device");
      expect(token.getGrantType()).toBe(OAuthGrantType.DEVICE_CODE);
    });

    it("retries on authorization_pending", async () => {
      fetchSpy
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({ error: "authorization_pending" }),
            { status: 400 },
          ),
        )
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              access_token: "at-device",
              expires_in: 3600,
            }),
            { status: 200 },
          ),
        );

      const onPoll = vi.fn();
      const promise = pollForDeviceToken(env, deviceCode, {
        clientId: "cid",
        clientSecret: "csecret",
        onPoll,
      });

      // First poll interval
      await vi.advanceTimersByTimeAsync(1000);
      // Second poll interval
      await vi.advanceTimersByTimeAsync(1000);

      const token = await promise;
      expect(token.getAccessToken()).toBe("at-device");
      expect(onPoll).toHaveBeenCalledWith("authorization_pending");
      expect(onPoll).toHaveBeenCalledWith("success");
    });

    it("backs off on slow_down", async () => {
      fetchSpy
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({ error: "slow_down" }),
            { status: 400 },
          ),
        )
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              access_token: "at-device",
              expires_in: 3600,
            }),
            { status: 200 },
          ),
        );

      const onPoll = vi.fn();
      const promise = pollForDeviceToken(env, deviceCode, {
        clientId: "cid",
        clientSecret: "csecret",
        onPoll,
      });

      // First poll: interval = 1s
      await vi.advanceTimersByTimeAsync(1000);
      // After slow_down, interval increases by 5s → 6s total
      await vi.advanceTimersByTimeAsync(6000);

      const token = await promise;
      expect(token.getAccessToken()).toBe("at-device");
      expect(onPoll).toHaveBeenCalledWith("slow_down");
    });

    it("throws on expired_token", async () => {
      fetchSpy.mockResolvedValueOnce(
        new Response(
          JSON.stringify({ error: "expired_token" }),
          { status: 400 },
        ),
      );

      const promise = pollForDeviceToken(env, deviceCode, {
        clientId: "cid",
        clientSecret: "csecret",
      });

      // Attach rejection handler before advancing timers to avoid unhandled rejection
      const assertion = expect(promise).rejects.toThrow("expired");
      await vi.advanceTimersByTimeAsync(1000);
      await assertion;
    });

    it("throws on access_denied", async () => {
      fetchSpy.mockResolvedValueOnce(
        new Response(
          JSON.stringify({ error: "access_denied" }),
          { status: 400 },
        ),
      );

      const promise = pollForDeviceToken(env, deviceCode, {
        clientId: "cid",
        clientSecret: "csecret",
      });

      const assertion = expect(promise).rejects.toThrow("denied");
      await vi.advanceTimersByTimeAsync(1000);
      await assertion;
    });

    it("supports AbortSignal cancellation", async () => {
      const controller = new AbortController();
      controller.abort();

      await expect(
        pollForDeviceToken(env, deviceCode, {
          clientId: "cid",
          clientSecret: "csecret",
          signal: controller.signal,
        }),
      ).rejects.toThrow("aborted");
    });

    it("calls onPoll callback with status updates", async () => {
      fetchSpy
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({ error: "authorization_pending" }),
            { status: 400 },
          ),
        )
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              access_token: "at-device",
              expires_in: 3600,
            }),
            { status: 200 },
          ),
        );

      const statuses: string[] = [];
      const promise = pollForDeviceToken(env, deviceCode, {
        clientId: "cid",
        clientSecret: "csecret",
        onPoll: (status) => statuses.push(status),
      });

      await vi.advanceTimersByTimeAsync(1000);
      await vi.advanceTimersByTimeAsync(1000);

      await promise;
      expect(statuses).toEqual(["authorization_pending", "success"]);
    });

    it("posts correct parameters to token endpoint", async () => {
      fetchSpy.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            access_token: "at",
            expires_in: 3600,
          }),
          { status: 200 },
        ),
      );

      const promise = pollForDeviceToken(env, deviceCode, {
        clientId: "my-cid",
        clientSecret: "my-csecret",
      });

      await vi.advanceTimersByTimeAsync(1000);

      await promise;

      const call = fetchSpy.mock.calls[0];
      expect(call[0]).toBe("https://accounts.zoho.com/oauth/v2/token");
      const body = call[1]!.body as URLSearchParams;
      expect(body.get("grant_type")).toBe("device_code");
      expect(body.get("code")).toBe("dc-123");
      expect(body.get("client_id")).toBe("my-cid");
      expect(body.get("client_secret")).toBe("my-csecret");
    });
  });
});
