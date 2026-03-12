import type {
  AuthenticationProvider,
  RequestInformation,
} from "@microsoft/kiota-abstractions";
import type { OAuthToken } from "./oauth-token.js";
import type { Environment } from "../dc/environment.js";

/**
 * Kiota AuthenticationProvider that sets the Zoho-oauthtoken header.
 * Zoho APIs use "Zoho-oauthtoken <token>" instead of "Bearer <token>".
 */
export class ZohoAuthenticationProvider implements AuthenticationProvider {
  private readonly token: OAuthToken;
  private readonly environment: Environment;

  constructor(token: OAuthToken, environment: Environment) {
    this.token = token;
    this.environment = environment;
  }

  async authenticateRequest(request: RequestInformation): Promise<void> {
    const accessToken = await this.token.authenticate(this.environment);
    request.headers.add("Authorization", `Zoho-oauthtoken ${accessToken}`);
  }
}
