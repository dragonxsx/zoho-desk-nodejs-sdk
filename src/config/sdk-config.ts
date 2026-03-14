export class SDKConfig {
  private readonly _autoRefreshFields: boolean;
  private readonly _pickListValidation: boolean;
  private readonly _timeout: number;
  private readonly _maxRetries: number;
  private readonly _retryDelay: number;

  constructor(
    autoRefreshFields: boolean,
    pickListValidation: boolean,
    timeout: number,
    maxRetries: number = 3,
    retryDelay: number = 3,
  ) {
    this._autoRefreshFields = autoRefreshFields;
    this._pickListValidation = pickListValidation;
    this._timeout = timeout;
    this._maxRetries = maxRetries;
    this._retryDelay = retryDelay;
  }

  getAutoRefreshFields(): boolean {
    return this._autoRefreshFields;
  }

  getPickListValidation(): boolean {
    return this._pickListValidation;
  }

  getTimeout(): number {
    return this._timeout;
  }

  getMaxRetries(): number {
    return this._maxRetries;
  }

  getRetryDelay(): number {
    return this._retryDelay;
  }
}
