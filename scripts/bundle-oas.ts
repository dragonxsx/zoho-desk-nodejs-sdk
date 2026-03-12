/**
 * Bundles each OAS file with paths into a self-contained spec by resolving external $ref values.
 *
 * Usage: npx tsx scripts/bundle-oas.ts <input-dir> <output-dir>
 * Example: npx tsx scripts/bundle-oas.ts ../zohodesk-oas/v1.0 bundled-oas
 */

import fs from "node:fs";
import path from "node:path";
import {
  type OpenAPIDoc,
  COMPONENT_TYPES,
  type ComponentType,
  HTTP_METHODS,
  normalizePathKey,
  buildParamNameMapping,
  remapParameterNames,
  stripFormatFromUnionTypes,
} from "./oas-utils.js";

interface BundleManifest {
  generatedAt: string;
  specs: Array<{
    filename: string;
    moduleName: string;
    clientClassName: string;
    pathCount: number;
    schemaCount: number;
  }>;
}

/** All loaded OAS documents keyed by base filename (without .json) */
type DocRegistry = Map<string, OpenAPIDoc>;

/**
 * Load all JSON files from the input directory into a registry.
 */
function loadDocRegistry(inputDir: string): DocRegistry {
  const registry: DocRegistry = new Map();
  const files = fs.readdirSync(inputDir).filter((f) => f.endsWith(".json")).sort();
  for (const file of files) {
    const filePath = path.join(inputDir, file);
    try {
      const doc: OpenAPIDoc = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      const baseName = path.basename(file, ".json");
      registry.set(baseName, doc);
    } catch (err) {
      console.error(`Failed to parse ${file}: ${err}`);
    }
  }
  return registry;
}

/**
 * Convert a filename (without extension) to a camelCase module name.
 * Examples: "Ticket" → "ticket", "IMCannedMessage" → "iMCannedMessage", "SLA" → "sLA"
 * We lowercase the first character for the module directory name.
 */
function toModuleName(baseName: string): string {
  return baseName.charAt(0).toLowerCase() + baseName.slice(1);
}

/**
 * Convert a filename (without extension) to a PascalCase client class name.
 * Example: "Ticket" → "TicketApiClient"
 */
function toClientClassName(baseName: string): string {
  return `${baseName}ApiClient`;
}

/**
 * Recursively resolve all external $ref values in an object, inlining referenced components.
 *
 * @param obj The object to resolve refs in
 * @param currentFile Base name of the file being processed (without .json)
 * @param registry All loaded OAS documents
 * @param targetDoc The bundled document being built (components are inlined here)
 * @param visited Set of "file#component_type/name" strings to detect cycles
 */
function resolveRefs(
  obj: unknown,
  currentFile: string,
  registry: DocRegistry,
  targetDoc: OpenAPIDoc,
  visited: Set<string>,
): unknown {
  if (obj === null || obj === undefined) return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => resolveRefs(item, currentFile, registry, targetDoc, visited));
  }

  if (typeof obj !== "object") return obj;

  const record = obj as Record<string, unknown>;
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(record)) {
    if (key === "$ref" && typeof value === "string") {
      result[key] = resolveRef(value, currentFile, registry, targetDoc, visited);
    } else if (
      key === "mapping" &&
      "propertyName" in record &&
      typeof value === "object" &&
      value !== null
    ) {
      // Rewrite discriminator mapping values
      const mappingResult: Record<string, unknown> = {};
      for (const [mapKey, mapValue] of Object.entries(value as Record<string, unknown>)) {
        if (typeof mapValue === "string" && (mapValue.startsWith("#/components/") || mapValue.startsWith("./"))) {
          mappingResult[mapKey] = resolveRef(mapValue, currentFile, registry, targetDoc, visited);
        } else {
          mappingResult[mapKey] = mapValue;
        }
      }
      result[key] = mappingResult;
    } else {
      result[key] = resolveRefs(value, currentFile, registry, targetDoc, visited);
    }
  }

  return result;
}

/**
 * Resolve a single $ref string. If it's an external ref, inline the referenced component
 * into the target document and return a local $ref. If it's an internal ref and we're
 * processing a foreign file's component, also ensure the referenced component is inlined.
 */
function resolveRef(
  ref: string,
  currentFile: string,
  registry: DocRegistry,
  targetDoc: OpenAPIDoc,
  visited: Set<string>,
): string {
  // External ref: ./SomeFile.json#/components/<type>/<name>
  const externalMatch = ref.match(/^\.\/([^#]+)\.json#\/components\/(\w+)\/(.+)$/);
  if (externalMatch) {
    const [, refFile, componentType, componentName] = externalMatch;
    const compType = componentType as ComponentType;

    // Self-reference: just rewrite to local ref
    if (refFile === currentFile) {
      // Still ensure the component is inlined if we're inside a foreign file's component
      ensureComponentInlined(currentFile, compType, componentName, registry, targetDoc, visited);
      return `#/components/${componentType}/${componentName}`;
    }

    // Inline the referenced component from the source file
    inlineComponent(refFile, compType, componentName, registry, targetDoc, visited);
    return `#/components/${componentType}/${componentName}`;
  }

  // Internal ref: #/components/<type>/<name>
  // When processing a component from a foreign file, local refs point to that file's components.
  // We need to ensure those are also inlined into the target document.
  const internalMatch = ref.match(/^#\/components\/(\w+)\/(.+)$/);
  if (internalMatch) {
    const [, componentType, componentName] = internalMatch;
    const compType = componentType as ComponentType;
    ensureComponentInlined(currentFile, compType, componentName, registry, targetDoc, visited);
    return ref;
  }

  return ref;
}

/**
 * Ensure a component from a source file is present in the target document.
 * If the component is not yet in the target, inline it.
 */
function ensureComponentInlined(
  sourceFile: string,
  componentType: ComponentType,
  componentName: string,
  registry: DocRegistry,
  targetDoc: OpenAPIDoc,
  visited: Set<string>,
): void {
  const targetSection = targetDoc.components?.[componentType] as
    | Record<string, unknown>
    | undefined;
  if (targetSection && componentName in targetSection) return; // Already present

  // Check if the source file has this component
  const sourceDoc = registry.get(sourceFile);
  if (!sourceDoc) return;
  const sourceSection = sourceDoc.components?.[componentType] as
    | Record<string, unknown>
    | undefined;
  if (!sourceSection || !(componentName in sourceSection)) return;

  inlineComponent(sourceFile, componentType, componentName, registry, targetDoc, visited);
}

/**
 * Inline a component from a source file into the target document.
 * Recursively resolves any refs within the inlined component.
 */
function inlineComponent(
  sourceFile: string,
  componentType: ComponentType,
  componentName: string,
  registry: DocRegistry,
  targetDoc: OpenAPIDoc,
  visited: Set<string>,
): void {
  const visitKey = `${sourceFile}#${componentType}/${componentName}`;
  if (visited.has(visitKey)) return; // Cycle detected, skip
  visited.add(visitKey);

  const sourceDoc = registry.get(sourceFile);
  if (!sourceDoc) {
    console.warn(`WARNING: Referenced file "${sourceFile}.json" not found in registry`);
    return;
  }

  const sourceSection = sourceDoc.components?.[componentType] as
    | Record<string, unknown>
    | undefined;
  if (!sourceSection || !(componentName in sourceSection)) {
    console.warn(
      `WARNING: Component "${componentName}" not found in ${sourceFile}.json components.${componentType}`,
    );
    return;
  }

  // Ensure target section exists
  if (!targetDoc.components) targetDoc.components = {};
  if (!targetDoc.components[componentType]) {
    (targetDoc.components as Record<string, Record<string, unknown>>)[componentType] = {};
  }
  const targetSection = targetDoc.components[componentType] as Record<string, unknown>;

  // Skip if already inlined
  if (componentName in targetSection) return;

  // Deep clone and recursively resolve refs within the component
  const componentValue = JSON.parse(JSON.stringify(sourceSection[componentName]));
  const resolved = resolveRefs(componentValue, sourceFile, registry, targetDoc, visited);
  targetSection[componentName] = resolved;
}

/**
 * Apply intra-file path normalization to handle duplicate path signatures
 * with different parameter names within a single file.
 */
function normalizeIntraFilePaths(doc: OpenAPIDoc): void {
  if (!doc.paths) return;

  const pathCanonicalMap = new Map<string, string>();
  const originalPaths = { ...doc.paths };
  doc.paths = {};

  for (const [pathKey, pathValue] of Object.entries(originalPaths)) {
    const normalized = normalizePathKey(pathKey);
    const canonical = pathCanonicalMap.get(normalized);

    if (canonical && canonical !== pathKey) {
      // Duplicate path signature — merge HTTP methods into canonical entry
      const paramMapping = buildParamNameMapping(pathKey, canonical);
      const remapped = remapParameterNames(pathValue, paramMapping);
      const existing = doc.paths[canonical] as Record<string, unknown>;
      const incoming = remapped as Record<string, unknown>;

      for (const [method, value] of Object.entries(incoming)) {
        if (!HTTP_METHODS.has(method)) continue;
        if (!existing[method]) {
          existing[method] = value;
        }
      }
    } else {
      doc.paths[pathKey] = pathValue;
      pathCanonicalMap.set(normalized, pathKey);
    }
  }
}

/**
 * Bundle a single OAS file into a self-contained spec.
 */
function bundleSpec(
  baseName: string,
  doc: OpenAPIDoc,
  registry: DocRegistry,
): OpenAPIDoc {
  // Deep clone the document
  const bundled: OpenAPIDoc = JSON.parse(JSON.stringify(doc));
  const visited = new Set<string>();

  // Resolve all external refs in paths
  if (bundled.paths) {
    for (const [pathKey, pathValue] of Object.entries(bundled.paths)) {
      bundled.paths[pathKey] = resolveRefs(pathValue, baseName, registry, bundled, visited);
    }
  }

  // Resolve all external refs in components
  if (bundled.components) {
    for (const compType of COMPONENT_TYPES) {
      const section = bundled.components[compType] as Record<string, unknown> | undefined;
      if (!section) continue;
      for (const [name, value] of Object.entries(section)) {
        section[name] = resolveRefs(value, baseName, registry, bundled, visited);
      }
    }
  }

  // Ensure securitySchemes.iam-oauth2-schema is present
  const commonDoc = registry.get("Common");
  if (commonDoc?.components?.securitySchemes?.["iam-oauth2-schema"]) {
    if (!bundled.components) bundled.components = {};
    if (!bundled.components.securitySchemes) bundled.components.securitySchemes = {};
    if (!bundled.components.securitySchemes["iam-oauth2-schema"]) {
      bundled.components.securitySchemes["iam-oauth2-schema"] = JSON.parse(
        JSON.stringify(commonDoc.components.securitySchemes["iam-oauth2-schema"]),
      );
    }
  }

  // Ensure security field is present
  if (!bundled.security) {
    bundled.security = [{ "iam-oauth2-schema": [] }];
  }

  // Ensure servers field is present
  if (!bundled.servers || bundled.servers.length === 0) {
    bundled.servers = [{ url: "https://desk.zoho.com" }];
  }

  // Apply intra-file path normalization
  normalizeIntraFilePaths(bundled);

  // Apply stripFormatFromUnionTypes post-processing
  return stripFormatFromUnionTypes(bundled) as OpenAPIDoc;
}

/**
 * Check if a document has any paths (not just components).
 */
function hasApiPaths(doc: OpenAPIDoc): boolean {
  return !!doc.paths && Object.keys(doc.paths).length > 0;
}

/**
 * Main bundling function.
 */
export function bundleOAS(inputDir: string, outputDir: string): BundleManifest {
  console.log(`Loading OAS files from ${inputDir}...`);
  const registry = loadDocRegistry(inputDir);
  console.log(`Loaded ${registry.size} OAS files`);

  // Create output directory
  fs.mkdirSync(outputDir, { recursive: true });

  const manifest: BundleManifest = {
    generatedAt: new Date().toISOString(),
    specs: [],
  };

  let skipped = 0;

  for (const [baseName, doc] of registry) {
    if (!hasApiPaths(doc)) {
      console.log(`  Skipping ${baseName}.json (no paths)`);
      skipped++;
      continue;
    }

    console.log(`  Bundling ${baseName}.json...`);
    const bundled = bundleSpec(baseName, doc, registry);

    const outputFile = path.join(outputDir, `${baseName}.json`);
    fs.writeFileSync(outputFile, JSON.stringify(bundled, null, 2), "utf-8");

    const moduleName = toModuleName(baseName);
    const clientClassName = toClientClassName(baseName);
    const pathCount = Object.keys(bundled.paths || {}).length;
    const schemaCount = Object.keys(bundled.components?.schemas || {}).length;

    manifest.specs.push({
      filename: `${baseName}.json`,
      moduleName,
      clientClassName,
      pathCount,
      schemaCount,
    });
  }

  // Write manifest
  const manifestPath = path.join(outputDir, "manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");

  console.log(`\nBundling complete:`);
  console.log(`  Bundled specs: ${manifest.specs.length}`);
  console.log(`  Skipped (no paths): ${skipped}`);
  console.log(`  Manifest: ${manifestPath}`);

  return manifest;
}

// Main
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error("Usage: npx tsx scripts/bundle-oas.ts <input-dir> <output-dir>");
  process.exit(1);
}

bundleOAS(args[0], args[1]);
