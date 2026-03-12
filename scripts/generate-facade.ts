/**
 * Generates a unified facade class (ZohoDeskClient) that wraps all per-module Kiota clients.
 *
 * Usage: npx tsx scripts/generate-facade.ts
 *
 * Scans src/generated/&#42;/&#42;ApiClient.ts files and generates src/client/zoho-desk-client.ts
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_DIR = path.resolve(__dirname, "..");
const GENERATED_DIR = path.join(PROJECT_DIR, "src", "generated");
const CLIENT_DIR = path.join(PROJECT_DIR, "src", "client");
const OUTPUT_FILE = path.join(CLIENT_DIR, "zoho-desk-client.ts");

interface ModuleInfo {
  moduleName: string;
  /** PascalCase interface name, e.g. "AccountApiClient" */
  interfaceName: string;
  /** Factory function name, e.g. "createAccountApiClient" */
  factoryName: string;
  /** Import path relative to src/client/ */
  importPath: string;
}

function discoverModules(): ModuleInfo[] {
  const modules: ModuleInfo[] = [];

  if (!fs.existsSync(GENERATED_DIR)) {
    console.error(`Error: ${GENERATED_DIR} does not exist`);
    process.exit(1);
  }

  const dirs = fs.readdirSync(GENERATED_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  for (const dir of dirs) {
    const dirPath = path.join(GENERATED_DIR, dir);
    const files = fs.readdirSync(dirPath);

    // Look for *ApiClient.ts
    const clientFile = files.find((f) => f.endsWith("ApiClient.ts"));
    if (!clientFile) continue;

    // Read the file to find the actual exported interface name and factory function
    const content = fs.readFileSync(path.join(dirPath, clientFile), "utf-8");

    // Find interface name: "export interface XxxApiClient"
    const interfaceMatch = content.match(/export interface (\w+ApiClient)\b/);
    if (!interfaceMatch) continue;
    const interfaceName = interfaceMatch[1];

    // Find factory function: "export function createXxxApiClient"
    const factoryMatch = content.match(/export function (create\w+ApiClient)\b/);
    if (!factoryMatch) continue;
    const factoryName = factoryMatch[1];

    const importFile = clientFile.replace(/\.ts$/, ".js");

    modules.push({
      moduleName: dir,
      interfaceName,
      factoryName,
      importPath: `../generated/${dir}/${importFile}`,
    });
  }

  return modules;
}

function generateFacade(modules: ModuleInfo[]): string {
  const lines: string[] = [];

  lines.push("/**");
  lines.push(" * Auto-generated facade wrapping all per-module Kiota API clients.");
  lines.push(" * DO NOT EDIT — regenerate with: npx tsx scripts/generate-facade.ts");
  lines.push(" */");
  lines.push("");
  lines.push('import type { RequestAdapter } from "@microsoft/kiota-abstractions";');
  lines.push("");

  // Import each client interface and factory function
  for (const mod of modules) {
    lines.push(`import { type ${mod.interfaceName}, ${mod.factoryName} } from "${mod.importPath}";`);
  }

  lines.push("");
  lines.push("export class ZohoDeskClient {");
  lines.push("  private readonly adapter: RequestAdapter;");
  lines.push("");

  // Private cached instances
  for (const mod of modules) {
    lines.push(`  private _${mod.moduleName}?: ${mod.interfaceName};`);
  }

  lines.push("");
  lines.push("  constructor(adapter: RequestAdapter) {");
  lines.push("    this.adapter = adapter;");
  lines.push("  }");
  lines.push("");

  // Lazy getters using factory functions
  for (const mod of modules) {
    lines.push(`  get ${mod.moduleName}(): ${mod.interfaceName} {`);
    lines.push(`    if (!this._${mod.moduleName}) {`);
    lines.push(`      this._${mod.moduleName} = ${mod.factoryName}(this.adapter);`);
    lines.push("    }");
    lines.push(`    return this._${mod.moduleName};`);
    lines.push("  }");
    lines.push("");
  }

  lines.push("}");
  lines.push("");

  return lines.join("\n");
}

function main(): void {
  console.log("Discovering generated modules...");
  const modules = discoverModules();

  if (modules.length === 0) {
    console.error("No API client modules found in src/generated/");
    process.exit(1);
  }

  console.log(`Found ${modules.length} modules`);

  const facade = generateFacade(modules);

  fs.mkdirSync(CLIENT_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, facade, "utf-8");

  console.log(`Generated facade: ${OUTPUT_FILE}`);
  console.log(`Modules:`);
  for (const mod of modules) {
    console.log(`  - ${mod.moduleName} (${mod.interfaceName})`);
  }
}

main();
