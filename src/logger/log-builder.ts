import { Logger, Levels } from "./logger.js";

export class LogBuilder {
  private _level: Levels = Levels.OFF;
  private _filePath: string = "";

  level(level: Levels): this {
    this._level = level;
    return this;
  }

  filePath(filePath: string): this {
    this._filePath = filePath;
    return this;
  }

  build(): Logger {
    return Logger.getInstance(this._level, this._filePath);
  }
}
