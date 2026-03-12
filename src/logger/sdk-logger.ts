import winston from "winston";
import { Logger, Levels } from "./logger.js";

let sdkLogger: winston.Logger | null = null;

export function initializeLogger(logger: Logger): void {
  if (logger.getLevel() === Levels.OFF || !logger.getFilePath()) {
    sdkLogger = winston.createLogger({ silent: true });
    return;
  }

  sdkLogger = winston.createLogger({
    level: logger.getLevel(),
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.prettyPrint(),
    ),
    transports: [
      new winston.transports.File({ filename: logger.getFilePath() }),
    ],
  });
}

export function getLogger(): winston.Logger {
  if (!sdkLogger) {
    sdkLogger = winston.createLogger({ silent: true });
  }
  return sdkLogger;
}
