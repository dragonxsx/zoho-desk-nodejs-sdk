export class SDKConfig {
  private readonly _autoRefreshFields: boolean;
  private readonly _pickListValidation: boolean;
  private readonly _timeout: number;

  constructor(
    autoRefreshFields: boolean,
    pickListValidation: boolean,
    timeout: number,
  ) {
    this._autoRefreshFields = autoRefreshFields;
    this._pickListValidation = pickListValidation;
    this._timeout = timeout;
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
}
