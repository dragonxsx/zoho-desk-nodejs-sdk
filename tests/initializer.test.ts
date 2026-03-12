import { describe, it, expect } from "vitest";
import { Initializer } from "../src/initializer/initializer.js";
import { SDKException } from "../src/exception/sdk-exception.js";

describe("Initializer", () => {
  it("throws SDKException if SDK not initialized", () => {
    expect(() => {
      Initializer.getInitializer();
    }).toThrow(SDKException);
  });

  it("error contains helpful message", () => {
    expect(() => {
      Initializer.getInitializer();
    }).toThrow("SDK is not initialized");
  });
});
