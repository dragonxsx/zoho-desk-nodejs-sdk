/**
 * Merges 155 separate OpenAPI 3.1.0 JSON files from zohodesk-oas into a single combined spec.
 *
 * Usage: npx tsx scripts/merge-oas.ts <input-dir> <output-file>
 * Example: npx tsx scripts/merge-oas.ts ../zohodesk-oas/v1.0 ./combined-oas.json
 */

import fs from "node:fs";
import path from "node:path";
import {
  type OpenAPIDoc,
  COMPONENT_TYPES,
  HTTP_METHODS,
  normalizePathKey,
  extractPathParams,
  buildParamNameMapping,
  remapParameterNames,
  stripFormatFromUnionTypes,
} from "./oas-utils.js";

function getFilePrefix(filename: string): string {
  return path.basename(filename, ".json");
}

/**
 * Recursively rewrite $ref values in an object.
 *
 * External refs like "./Common.json#/components/..." -> "#/components/..."
 * External refs like "./Ticket.json#/components/schemas/foo" -> "#/components/schemas/Ticket_foo"
 * Internal refs like "#/components/schemas/foo" -> "#/components/schemas/<prefix>_foo"
 */
function rewriteRefs(
  obj: unknown,
  filePrefix: string,
  isCommon: boolean,
): unknown {
  if (obj === null || obj === undefined) return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => rewriteRefs(item, filePrefix, isCommon));
  }

  if (typeof obj === "object") {
    const record = obj as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(record)) {
      if (key === "$ref" && typeof value === "string") {
        result[key] = rewriteRef(value, filePrefix, isCommon);
      } else if (
        key === "mapping" &&
        "propertyName" in record &&
        typeof value === "object" &&
        value !== null
      ) {
        // Rewrite discriminator mapping values (plain string refs)
        const mappingResult: Record<string, unknown> = {};
        for (const [mapKey, mapValue] of Object.entries(
          value as Record<string, unknown>,
        )) {
          if (
            typeof mapValue === "string" &&
            mapValue.startsWith("#/components/")
          ) {
            mappingResult[mapKey] = rewriteRef(mapValue, filePrefix, isCommon);
          } else {
            mappingResult[mapKey] = mapValue;
          }
        }
        result[key] = mappingResult;
      } else {
        result[key] = rewriteRefs(value, filePrefix, isCommon);
      }
    }
    return result;
  }

  return obj;
}

function rewriteRef(
  ref: string,
  filePrefix: string,
  isCommon: boolean,
): string {
  // External ref: ./SomeFile.json#/components/<type>/<name>
  const externalMatch = ref.match(
    /^\.\/([^#]+)\.json#\/components\/(\w+)\/(.+)$/,
  );
  if (externalMatch) {
    const [, refFile, componentType, componentName] = externalMatch;
    if (refFile === "Common") {
      // Common components are not prefixed
      return `#/components/${componentType}/${componentName}`;
    }
    // Other files get prefixed
    return `#/components/${componentType}/${refFile}_${componentName}`;
  }

  // Internal ref: #/components/<type>/<name>
  const internalMatch = ref.match(/^#\/components\/(\w+)\/(.+)$/);
  if (internalMatch && !isCommon) {
    const [, componentType, componentName] = internalMatch;
    return `#/components/${componentType}/${filePrefix}_${componentName}`;
  }

  return ref;
}

// --- Fix 2: Path normalization helpers (imported from oas-utils.ts) ---

// --- Fix 3: Enum collision post-processing ---

function postProcessCombinedOAS(combined: OpenAPIDoc): void {
  const pathSegments = new Set<string>();
  for (const pathKey of Object.keys(combined.paths!)) {
    for (const segment of pathKey.split("/")) {
      if (segment && !segment.startsWith("{")) {
        pathSegments.add(segment);
      }
    }
  }

  for (const [pathKey, pathItem] of Object.entries(combined.paths!)) {
    const pathRecord = pathItem as Record<string, unknown>;

    // Check path-level parameters
    if (Array.isArray(pathRecord.parameters)) {
      extractCollidingEnums(pathRecord.parameters, pathKey, pathSegments, combined);
    }

    // Check operation-level parameters
    for (const method of HTTP_METHODS) {
      const op = pathRecord[method] as Record<string, unknown> | undefined;
      if (!op || !Array.isArray(op.parameters)) continue;
      extractCollidingEnums(op.parameters, pathKey, pathSegments, combined);
    }
  }
}

function extractCollidingEnums(
  params: unknown[],
  pathKey: string,
  pathSegments: Set<string>,
  combined: OpenAPIDoc,
): void {
  for (let i = 0; i < params.length; i++) {
    const param = params[i] as Record<string, unknown>;
    if (param.$ref) continue;

    const schema = param.schema as Record<string, unknown> | undefined;
    if (!schema || !Array.isArray(schema.enum)) continue;

    const hasCollision = schema.enum.some(
      (v: unknown) => typeof v === "string" && pathSegments.has(v),
    );

    if (hasCollision) {
      const lastSegment =
        pathKey
          .split("/")
          .filter((s) => s && !s.startsWith("{"))
          .pop() || "unknown";
      const paramName = param.name as string;
      const schemaName = `${lastSegment}_${paramName}Enum`;

      combined.components!.schemas![schemaName] = schema;
      params[i] = {
        ...param,
        schema: { $ref: `#/components/schemas/${schemaName}` },
      };
    }
  }
}

// --- Fix 4: Strip format from union types (imported from oas-utils.ts) ---

function mergeOAS(inputDir: string, outputFile: string): void {
  const files = fs
    .readdirSync(inputDir)
    .filter((f) => f.endsWith(".json"))
    .sort();

  console.log(`Found ${files.length} OAS files in ${inputDir}`);

  const combined: OpenAPIDoc = {
    openapi: "3.1.0",
    info: {
      title: "Zoho Desk API",
      version: "1.0.0",
    },
    servers: [{ url: "https://desk.zoho.com" }],
    paths: {},
    components: {
      schemas: {},
      responses: {},
      parameters: {},
      requestBodies: {},
      securitySchemes: {},
    },
    security: [{ "iam-oauth2-schema": [] }],
  };

  // Process Common.json first
  const commonPath = path.join(inputDir, "Common.json");
  if (fs.existsSync(commonPath)) {
    const commonDoc: OpenAPIDoc = JSON.parse(
      fs.readFileSync(commonPath, "utf-8"),
    );
    console.log("Processing Common.json...");
    mergeComponents(combined, commonDoc, "Common", true);
  }

  // Track normalized path keys to their canonical path key
  const pathCanonicalMap = new Map<string, string>();

  // Process remaining files
  const otherFiles = files.filter((f) => f !== "Common.json");
  for (const file of otherFiles) {
    const filePath = path.join(inputDir, file);
    const prefix = getFilePrefix(file);

    let doc: OpenAPIDoc;
    try {
      doc = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    } catch (err) {
      console.error(`Failed to parse ${file}: ${err}`);
      continue;
    }

    console.log(`Processing ${file}...`);

    // Merge paths with normalization to handle duplicate path signatures
    if (doc.paths) {
      for (const [pathKey, pathValue] of Object.entries(doc.paths)) {
        const rewritten = rewriteRefs(pathValue, prefix, false);
        const normalized = normalizePathKey(pathKey);
        const canonical = pathCanonicalMap.get(normalized);

        if (canonical && canonical !== pathKey) {
          // Duplicate path signature — merge HTTP methods into canonical entry
          const paramMapping = buildParamNameMapping(pathKey, canonical);
          const remapped = remapParameterNames(rewritten, paramMapping);
          const existing = combined.paths![canonical] as Record<string, unknown>;
          const incoming = remapped as Record<string, unknown>;

          for (const [method, value] of Object.entries(incoming)) {
            if (!HTTP_METHODS.has(method)) continue;
            if (existing[method]) {
              console.warn(
                `WARNING: Duplicate method ${method.toUpperCase()} for normalized path ${canonical} (from ${file})`,
              );
            } else {
              existing[method] = value;
            }
          }
        } else {
          // Same path key or new path — merge or add
          if (combined.paths![pathKey]) {
            Object.assign(
              combined.paths![pathKey] as Record<string, unknown>,
              rewritten as Record<string, unknown>,
            );
          } else {
            combined.paths![pathKey] = rewritten;
          }
          pathCanonicalMap.set(normalized, pathKey);
        }
      }
    }

    // Merge components with prefix
    mergeComponents(combined, doc, prefix, false);
  }

  // Post-processing: extract colliding enums (Fix 3)
  postProcessCombinedOAS(combined);

  // Post-processing: strip format from union types (Fix 4)
  const processed = stripFormatFromUnionTypes(combined) as OpenAPIDoc;

  const output = JSON.stringify(processed, null, 2);
  fs.writeFileSync(outputFile, output, "utf-8");

  const pathCount = Object.keys(processed.paths!).length;
  const schemaCount = Object.keys(processed.components!.schemas!).length;
  console.log(
    `\nCombined OAS written to ${outputFile}`,
  );
  console.log(`  Paths: ${pathCount}`);
  console.log(`  Schemas: ${schemaCount}`);
  console.log(
    `  Responses: ${Object.keys(processed.components!.responses!).length}`,
  );
  console.log(
    `  Parameters: ${Object.keys(processed.components!.parameters!).length}`,
  );
}

function mergeComponents(
  combined: OpenAPIDoc,
  doc: OpenAPIDoc,
  prefix: string,
  isCommon: boolean,
): void {
  if (!doc.components) return;

  for (const type of COMPONENT_TYPES) {
    const section = doc.components[type];
    if (!section) continue;

    const target = combined.components![type]!;
    for (const [name, value] of Object.entries(section)) {
      const rewritten = rewriteRefs(value, prefix, isCommon);
      const key = isCommon ? name : `${prefix}_${name}`;
      (target as Record<string, unknown>)[key] = rewritten;
    }
  }
}

// Main
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error("Usage: npx tsx scripts/merge-oas.ts <input-dir> <output-file>");
  process.exit(1);
}

mergeOAS(args[0], args[1]);
