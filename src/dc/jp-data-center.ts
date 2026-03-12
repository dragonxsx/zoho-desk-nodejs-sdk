import { DataCenter } from "./data-center.js";
import { Environment } from "./environment.js";

export class JPDataCenter extends DataCenter {
  private static _PRODUCTION: Environment | null = null;
  private static readonly JP = new JPDataCenter();

  static PRODUCTION(): Environment {
    if (!this._PRODUCTION) {
      this._PRODUCTION = DataCenter.setEnvironment(
        "https://desk.zoho.jp",
        this.JP.getIAMUrl(),
      );
    }
    return this._PRODUCTION;
  }

  getIAMUrl(): string {
    return "https://accounts.zoho.jp/oauth/v2/token";
  }
}
