import { RequestProxy } from "./request-proxy.js";
import { SDKException } from "../exception/sdk-exception.js";

export class ProxyBuilder {
  private _host: string | null = null;
  private _port: number | null = null;
  private _user: string | null = null;
  private _password: string | null = null;

  host(host: string): this {
    this._host = host;
    return this;
  }

  port(port: number): this {
    this._port = port;
    return this;
  }

  user(user: string): this {
    this._user = user;
    return this;
  }

  password(password: string): this {
    this._password = password;
    return this;
  }

  build(): RequestProxy {
    if (!this._host) {
      throw new SDKException(
        "MANDATORY_VALUE_ERROR",
        "Proxy host is required.",
      );
    }
    if (this._port == null) {
      throw new SDKException(
        "MANDATORY_VALUE_ERROR",
        "Proxy port is required.",
      );
    }
    return new RequestProxy(this._host, this._port, this._user, this._password);
  }
}
