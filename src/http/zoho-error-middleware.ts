import type { Middleware } from "@microsoft/kiota-http-fetchlibrary";
import type { RequestOption } from "@microsoft/kiota-abstractions";
import { ZohoApiError } from "../exception/zoho-api-error.js";

function headersToRecord(headers: Headers): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  headers.forEach((value, key) => {
    if (result[key]) {
      result[key].push(value);
    } else {
      result[key] = [value];
    }
  });
  return result;
}

/**
 * Kiota middleware that intercepts non-2xx Zoho API responses and throws
 * a ZohoApiError with the actual error details from the response body.
 *
 * Placed first in the middleware array so it runs AFTER RetryHandler/RedirectHandler
 * in the response flow, meaning retries for 429/503/504 still happen transparently.
 */
export class ZohoErrorMiddleware implements Middleware {
  next: Middleware | undefined;

  async execute(
    url: string,
    requestInit: RequestInit,
    requestOptions?: Record<string, RequestOption>,
  ): Promise<Response> {
    if (!this.next) {
      throw new Error("ZohoErrorMiddleware: next middleware is not set");
    }

    const response = await this.next.execute(url, requestInit, requestOptions);

    // Let successful and redirect responses pass through
    if (response.ok || (response.status >= 300 && response.status < 400)) {
      return response;
    }

    const responseHeaders = headersToRecord(response.headers);

    // Read the error response body
    const cloned = response.clone();
    let bodyText: string;
    try {
      bodyText = await cloned.text();
    } catch {
      throw new ZohoApiError({
        message: `Zoho API error: HTTP ${response.status} (empty response body)`,
        statusCode: response.status,
        responseHeaders,
        requestUrl: url,
      });
    }

    // Handle empty body
    if (!bodyText) {
      throw new ZohoApiError({
        message: `Zoho API error: HTTP ${response.status} (empty response body)`,
        statusCode: response.status,
        responseHeaders,
        requestUrl: url,
      });
    }

    // Try to parse as JSON for structured error details
    let parsed: Record<string, unknown> | undefined;
    try {
      parsed = JSON.parse(bodyText) as Record<string, unknown>;
    } catch {
      // Not JSON — throw with raw body text for diagnostics
      throw new ZohoApiError({
        message: `Zoho API error: HTTP ${response.status} (non-JSON response)`,
        statusCode: response.status,
        rawBody: bodyText,
        responseHeaders,
        requestUrl: url,
      });
    }

    // Extract Zoho-specific error fields
    const errorCode = typeof parsed.errorCode === "string" ? parsed.errorCode : undefined;
    const message =
      (typeof parsed.message === "string" ? parsed.message : undefined) ??
      (typeof parsed.errorMessage === "string" ? parsed.errorMessage : undefined) ??
      (typeof parsed.error === "string" ? parsed.error : undefined);

    if (message) {
      throw new ZohoApiError({
        message: `Zoho API error ${response.status}: [${errorCode ?? "UNKNOWN"}] ${message}`,
        statusCode: response.status,
        errorCode,
        responseBody: parsed,
        rawBody: bodyText,
        responseHeaders,
        requestUrl: url,
      });
    }

    throw new ZohoApiError({
      message: `Zoho API error: HTTP ${response.status}`,
      statusCode: response.status,
      responseBody: parsed,
      rawBody: bodyText,
      responseHeaders,
      requestUrl: url,
    });
  }
}
