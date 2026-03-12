import { DataCenter } from "./data-center.js";
import { Environment } from "./environment.js";

export class CADataCenter extends DataCenter {
  private static _PRODUCTION: Environment | null = null;
  private static readonly CA = new CADataCenter();

  static PRODUCTION(): Environment {
    if (!this._PRODUCTION) {
      this._PRODUCTION = DataCenter.setEnvironment(
        "https://desk.zoho.ca",
        this.CA.getIAMUrl(),
      );
    }
    return this._PRODUCTION;
  }

  getIAMUrl(): string {
    return "https://accounts.zoho.ca/oauth/v2/token";
  }
}
