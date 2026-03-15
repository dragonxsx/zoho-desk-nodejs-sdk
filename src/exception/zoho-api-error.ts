import type { ApiError } from "@microsoft/kiota-abstractions";

/**
 * Error thrown when the Zoho Desk API returns a non-2xx response.
 * Extends Error for proper stack traces and implements Kiota's ApiError interface.
 */
export class ZohoApiError extends Error implements ApiError {
  public readonly errorCode: string | undefined;
  public readonly responseBody: Record<string, unknown> | undefined;
  public readonly rawBody: string | undefined;
  public responseStatusCode: number | undefined;
  public responseHeaders: Record<string, string[]> | undefined;
  public readonly requestUrl: string | undefined;

  constructor(options: {
    message: string;
    statusCode: number;
    errorCode?: string;
    responseBody?: Record<string, unknown>;
    rawBody?: string;
    responseHeaders?: Record<string, string[]>;
    requestUrl?: string;
  }) {
    super(options.message);
    this.name = "ZohoApiError";
    this.responseStatusCode = options.statusCode;
    this.errorCode = options.errorCode;
    this.responseBody = options.responseBody;
    this.rawBody = options.rawBody;
    this.responseHeaders = options.responseHeaders;
    this.requestUrl = options.requestUrl;
  }
}
