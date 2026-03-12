import { DataCenter } from "./data-center.js";
import { Environment } from "./environment.js";

export class USDataCenter extends DataCenter {
  private static _PRODUCTION: Environment | null = null;
  private static readonly US = new USDataCenter();

  static PRODUCTION(): Environment {
    if (!this._PRODUCTION) {
      this._PRODUCTION = DataCenter.setEnvironment(
        "https://desk.zoho.com",
        this.US.getIAMUrl(),
      );
    }
    return this._PRODUCTION;
  }

  getIAMUrl(): string {
    return "https://accounts.zoho.com/oauth/v2/token";
  }
}
