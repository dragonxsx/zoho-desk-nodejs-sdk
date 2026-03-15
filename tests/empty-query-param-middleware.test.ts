import { describe, it, expect, beforeEach } from "vitest";
import type { Middleware } from "@microsoft/kiota-http-fetchlibrary";
import type { RequestOption } from "@microsoft/kiota-abstractions";
import { EmptyQueryParamMiddleware } from "../src/http/empty-query-param-middleware.js";

/** Stub middleware that captures the URL it receives and returns a fixed Response. */
class StubMiddleware implements Middleware {
  next: Middleware | undefined;
  lastUrl: string | undefined;

  execute(
    url: string,
    _requestInit: RequestInit,
    _requestOptions?: Record<string, RequestOption>,
  ): Promise<Response> {
    this.lastUrl = url;
    return Promise.resolve(new Response("ok", { status: 200 }));
  }
}

describe("EmptyQueryParamMiddleware", () => {
  let middleware: EmptyQueryParamMiddleware;
  let stub: StubMiddleware;

  beforeEach(() => {
    middleware = new EmptyQueryParamMiddleware();
    stub = new StubMiddleware();
    middleware.next = stub;
  });

  it("strips a single empty param", async () => {
    await middleware.execute("https://desk.zoho.com/api/v1/tickets?orgId=", {});
    expect(stub.lastUrl).toBe("https://desk.zoho.com/api/v1/tickets");
  });

  it("strips multiple empty params", async () => {
    await middleware.execute("https://desk.zoho.com/api/v1/tickets?orgId=&departmentId=", {});
    expect(stub.lastUrl).toBe("https://desk.zoho.com/api/v1/tickets");
  });

  it("preserves non-empty params and strips empty ones", async () => {
    await middleware.execute("https://desk.zoho.com/api/v1/tickets?orgId=&departmentId=123", {});
    expect(stub.lastUrl).toBe("https://desk.zoho.com/api/v1/tickets?departmentId=123");
  });

  it("is a no-op when there is no query string", async () => {
    await middleware.execute("https://desk.zoho.com/api/v1/tickets", {});
    expect(stub.lastUrl).toBe("https://desk.zoho.com/api/v1/tickets");
  });

  it("is a no-op when all params have values", async () => {
    await middleware.execute("https://desk.zoho.com/api/v1/tickets?orgId=123&departmentId=456", {});
    expect(stub.lastUrl).toBe("https://desk.zoho.com/api/v1/tickets?orgId=123&departmentId=456");
  });

  it("delegates to next middleware with cleaned URL", async () => {
    const result = await middleware.execute(
      "https://desk.zoho.com/api/v1/tickets?orgId=&limit=50",
      {},
    );
    expect(stub.lastUrl).toBe("https://desk.zoho.com/api/v1/tickets?limit=50");
    expect(result.status).toBe(200);
  });

  it("throws when next middleware is not set", async () => {
    const orphan = new EmptyQueryParamMiddleware();

    await expect(
      orphan.execute("https://desk.zoho.com/api/v1/tickets", {}),
    ).rejects.toThrow("EmptyQueryParamMiddleware: next middleware is not set");
  });
});
