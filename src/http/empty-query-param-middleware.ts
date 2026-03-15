import type { Middleware } from "@microsoft/kiota-http-fetchlibrary";
import type { RequestOption } from "@microsoft/kiota-abstractions";

/**
 * Kiota middleware that strips query parameters with empty values from the URL.
 *
 * The Zoho OAS specs mark some params (e.g. orgId) as required, causing Kiota
 * to hardcode them in URI templates. When not provided, they expand to empty
 * strings (e.g. ?orgId=), which the Zoho API rejects with HTTP 500.
 */
export class EmptyQueryParamMiddleware implements Middleware {
  next: Middleware | undefined;

  async execute(
    url: string,
    requestInit: RequestInit,
    requestOptions?: Record<string, RequestOption>,
  ): Promise<Response> {
    if (!this.next) {
      throw new Error("EmptyQueryParamMiddleware: next middleware is not set");
    }

    const cleanedUrl = this.stripEmptyParams(url);
    return this.next.execute(cleanedUrl, requestInit, requestOptions);
  }

  private stripEmptyParams(urlString: string): string {
    const qIndex = urlString.indexOf("?");
    if (qIndex === -1) return urlString;

    const base = urlString.substring(0, qIndex);
    const search = urlString.substring(qIndex + 1);
    const params = new URLSearchParams(search);
    const toDelete: string[] = [];

    params.forEach((value, key) => {
      if (value === "") {
        toDelete.push(key);
      }
    });

    if (toDelete.length === 0) return urlString;

    for (const key of toDelete) {
      params.delete(key);
    }

    const remaining = params.toString();
    return remaining ? `${base}?${remaining}` : base;
  }
}
