export enum Levels {
  INFO = "info",
  DEBUG = "debug",
  WARN = "warn",
  VERBOSE = "verbose",
  ERROR = "error",
  SILLY = "silly",
  OFF = "off",
}

export class Logger {
  private readonly _level: Levels;
  private readonly _filePath: string;

  private constructor(level: Levels, filePath: string) {
    this._level = level;
    this._filePath = filePath;
  }

  static getInstance(level: Levels, filePath: string): Logger {
    return new Logger(level, filePath);
  }

  getLevel(): Levels {
    return this._level;
  }

  getFilePath(): string {
    return this._filePath;
  }
}
