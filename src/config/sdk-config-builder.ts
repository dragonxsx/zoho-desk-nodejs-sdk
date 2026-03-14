import { SDKConfig } from "./sdk-config.js";

export class SDKConfigBuilder {
  private _autoRefreshFields = false;
  private _pickListValidation = true;
  private _timeout = 0;
  private _maxRetries = 3;
  private _retryDelay = 3;

  autoRefreshFields(autoRefreshFields: boolean): this {
    this._autoRefreshFields = autoRefreshFields;
    return this;
  }

  pickListValidation(pickListValidation: boolean): this {
    this._pickListValidation = pickListValidation;
    return this;
  }

  timeout(timeout: number): this {
    this._timeout = timeout < 0 ? 0 : timeout;
    return this;
  }

  maxRetries(maxRetries: number): this {
    this._maxRetries = Math.max(0, Math.min(10, maxRetries));
    return this;
  }

  retryDelay(retryDelay: number): this {
    this._retryDelay = Math.max(0, Math.min(180, retryDelay));
    return this;
  }

  build(): SDKConfig {
    return new SDKConfig(
      this._autoRefreshFields,
      this._pickListValidation,
      this._timeout,
      this._maxRetries,
      this._retryDelay,
    );
  }
}
