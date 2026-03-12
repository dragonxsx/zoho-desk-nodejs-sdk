import { DataCenter } from "./data-center.js";
import { Environment } from "./environment.js";

export class INDataCenter extends DataCenter {
  private static _PRODUCTION: Environment | null = null;
  private static readonly IN = new INDataCenter();

  static PRODUCTION(): Environment {
    if (!this._PRODUCTION) {
      this._PRODUCTION = DataCenter.setEnvironment(
        "https://desk.zoho.in",
        this.IN.getIAMUrl(),
      );
    }
    return this._PRODUCTION;
  }

  getIAMUrl(): string {
    return "https://accounts.zoho.in/oauth/v2/token";
  }
}
