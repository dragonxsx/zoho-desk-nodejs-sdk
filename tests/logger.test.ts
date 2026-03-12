import { describe, it, expect } from "vitest";
import { Logger, Levels } from "../src/logger/logger.js";
import { LogBuilder } from "../src/logger/log-builder.js";

describe("Logger", () => {
  it("creates logger with level and filePath", () => {
    const logger = Logger.getInstance(Levels.INFO, "./test.log");
    expect(logger.getLevel()).toBe(Levels.INFO);
    expect(logger.getFilePath()).toBe("./test.log");
  });

  it("builder creates logger with defaults", () => {
    const logger = new LogBuilder().build();
    expect(logger.getLevel()).toBe(Levels.OFF);
    expect(logger.getFilePath()).toBe("");
  });

  it("builder configures level and path", () => {
    const logger = new LogBuilder()
      .level(Levels.DEBUG)
      .filePath("./debug.log")
      .build();
    expect(logger.getLevel()).toBe(Levels.DEBUG);
    expect(logger.getFilePath()).toBe("./debug.log");
  });
});
