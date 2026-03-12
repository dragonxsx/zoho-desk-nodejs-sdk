import { DataCenter } from "./data-center.js";
import { Environment } from "./environment.js";

export class EUDataCenter extends DataCenter {
  private static _PRODUCTION: Environment | null = null;
  private static readonly EU = new EUDataCenter();

  static PRODUCTION(): Environment {
    if (!this._PRODUCTION) {
      this._PRODUCTION = DataCenter.setEnvironment(
        "https://desk.zoho.eu",
        this.EU.getIAMUrl(),
      );
    }
    return this._PRODUCTION;
  }

  getIAMUrl(): string {
    return "https://accounts.zoho.eu/oauth/v2/token";
  }
}
