import { describe, it, expect } from "vitest";
import { SDKException } from "../src/exception/sdk-exception.js";

describe("SDKException", () => {
  it("should create exception with code and message", () => {
    const ex = new SDKException("TEST_ERROR", "Something went wrong");
    expect(ex.code).toBe("TEST_ERROR");
    expect(ex.message).toBe("Something went wrong");
    expect(ex.details).toBeNull();
    expect(ex.cause).toBeNull();
    expect(ex.name).toBe("SDKException");
  });

  it("should include details in message", () => {
    const details = { field: "value" };
    const ex = new SDKException("ERR", "msg", details);
    expect(ex.details).toEqual(details);
    expect(ex.message).toContain(JSON.stringify(details));
  });

  it("should include cause in message", () => {
    const cause = new Error("root cause");
    const ex = new SDKException("ERR", "msg", null, cause);
    expect(ex.cause).toBe(cause);
    expect(ex.message).toContain("root cause");
  });

  it("toString includes code and message", () => {
    const ex = new SDKException("CODE", "test message");
    expect(ex.toString()).toContain("[CODE]");
    expect(ex.toString()).toContain("test message");
  });
});
