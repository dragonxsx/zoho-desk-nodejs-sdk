import {
  FetchRequestAdapter,
  HttpClient,
} from "@microsoft/kiota-http-fetchlibrary";
import type { AuthenticationProvider } from "@microsoft/kiota-abstractions";
import type { RequestProxy } from "../proxy/request-proxy.js";
import { ProxyAgent } from "undici";

/**
 * Creates a Kiota FetchRequestAdapter wired with Zoho auth and optional proxy.
 */
export function createRequestAdapter(
  authProvider: AuthenticationProvider,
  baseUrl: string,
  proxy?: RequestProxy | null,
): FetchRequestAdapter {
  let httpClient: HttpClient;

  if (proxy) {
    const proxyUrl = buildProxyUrl(proxy);
    const proxyAgent = new ProxyAgent(proxyUrl);

    const customFetch = (request: string, init: RequestInit): Promise<Response> => {
      return fetch(request, {
        ...init,
        // Node.js undici dispatcher for proxy support
        dispatcher: proxyAgent,
      } as RequestInit);
    };

    httpClient = new HttpClient(customFetch);
  } else {
    httpClient = new HttpClient();
  }

  const adapter = new FetchRequestAdapter(authProvider, undefined, undefined, httpClient);
  adapter.baseUrl = baseUrl;
  return adapter;
}

function buildProxyUrl(proxy: RequestProxy): string {
  const user = proxy.getUser();
  const password = proxy.getPassword();
  const host = proxy.getHost();
  const port = proxy.getPort();

  if (user && password) {
    return `http://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}`;
  }
  return `http://${host}:${port}`;
}
