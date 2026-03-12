import { DataCenter } from "./data-center.js";
import { Environment } from "./environment.js";

export class CNDataCenter extends DataCenter {
  private static _PRODUCTION: Environment | null = null;
  private static readonly CN = new CNDataCenter();

  static PRODUCTION(): Environment {
    if (!this._PRODUCTION) {
      this._PRODUCTION = DataCenter.setEnvironment(
        "https://desk.zoho.com.cn",
        this.CN.getIAMUrl(),
      );
    }
    return this._PRODUCTION;
  }

  getIAMUrl(): string {
    return "https://accounts.zoho.com.cn/oauth/v2/token";
  }
}
