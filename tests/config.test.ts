import { describe, it, expect } from "vitest";
import { SDKConfig } from "../src/config/sdk-config.js";
import { SDKConfigBuilder } from "../src/config/sdk-config-builder.js";

describe("SDKConfig", () => {
  it("has sensible defaults from builder", () => {
    const config = new SDKConfigBuilder().build();
    expect(config.getAutoRefreshFields()).toBe(false);
    expect(config.getPickListValidation()).toBe(true);
    expect(config.getTimeout()).toBe(0);
  });

  it("respects builder values", () => {
    const config = new SDKConfigBuilder()
      .autoRefreshFields(true)
      .pickListValidation(false)
      .timeout(5000)
      .build();

    expect(config.getAutoRefreshFields()).toBe(true);
    expect(config.getPickListValidation()).toBe(false);
    expect(config.getTimeout()).toBe(5000);
  });

  it("clamps negative timeout to 0", () => {
    const config = new SDKConfigBuilder().timeout(-100).build();
    expect(config.getTimeout()).toBe(0);
  });
});
