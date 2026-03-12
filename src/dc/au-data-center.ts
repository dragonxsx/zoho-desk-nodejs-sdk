import { DataCenter } from "./data-center.js";
import { Environment } from "./environment.js";

export class AUDataCenter extends DataCenter {
  private static _PRODUCTION: Environment | null = null;
  private static readonly AU = new AUDataCenter();

  static PRODUCTION(): Environment {
    if (!this._PRODUCTION) {
      this._PRODUCTION = DataCenter.setEnvironment(
        "https://desk.zoho.com.au",
        this.AU.getIAMUrl(),
      );
    }
    return this._PRODUCTION;
  }

  getIAMUrl(): string {
    return "https://accounts.zoho.com.au/oauth/v2/token";
  }
}
