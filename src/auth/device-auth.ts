import type { Environment } from "../dc/environment.js";
import { OAuthToken, OAuthGrantType } from "./oauth-token.js";
import { SDKException } from "../exception/sdk-exception.js";

export interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_url: string;
  expires_in: number;
  interval: number;
}

export interface DeviceAuthOptions {
  clientId: string;
  clientSecret: string;
  scope?: string;
  signal?: AbortSignal;
  onPoll?: (status: string) => void;
}

/**
 * Request a device code from Zoho's device authorization endpoint.
 */
export async function requestDeviceCode(
  environment: Environment,
  clientId: string,
  scope: string,
): Promise<DeviceCodeResponse> {
  const deviceCodeUrl = environment.getDeviceCodeUrl();

  const params = new URLSearchParams({
    client_id: clientId,
    scope,
    grant_type: "device_code",
  });

  try {
    const response = await fetch(deviceCodeUrl, {
      method: "POST",
      body: params,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const data = (await response.json()) as Record<string, unknown>;

    if (data.error) {
      throw new SDKException(
        "DEVICE_AUTH_ERROR",
        `Device code request failed: ${data.error as string}`,
        data,
      );
    }

    return {
      device_code: data.device_code as string,
      user_code: data.user_code as string,
      verification_url: (data.verification_url || data.verification_uri) as string,
      expires_in: data.expires_in as number,
      interval: (data.interval as number) || 5,
    };
  } catch (err) {
    if (err instanceof SDKException) throw err;
    throw new SDKException(
      "DEVICE_AUTH_ERROR",
      "Error requesting device code.",
      null,
      err instanceof Error ? err : null,
    );
  }
}

/**
 * Poll for a device token after the user has authorized the device.
 */
export async function pollForDeviceToken(
  environment: Environment,
  deviceCode: DeviceCodeResponse,
  options: DeviceAuthOptions,
): Promise<OAuthToken> {
  const accountsUrl = environment.getAccountsUrl();
  let interval = deviceCode.interval * 1000;
  const expiresAt = Date.now() + deviceCode.expires_in * 1000;

  while (Date.now() < expiresAt) {
    if (options.signal?.aborted) {
      throw new SDKException(
        "DEVICE_AUTH_ERROR",
        "Device authorization polling was aborted.",
      );
    }

    await sleep(interval, options.signal);

    if (options.signal?.aborted) {
      throw new SDKException(
        "DEVICE_AUTH_ERROR",
        "Device authorization polling was aborted.",
      );
    }

    const params = new URLSearchParams({
      client_id: options.clientId,
      client_secret: options.clientSecret,
      grant_type: "device_code",
      code: deviceCode.device_code,
    });

    try {
      const response = await fetch(accountsUrl, {
        method: "POST",
        body: params,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        signal: options.signal,
      });

      const data = (await response.json()) as Record<string, unknown>;

      if (data.error) {
        const error = data.error as string;

        if (error === "authorization_pending") {
          options.onPoll?.("authorization_pending");
          continue;
        }

        if (error === "slow_down") {
          interval += 5000;
          options.onPoll?.("slow_down");
          continue;
        }

        if (error === "expired_token") {
          throw new SDKException(
            "DEVICE_AUTH_ERROR",
            "Device code has expired. Please restart the authorization flow.",
            data,
          );
        }

        if (error === "access_denied") {
          throw new SDKException(
            "DEVICE_AUTH_ERROR",
            "User denied the authorization request.",
            data,
          );
        }

        throw new SDKException(
          "DEVICE_AUTH_ERROR",
          `Device token polling failed: ${error}`,
          data,
        );
      }

      // Success
      const token = new OAuthToken({
        clientId: options.clientId,
        clientSecret: options.clientSecret,
        accessToken: data.access_token as string,
        refreshToken: (data.refresh_token as string) || undefined,
        grantType: OAuthGrantType.DEVICE_CODE,
        scope: options.scope ?? undefined,
      });

      const expiresInSec = data.expires_in as number;
      if (expiresInSec) {
        token.setExpiresIn(String(Date.now() + expiresInSec * 1000));
      }

      options.onPoll?.("success");
      return token;
    } catch (err) {
      if (err instanceof SDKException) throw err;
      if (options.signal?.aborted) {
        throw new SDKException(
          "DEVICE_AUTH_ERROR",
          "Device authorization polling was aborted.",
        );
      }
      throw new SDKException(
        "DEVICE_AUTH_ERROR",
        "Error polling for device token.",
        null,
        err instanceof Error ? err : null,
      );
    }
  }

  throw new SDKException(
    "DEVICE_AUTH_ERROR",
    "Device code has expired. Please restart the authorization flow.",
  );
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    if (signal) {
      const onAbort = () => {
        clearTimeout(timer);
        resolve();
      };
      signal.addEventListener("abort", onAbort, { once: true });
    }
  });
}
