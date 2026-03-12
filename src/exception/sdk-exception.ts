/**
 * Custom exception class for SDK errors.
 */
export class SDKException extends Error {
  public readonly code: string;
  public readonly details: Record<string, unknown> | null;
  public readonly cause: Error | null;

  constructor(
    code: string,
    message: string,
    details: Record<string, unknown> | null = null,
    cause: Error | null = null,
  ) {
    let fullMessage = message;
    if (details) {
      fullMessage += "\n" + JSON.stringify(details);
    }
    if (cause) {
      fullMessage += "\nCaused by: " + cause.toString();
    }

    super(fullMessage);
    this.name = "SDKException";
    this.code = code;
    this.details = details;
    this.cause = cause;
  }

  override toString(): string {
    return `Caused By : [${this.code}] - ${this.message}`;
  }
}
