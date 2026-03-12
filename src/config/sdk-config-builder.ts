import { SDKConfig } from "./sdk-config.js";

export class SDKConfigBuilder {
  private _autoRefreshFields = false;
  private _pickListValidation = true;
  private _timeout = 0;

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

  build(): SDKConfig {
    return new SDKConfig(
      this._autoRefreshFields,
      this._pickListValidation,
      this._timeout,
    );
  }
}
