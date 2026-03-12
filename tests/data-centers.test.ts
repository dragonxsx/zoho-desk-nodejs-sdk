import { describe, it, expect } from "vitest";
import { USDataCenter } from "../src/dc/us-data-center.js";
import { EUDataCenter } from "../src/dc/eu-data-center.js";
import { INDataCenter } from "../src/dc/in-data-center.js";
import { CNDataCenter } from "../src/dc/cn-data-center.js";
import { AUDataCenter } from "../src/dc/au-data-center.js";
import { JPDataCenter } from "../src/dc/jp-data-center.js";
import { CADataCenter } from "../src/dc/ca-data-center.js";

describe("Data Centers", () => {
  it("US data center has correct URLs", () => {
    const env = USDataCenter.PRODUCTION();
    expect(env.getUrl()).toBe("https://desk.zoho.com");
    expect(env.getAccountsUrl()).toBe("https://accounts.zoho.com/oauth/v2/token");
  });

  it("EU data center has correct URLs", () => {
    const env = EUDataCenter.PRODUCTION();
    expect(env.getUrl()).toBe("https://desk.zoho.eu");
    expect(env.getAccountsUrl()).toBe("https://accounts.zoho.eu/oauth/v2/token");
  });

  it("IN data center has correct URLs", () => {
    const env = INDataCenter.PRODUCTION();
    expect(env.getUrl()).toBe("https://desk.zoho.in");
    expect(env.getAccountsUrl()).toBe("https://accounts.zoho.in/oauth/v2/token");
  });

  it("CN data center has correct URLs", () => {
    const env = CNDataCenter.PRODUCTION();
    expect(env.getUrl()).toBe("https://desk.zoho.com.cn");
    expect(env.getAccountsUrl()).toBe("https://accounts.zoho.com.cn/oauth/v2/token");
  });

  it("AU data center has correct URLs", () => {
    const env = AUDataCenter.PRODUCTION();
    expect(env.getUrl()).toBe("https://desk.zoho.com.au");
    expect(env.getAccountsUrl()).toBe("https://accounts.zoho.com.au/oauth/v2/token");
  });

  it("JP data center has correct URLs", () => {
    const env = JPDataCenter.PRODUCTION();
    expect(env.getUrl()).toBe("https://desk.zoho.jp");
    expect(env.getAccountsUrl()).toBe("https://accounts.zoho.jp/oauth/v2/token");
  });

  it("CA data center has correct URLs", () => {
    const env = CADataCenter.PRODUCTION();
    expect(env.getUrl()).toBe("https://desk.zoho.ca");
    expect(env.getAccountsUrl()).toBe("https://accounts.zoho.ca/oauth/v2/token");
  });

  it("returns cached singleton", () => {
    const env1 = USDataCenter.PRODUCTION();
    const env2 = USDataCenter.PRODUCTION();
    expect(env1).toBe(env2);
  });
});
