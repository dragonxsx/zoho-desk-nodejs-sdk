import { describe, it, expect } from "vitest";
import { ProxyBuilder } from "../src/proxy/proxy-builder.js";
import { SDKException } from "../src/exception/sdk-exception.js";

describe("ProxyBuilder", () => {
  it("builds proxy with required fields", () => {
    const proxy = new ProxyBuilder().host("proxy.example.com").port(8080).build();
    expect(proxy.getHost()).toBe("proxy.example.com");
    expect(proxy.getPort()).toBe(8080);
    expect(proxy.getUser()).toBeNull();
    expect(proxy.getPassword()).toBeNull();
  });

  it("builds proxy with auth", () => {
    const proxy = new ProxyBuilder()
      .host("proxy.example.com")
      .port(8080)
      .user("admin")
      .password("secret")
      .build();
    expect(proxy.getUser()).toBe("admin");
    expect(proxy.getPassword()).toBe("secret");
  });

  it("throws if host missing", () => {
    expect(() => new ProxyBuilder().port(8080).build()).toThrow(SDKException);
  });

  it("throws if port missing", () => {
    expect(() => new ProxyBuilder().host("h").build()).toThrow(SDKException);
  });
});
