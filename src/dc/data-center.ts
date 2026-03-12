import { Environment } from "./environment.js";

export abstract class DataCenter {
  abstract getIAMUrl(): string;

  static setEnvironment(url: string, accountsUrl: string): Environment {
    return new Environment(url, accountsUrl);
  }
}
