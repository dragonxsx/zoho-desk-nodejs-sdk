import { describe, it, expect, beforeEach } from "vitest";
import type { Middleware } from "@microsoft/kiota-http-fetchlibrary";
import type { RequestOption } from "@microsoft/kiota-abstractions";
import { ZohoErrorMiddleware } from "../src/http/zoho-error-middleware.js";
import { ZohoApiError } from "../src/exception/zoho-api-error.js";

/** Stub middleware that returns a fixed Response. */
class StubMiddleware implements Middleware {
  next: Middleware | undefined;
  constructor(private response: Response) {}
  execute(
    _url: string,
    _requestInit: RequestInit,
    _requestOptions?: Record<string, RequestOption>,
  ): Promise<Response> {
    return Promise.resolve(this.response);
  }
}

describe("ZohoErrorMiddleware", () => {
  let middleware: ZohoErrorMiddleware;

  beforeEach(() => {
    middleware = new ZohoErrorMiddleware();
  });

  it("returns successful responses unchanged", async () => {
    const response = new Response(JSON.stringify({ data: "ok" }), { status: 200 });
    middleware.next = new StubMiddleware(response);

    const result = await middleware.execute("https://desk.zoho.com/api/v1/tickets", {});
    expect(result).toBe(response);
    expect(result.status).toBe(200);
  });

  it("returns 3xx responses unchanged", async () => {
    const response = new Response(null, { status: 301, headers: { Location: "/new" } });
    middleware.next = new StubMiddleware(response);

    const result = await middleware.execute("https://desk.zoho.com/api/v1/tickets", {});
    expect(result).toBe(response);
    expect(result.status).toBe(301);
  });

  it("throws ZohoApiError for JSON error responses with correct fields", async () => {
    const errorBody = {
      errorCode: "INTERNAL_SERVER_ERROR",
      message: "Something went wrong on the server",
    };
    const response = new Response(JSON.stringify(errorBody), {
      status: 500,
      statusText: "Internal Server Error",
    });
    middleware.next = new StubMiddleware(response);

    try {
      await middleware.execute("https://desk.zoho.com/api/v1/tickets", {});
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(ZohoApiError);
      const apiErr = err as ZohoApiError;
      expect(apiErr.responseStatusCode).toBe(500);
      expect(apiErr.errorCode).toBe("INTERNAL_SERVER_ERROR");
      expect(apiErr.message).toContain("Something went wrong on the server");
      expect(apiErr.responseBody).toEqual(errorBody);
    }
  });

  it("throws ZohoApiError with rawBody for non-JSON error responses", async () => {
    const response = new Response("Bad Gateway", {
      status: 502,
      statusText: "Bad Gateway",
    });
    middleware.next = new StubMiddleware(response);

    try {
      await middleware.execute("https://desk.zoho.com/api/v1/tickets", {});
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(ZohoApiError);
      const apiErr = err as ZohoApiError;
      expect(apiErr.responseStatusCode).toBe(502);
      expect(apiErr.errorCode).toBeUndefined();
      expect(apiErr.message).toBe("Zoho API error: HTTP 502 (non-JSON response)");
      expect(apiErr.responseBody).toBeUndefined();
      expect(apiErr.rawBody).toBe("Bad Gateway");
    }
  });

  it("throws with '(empty response body)' when body is empty", async () => {
    const response = new Response("", { status: 500 });
    middleware.next = new StubMiddleware(response);

    try {
      await middleware.execute("https://desk.zoho.com/api/v1/tickets", {});
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(ZohoApiError);
      const apiErr = err as ZohoApiError;
      expect(apiErr.responseStatusCode).toBe(500);
      expect(apiErr.message).toBe("Zoho API error: HTTP 500 (empty response body)");
      expect(apiErr.rawBody).toBeUndefined();
    }
  });

  it("does not include trailing space when statusText is empty (HTTP/2)", async () => {
    const response = new Response(JSON.stringify({ errorCode: "LIMIT_EXCEEDED", message: "Rate limit" }), {
      status: 429,
    });
    middleware.next = new StubMiddleware(response);

    try {
      await middleware.execute("https://desk.zoho.com/api/v1/tickets", {});
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(ZohoApiError);
      const apiErr = err as ZohoApiError;
      expect(apiErr.message).toBe("Zoho API error 429: [LIMIT_EXCEEDED] Rate limit");
      expect(apiErr.message).not.toMatch(/\s$/);
    }
  });

  it("sets responseBody and rawBody for JSON without errorCode/message", async () => {
    const body = { status: "error", detail: "unknown failure" };
    const response = new Response(JSON.stringify(body), { status: 500 });
    middleware.next = new StubMiddleware(response);

    try {
      await middleware.execute("https://desk.zoho.com/api/v1/tickets", {});
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(ZohoApiError);
      const apiErr = err as ZohoApiError;
      expect(apiErr.responseStatusCode).toBe(500);
      expect(apiErr.message).toBe("Zoho API error: HTTP 500");
      expect(apiErr.errorCode).toBeUndefined();
      expect(apiErr.responseBody).toEqual(body);
      expect(apiErr.rawBody).toBe(JSON.stringify(body));
    }
  });

  it("captures response headers on the error", async () => {
    const response = new Response(JSON.stringify({ errorCode: "INVALID", message: "bad" }), {
      status: 400,
      headers: { "X-Request-Id": "abc-123", "Content-Type": "application/json" },
    });
    middleware.next = new StubMiddleware(response);

    try {
      await middleware.execute("https://desk.zoho.com/api/v1/tickets", {});
      expect.fail("should have thrown");
    } catch (err) {
      const apiErr = err as ZohoApiError;
      expect(apiErr.responseHeaders).toBeDefined();
      // Fetch Headers normalizes keys to lowercase
      expect(apiErr.responseHeaders!["x-request-id"]).toEqual(["abc-123"]);
      expect(apiErr.responseHeaders!["content-type"]).toEqual(["application/json"]);
    }
  });

  it("captures the request URL on the error", async () => {
    const response = new Response(JSON.stringify({ errorCode: "NOT_FOUND", message: "missing" }), {
      status: 404,
    });
    middleware.next = new StubMiddleware(response);

    try {
      await middleware.execute("https://desk.zoho.com/api/v1/tickets/999", {});
      expect.fail("should have thrown");
    } catch (err) {
      const apiErr = err as ZohoApiError;
      expect(apiErr.requestUrl).toBe("https://desk.zoho.com/api/v1/tickets/999");
    }
  });

  it("falls back to errorMessage when message is absent", async () => {
    const body = { errorCode: "MASS_ERROR", errorMessage: "Bulk operation failed" };
    const response = new Response(JSON.stringify(body), { status: 400 });
    middleware.next = new StubMiddleware(response);

    try {
      await middleware.execute("https://desk.zoho.com/api/v1/tickets", {});
      expect.fail("should have thrown");
    } catch (err) {
      const apiErr = err as ZohoApiError;
      expect(apiErr.message).toContain("Bulk operation failed");
      expect(apiErr.errorCode).toBe("MASS_ERROR");
    }
  });

  it("falls back to error string when both message and errorMessage are absent", async () => {
    const body = { error: "Access denied" };
    const response = new Response(JSON.stringify(body), { status: 403 });
    middleware.next = new StubMiddleware(response);

    try {
      await middleware.execute("https://desk.zoho.com/api/v1/tickets", {});
      expect.fail("should have thrown");
    } catch (err) {
      const apiErr = err as ZohoApiError;
      expect(apiErr.message).toContain("Access denied");
    }
  });

  it("includes headers and URL for non-JSON error responses", async () => {
    const response = new Response("Service Unavailable", {
      status: 503,
      headers: { "Retry-After": "30" },
    });
    middleware.next = new StubMiddleware(response);

    try {
      await middleware.execute("https://desk.zoho.com/api/v1/tickets", {});
      expect.fail("should have thrown");
    } catch (err) {
      const apiErr = err as ZohoApiError;
      expect(apiErr.requestUrl).toBe("https://desk.zoho.com/api/v1/tickets");
      expect(apiErr.responseHeaders!["retry-after"]).toEqual(["30"]);
      expect(apiErr.rawBody).toBe("Service Unavailable");
    }
  });

  it("message takes priority over errorMessage when both are present", async () => {
    const body = { errorCode: "ERR", message: "Primary message", errorMessage: "Secondary message" };
    const response = new Response(JSON.stringify(body), { status: 422 });
    middleware.next = new StubMiddleware(response);

    try {
      await middleware.execute("https://desk.zoho.com/api/v1/tickets", {});
      expect.fail("should have thrown");
    } catch (err) {
      const apiErr = err as ZohoApiError;
      expect(apiErr.message).toContain("Primary message");
      expect(apiErr.message).not.toContain("Secondary message");
    }
  });

  it("thrown error is instanceof Error and has .stack", async () => {
    const response = new Response(JSON.stringify({ errorCode: "BAD_REQUEST", message: "Invalid" }), {
      status: 400,
    });
    middleware.next = new StubMiddleware(response);

    try {
      await middleware.execute("https://desk.zoho.com/api/v1/tickets", {});
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(Error);
      expect((err as Error).stack).toBeDefined();
      expect((err as ZohoApiError).name).toBe("ZohoApiError");
    }
  });
});
