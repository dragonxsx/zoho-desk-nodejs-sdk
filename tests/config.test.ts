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

  it("has sensible retry defaults", () => {
    const config = new SDKConfigBuilder().build();
    expect(config.getMaxRetries()).toBe(3);
    expect(config.getRetryDelay()).toBe(3);
  });

  it("respects retry builder values", () => {
    const config = new SDKConfigBuilder()
      .maxRetries(5)
      .retryDelay(10)
      .build();

    expect(config.getMaxRetries()).toBe(5);
    expect(config.getRetryDelay()).toBe(10);
  });

  it("clamps maxRetries to 0–10", () => {
    expect(new SDKConfigBuilder().maxRetries(-1).build().getMaxRetries()).toBe(0);
    expect(new SDKConfigBuilder().maxRetries(15).build().getMaxRetries()).toBe(10);
  });

  it("clamps retryDelay to 0–180", () => {
    expect(new SDKConfigBuilder().retryDelay(-5).build().getRetryDelay()).toBe(0);
    expect(new SDKConfigBuilder().retryDelay(300).build().getRetryDelay()).toBe(180);
  });
});
