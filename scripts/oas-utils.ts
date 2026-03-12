/**
 * Shared OpenAPI Specification utilities used by bundle-oas.ts.
 */

export interface OpenAPIDoc {
  openapi: string;
  info: { title: string; version: string };
  paths?: Record<string, unknown>;
  components?: {
    schemas?: Record<string, unknown>;
    responses?: Record<string, unknown>;
    parameters?: Record<string, unknown>;
    requestBodies?: Record<string, unknown>;
    securitySchemes?: Record<string, unknown>;
  };
  security?: unknown[];
  servers?: unknown[];
}

export const COMPONENT_TYPES = [
  "schemas",
  "responses",
  "parameters",
  "requestBodies",
  "securitySchemes",
] as const;

export type ComponentType = (typeof COMPONENT_TYPES)[number];

export const HTTP_METHODS = new Set([
  "get", "post", "put", "patch", "delete", "head", "options",
]);

/**
 * Replace all path parameter placeholders with {*} for normalization.
 * Example: /api/v1/items/{itemId}/entries → /api/v1/items/{*}/entries
 */
export function normalizePathKey(pathKey: string): string {
  return pathKey.replace(/\{[^}]+\}/g, "{*}");
}

/**
 * Extract parameter names from a path key.
 * Example: /api/v1/items/{itemId}/entries → ["itemId"]
 */
function extractPathParams(pathKey: string): string[] {
  const params: string[] = [];
  const regex = /\{([^}]+)\}/g;
  let match;
  while ((match = regex.exec(pathKey)) !== null) {
    params.push(match[1]);
  }
  return params;
}

/**
 * Build a mapping from source parameter names to canonical parameter names.
 */
export function buildParamNameMapping(
  sourcePath: string,
  canonicalPath: string,
): Map<string, string> {
  const sourceParams = extractPathParams(sourcePath);
  const canonicalParams = extractPathParams(canonicalPath);
  const mapping = new Map<string, string>();
  for (let i = 0; i < sourceParams.length && i < canonicalParams.length; i++) {
    if (sourceParams[i] !== canonicalParams[i]) {
      mapping.set(sourceParams[i], canonicalParams[i]);
    }
  }
  return mapping;
}

/**
 * Recursively remap path parameter names in an object using the given mapping.
 */
export function remapParameterNames(
  obj: unknown,
  mapping: Map<string, string>,
): unknown {
  if (mapping.size === 0) return obj;
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map((item) => remapParameterNames(item, mapping));
  }
  if (typeof obj === "object") {
    const record = obj as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(record)) {
      if (
        key === "name" &&
        typeof value === "string" &&
        record.in === "path" &&
        mapping.has(value)
      ) {
        result[key] = mapping.get(value)!;
      } else {
        result[key] = remapParameterNames(value, mapping);
      }
    }
    return result;
  }
  return obj;
}

/**
 * Recursively strip `format` from union types that combine integer/number with string.
 * These cause Kiota serialization issues.
 */
export function stripFormatFromUnionTypes(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map((item) => stripFormatFromUnionTypes(item));
  }
  if (typeof obj === "object") {
    const record = obj as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(record)) {
      result[key] = stripFormatFromUnionTypes(value);
    }
    if (Array.isArray(result.type) && typeof result.format === "string") {
      const types = result.type as string[];
      if (
        (types.includes("integer") && types.includes("string")) ||
        (types.includes("number") && types.includes("string"))
      ) {
        delete result.format;
      }
    }
    return result;
  }
  return obj;
}
