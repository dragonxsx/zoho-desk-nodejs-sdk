import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execSync } from "node:child_process";

function runBundle(inputDir: string, outputDir: string): void {
  const scriptPath = path.resolve("scripts/bundle-oas.ts");
  execSync(`npx tsx ${scriptPath} ${inputDir} ${outputDir}`, {
    cwd: path.resolve("."),
    encoding: "utf-8",
  });
}

function writeOAS(dir: string, filename: string, doc: object): void {
  fs.writeFileSync(path.join(dir, filename), JSON.stringify(doc));
}

function readBundled(outputDir: string, filename: string): Record<string, unknown> {
  return JSON.parse(fs.readFileSync(path.join(outputDir, filename), "utf-8"));
}

describe("bundle-oas script", () => {
  let tmpDir: string;
  let outputDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "bundle-oas-test-"));
    outputDir = path.join(tmpDir, "bundled");

    // Create Common.json (component-only, no paths)
    writeOAS(tmpDir, "Common.json", {
      openapi: "3.1.0",
      info: { title: "Common", version: "1.0.0" },
      paths: {},
      components: {
        schemas: {
          errorJson: {
            type: "object",
            properties: {
              message: { type: "string" },
              errorCode: { type: "string" },
            },
          },
          errorDetailArr: {
            type: "array",
            items: { $ref: "#/components/schemas/errorJson" },
          },
        },
        parameters: {
          orgId: {
            name: "orgId",
            in: "query",
            schema: { type: "string" },
          },
        },
        securitySchemes: {
          "iam-oauth2-schema": {
            type: "oauth2",
            flows: {
              authorizationCode: {
                authorizationUrl: "/oauth/v2/auth",
                tokenUrl: "/oauth/v2/token",
                scopes: {},
              },
            },
          },
        },
      },
    });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("bundles a simple file with Common.json refs into self-contained spec", () => {
    writeOAS(tmpDir, "Ticket.json", {
      openapi: "3.1.0",
      info: { title: "Ticket", version: "1.0.0" },
      paths: {
        "/api/v1/tickets": {
          get: {
            parameters: [
              { $ref: "./Common.json#/components/parameters/orgId" },
            ],
            responses: {
              "200": {
                content: {
                  "application/json": {
                    schema: { $ref: "#/components/schemas/ticketList" },
                  },
                },
              },
              "400": {
                content: {
                  "application/json": {
                    schema: { $ref: "./Common.json#/components/schemas/errorJson" },
                  },
                },
              },
            },
          },
        },
      },
      components: {
        schemas: {
          ticketList: {
            type: "array",
            items: { $ref: "#/components/schemas/ticket" },
          },
          ticket: {
            type: "object",
            properties: {
              id: { type: "string" },
              subject: { type: "string" },
            },
          },
        },
      },
    });

    runBundle(tmpDir, outputDir);

    const bundled = readBundled(outputDir, "Ticket.json");
    const components = bundled.components as Record<string, Record<string, unknown>>;
    const paths = bundled.paths as Record<string, Record<string, unknown>>;

    // External refs should be resolved to local refs
    const getOp = paths["/api/v1/tickets"].get as Record<string, unknown>;
    const params = getOp.parameters as Array<Record<string, unknown>>;
    // The Common parameter should be inlined
    expect(params[0].$ref).toBe("#/components/parameters/orgId");
    expect(components.parameters.orgId).toBeDefined();

    // Common schema reference should be resolved and inlined
    const responses = getOp.responses as Record<string, Record<string, Record<string, Record<string, Record<string, unknown>>>>>;
    expect(responses["400"].content["application/json"].schema.$ref).toBe(
      "#/components/schemas/errorJson",
    );
    expect(components.schemas.errorJson).toBeDefined();

    // Internal refs should remain local
    expect(components.schemas.ticketList).toBeDefined();
    expect(components.schemas.ticket).toBeDefined();

    // Security scheme should be present
    expect(components.securitySchemes["iam-oauth2-schema"]).toBeDefined();
  });

  it("resolves multi-file transitive dependencies", () => {
    // MassActionResponse.json references Common.json
    writeOAS(tmpDir, "MassActionResponse.json", {
      openapi: "3.1.0",
      info: { title: "MassActionResponse", version: "1.0.0" },
      paths: {},
      components: {
        schemas: {
          massActionResult: {
            type: "object",
            properties: {
              errors: { $ref: "./Common.json#/components/schemas/errorDetailArr" },
              count: { type: "integer" },
            },
          },
        },
      },
    });

    // Ticket.json references MassActionResponse.json
    writeOAS(tmpDir, "Ticket.json", {
      openapi: "3.1.0",
      info: { title: "Ticket", version: "1.0.0" },
      paths: {
        "/api/v1/tickets/massDelete": {
          post: {
            responses: {
              "200": {
                content: {
                  "application/json": {
                    schema: {
                      $ref: "./MassActionResponse.json#/components/schemas/massActionResult",
                    },
                  },
                },
              },
            },
          },
        },
      },
      components: {
        schemas: {
          ticketIds: {
            type: "object",
            properties: { ids: { type: "array", items: { type: "string" } } },
          },
        },
      },
    });

    runBundle(tmpDir, outputDir);

    const bundled = readBundled(outputDir, "Ticket.json");
    const components = bundled.components as Record<string, Record<string, unknown>>;

    // Transitive: massActionResult from MassActionResponse should be inlined
    expect(components.schemas.massActionResult).toBeDefined();
    // Transitive: errorDetailArr from Common (referenced by massActionResult) should be inlined
    expect(components.schemas.errorDetailArr).toBeDefined();
    // Transitive: errorJson from Common (referenced by errorDetailArr) should be inlined
    expect(components.schemas.errorJson).toBeDefined();

    // The refs within inlined components should point locally
    const massAction = components.schemas.massActionResult as Record<string, Record<string, Record<string, string>>>;
    expect(massAction.properties.errors.$ref).toBe(
      "#/components/schemas/errorDetailArr",
    );
  });

  it("rewrites self-references to local refs", () => {
    writeOAS(tmpDir, "Article.json", {
      openapi: "3.1.0",
      info: { title: "Article", version: "1.0.0" },
      paths: {
        "/api/v1/articles": {
          get: {
            responses: {
              "200": {
                content: {
                  "application/json": {
                    schema: { $ref: "./Article.json#/components/schemas/articleList" },
                  },
                },
              },
            },
          },
        },
      },
      components: {
        schemas: {
          articleList: {
            type: "array",
            items: { $ref: "./Article.json#/components/schemas/article" },
          },
          article: {
            type: "object",
            properties: {
              id: { type: "string" },
              title: { type: "string" },
            },
          },
        },
      },
    });

    runBundle(tmpDir, outputDir);

    const bundled = readBundled(outputDir, "Article.json");
    const components = bundled.components as Record<string, Record<string, Record<string, unknown>>>;

    // Self-refs should be rewritten to local
    const paths = bundled.paths as Record<string, Record<string, Record<string, Record<string, Record<string, Record<string, Record<string, string>>>>>>>;
    expect(
      paths["/api/v1/articles"].get.responses["200"].content["application/json"].schema.$ref,
    ).toBe("#/components/schemas/articleList");

    // Internal self-ref should also be local
    const articleList = components.schemas.articleList as Record<string, Record<string, string>>;
    expect(articleList.items.$ref).toBe("#/components/schemas/article");
  });

  it("handles circular references without infinite loop", () => {
    // Article references ArticleTranslation, which references back to Article
    writeOAS(tmpDir, "ArticleTranslation.json", {
      openapi: "3.1.0",
      info: { title: "ArticleTranslation", version: "1.0.0" },
      paths: {},
      components: {
        schemas: {
          translation: {
            type: "object",
            properties: {
              article: { $ref: "./Article.json#/components/schemas/article" },
              language: { type: "string" },
            },
          },
        },
      },
    });

    writeOAS(tmpDir, "Article.json", {
      openapi: "3.1.0",
      info: { title: "Article", version: "1.0.0" },
      paths: {
        "/api/v1/articles": {
          get: {
            responses: {
              "200": {
                content: {
                  "application/json": {
                    schema: { $ref: "#/components/schemas/article" },
                  },
                },
              },
            },
          },
        },
      },
      components: {
        schemas: {
          article: {
            type: "object",
            properties: {
              id: { type: "string" },
              translations: {
                type: "array",
                items: {
                  $ref: "./ArticleTranslation.json#/components/schemas/translation",
                },
              },
            },
          },
        },
      },
    });

    // This should complete without hanging
    runBundle(tmpDir, outputDir);

    const bundled = readBundled(outputDir, "Article.json");
    const components = bundled.components as Record<string, Record<string, unknown>>;

    // Both schemas should be present
    expect(components.schemas.article).toBeDefined();
    expect(components.schemas.translation).toBeDefined();
  });

  it("normalizes intra-file path parameter conflicts", () => {
    writeOAS(tmpDir, "TimeEntry.json", {
      openapi: "3.1.0",
      info: { title: "TimeEntry", version: "1.0.0" },
      paths: {
        "/api/v1/things/{thingId}/entries": {
          post: {
            parameters: [
              { name: "thingId", in: "path", schema: { type: "string" } },
            ],
            responses: { "201": { description: "Created" } },
          },
        },
        "/api/v1/things/{caseId}/entries": {
          get: {
            parameters: [
              { name: "caseId", in: "path", schema: { type: "string" } },
              { name: "limit", in: "query", schema: { type: "integer" } },
            ],
            responses: { "200": { description: "List" } },
          },
        },
      },
      components: {},
    });

    runBundle(tmpDir, outputDir);

    const bundled = readBundled(outputDir, "TimeEntry.json");
    const paths = bundled.paths as Record<string, Record<string, unknown>>;

    // Should have only one path (thingId is canonical since it appears first)
    expect(paths["/api/v1/things/{thingId}/entries"]).toBeDefined();
    expect(paths["/api/v1/things/{caseId}/entries"]).toBeUndefined();

    const pathItem = paths["/api/v1/things/{thingId}/entries"] as Record<string, Record<string, Array<Record<string, unknown>>>>;
    expect(pathItem.post).toBeDefined();
    expect(pathItem.get).toBeDefined();

    // GET param should be remapped from caseId to thingId
    expect(pathItem.get.parameters[0].name).toBe("thingId");
    // Non-path params should be unchanged
    expect(pathItem.get.parameters[1].name).toBe("limit");
  });

  it("skips component-only files (no paths)", () => {
    // Common.json has no paths — should not produce output
    runBundle(tmpDir, outputDir);

    expect(fs.existsSync(path.join(outputDir, "Common.json"))).toBe(false);

    // Manifest should have 0 specs
    const manifest = JSON.parse(
      fs.readFileSync(path.join(outputDir, "manifest.json"), "utf-8"),
    );
    expect(manifest.specs).toHaveLength(0);
  });

  it("produces a manifest with correct entries", () => {
    writeOAS(tmpDir, "Badge.json", {
      openapi: "3.1.0",
      info: { title: "Badge", version: "1.0.0" },
      paths: {
        "/api/v1/badges": {
          get: { responses: { "200": { description: "OK" } } },
        },
      },
      components: {
        schemas: {
          badge: { type: "object", properties: { id: { type: "string" } } },
        },
      },
    });

    writeOAS(tmpDir, "Ticket.json", {
      openapi: "3.1.0",
      info: { title: "Ticket", version: "1.0.0" },
      paths: {
        "/api/v1/tickets": {
          get: { responses: { "200": { description: "OK" } } },
        },
      },
      components: {
        schemas: {
          ticket: { type: "object", properties: { id: { type: "string" } } },
        },
      },
    });

    runBundle(tmpDir, outputDir);

    const manifest = JSON.parse(
      fs.readFileSync(path.join(outputDir, "manifest.json"), "utf-8"),
    );

    expect(manifest.specs).toHaveLength(2);
    expect(manifest.generatedAt).toBeDefined();

    const badge = manifest.specs.find((s: { filename: string }) => s.filename === "Badge.json");
    expect(badge).toBeDefined();
    expect(badge.moduleName).toBe("badge");
    expect(badge.clientClassName).toBe("BadgeApiClient");
    expect(badge.pathCount).toBe(1);

    const ticket = manifest.specs.find((s: { filename: string }) => s.filename === "Ticket.json");
    expect(ticket).toBeDefined();
    expect(ticket.moduleName).toBe("ticket");
    expect(ticket.clientClassName).toBe("TicketApiClient");
  });

  it("strips format from union types in bundled output", () => {
    writeOAS(tmpDir, "Union.json", {
      openapi: "3.1.0",
      info: { title: "Union", version: "1.0.0" },
      paths: {
        "/api/v1/unions": {
          get: { responses: { "200": { description: "OK" } } },
        },
      },
      components: {
        schemas: {
          unionTest: {
            type: "object",
            properties: {
              mixedField: { type: ["integer", "string"], format: "int64" },
              normalInt: { type: "integer", format: "int64" },
            },
          },
        },
      },
    });

    runBundle(tmpDir, outputDir);

    const bundled = readBundled(outputDir, "Union.json");
    const schemas = (bundled.components as Record<string, Record<string, Record<string, Record<string, unknown>>>>).schemas;
    const props = schemas.unionTest.properties;

    expect((props.mixedField as Record<string, unknown>).format).toBeUndefined();
    expect((props.normalInt as Record<string, unknown>).format).toBe("int64");
  });

  it("includes security scheme and servers in bundled output", () => {
    writeOAS(tmpDir, "Simple.json", {
      openapi: "3.1.0",
      info: { title: "Simple", version: "1.0.0" },
      paths: {
        "/api/v1/simple": {
          get: { responses: { "200": { description: "OK" } } },
        },
      },
      components: {},
    });

    runBundle(tmpDir, outputDir);

    const bundled = readBundled(outputDir, "Simple.json");
    const components = bundled.components as Record<string, Record<string, unknown>>;

    expect(components.securitySchemes["iam-oauth2-schema"]).toBeDefined();
    expect(bundled.security).toEqual([{ "iam-oauth2-schema": [] }]);
    expect(bundled.servers).toBeDefined();
  });
});
