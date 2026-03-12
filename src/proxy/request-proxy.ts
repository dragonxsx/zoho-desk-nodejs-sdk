export class RequestProxy {
  private readonly _host: string;
  private readonly _port: number;
  private readonly _user: string | null;
  private readonly _password: string | null;

  constructor(
    host: string,
    port: number,
    user: string | null = null,
    password: string | null = null,
  ) {
    this._host = host;
    this._port = port;
    this._user = user;
    this._password = password;
  }

  getHost(): string {
    return this._host;
  }

  getPort(): number {
    return this._port;
  }

  getUser(): string | null {
    return this._user;
  }

  getPassword(): string | null {
    return this._password;
  }
}
