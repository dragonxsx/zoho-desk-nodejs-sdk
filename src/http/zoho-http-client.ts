import {
  FetchRequestAdapter,
  HttpClient,
  MiddlewareFactory,
  RetryHandler,
  RetryHandlerOptions,
} from "@microsoft/kiota-http-fetchlibrary";
import type { Middleware } from "@microsoft/kiota-http-fetchlibrary";
import type { AuthenticationProvider } from "@microsoft/kiota-abstractions";
import type { RequestProxy } from "../proxy/request-proxy.js";
import type { SDKConfig } from "../config/sdk-config.js";
import { ProxyAgent } from "undici";
import { ZohoErrorMiddleware } from "./zoho-error-middleware.js";
import { EmptyQueryParamMiddleware } from "./empty-query-param-middleware.js";

/**
 * Creates a Kiota FetchRequestAdapter wired with Zoho auth and optional proxy.
 */
export function createRequestAdapter(
  authProvider: AuthenticationProvider,
  baseUrl: string,
  proxy?: RequestProxy | null,
  sdkConfig?: SDKConfig | null,
): FetchRequestAdapter {
  let customFetch: ((request: string, init: RequestInit) => Promise<Response>) | undefined;

  if (proxy) {
    const proxyUrl = buildProxyUrl(proxy);
    const proxyAgent = new ProxyAgent(proxyUrl);

    customFetch = (request: string, init: RequestInit): Promise<Response> => {
      return fetch(request, {
        ...init,
        // Node.js undici dispatcher for proxy support
        dispatcher: proxyAgent,
      } as RequestInit);
    };
  }

  const middlewares = MiddlewareFactory.getDefaultMiddlewares(customFetch);

  // Insert error middleware first so it runs AFTER retry/redirect in the response flow
  middlewares.unshift(new ZohoErrorMiddleware());

  // Strip empty query params before anything else (fixes orgId="" → HTTP 500)
  middlewares.unshift(new EmptyQueryParamMiddleware());

  // Replace the default RetryHandler with one configured from SDKConfig
  if (sdkConfig) {
    const retryIndex = middlewares.findIndex((m) => m instanceof RetryHandler);
    if (retryIndex !== -1) {
      middlewares[retryIndex] = new RetryHandler(
        new RetryHandlerOptions({
          maxRetries: sdkConfig.getMaxRetries(),
          delay: sdkConfig.getRetryDelay(),
        }),
      );
    }
  }

  const httpClient = new HttpClient(customFetch, ...middlewares);

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
