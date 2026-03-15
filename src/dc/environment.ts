export class Environment {
  private readonly _url: string;
  private readonly _accountsUrl: string;

  constructor(url: string, accountsUrl: string) {
    this._url = url;
    this._accountsUrl = accountsUrl;
  }

  getUrl(): string {
    return this._url;
  }

  getAccountsUrl(): string {
    return this._accountsUrl;
  }

  getAuthorizationUrl(): string {
    return this._accountsUrl.replace(/\/token$/, "/auth");
  }

  getDeviceCodeUrl(): string {
    return this._accountsUrl.replace(/\/token$/, "/device/code");
  }
}
