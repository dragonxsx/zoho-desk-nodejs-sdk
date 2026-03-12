import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execSync } from "node:child_process";

function runMerge(tmpDir: string, outputFile: string): void {
  const scriptPath = path.resolve("scripts/merge-oas.ts");
  execSync(`npx tsx ${scriptPath} ${tmpDir} ${outputFile}`, {
    cwd: path.resolve("."),
    encoding: "utf-8",
  });
}

function writeOAS(dir: string, filename: string, doc: object): void {
  fs.writeFileSync(path.join(dir, filename), JSON.stringify(doc));
}

describe("merge-oas script", () => {
  let tmpDir: string;
  let outputFile: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "merge-oas-test-"));
    outputFile = path.join(tmpDir, "combined.json");

    // Create Common.json
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

    // Create Ticket.json with external refs to Common
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
                    schema: {
                      $ref: "#/components/schemas/ticketList",
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
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("merges OAS files into a single combined spec", () => {
    runMerge(tmpDir, outputFile);

    const combined = JSON.parse(fs.readFileSync(outputFile, "utf-8"));

    // Check structure
    expect(combined.openapi).toBe("3.1.0");
    expect(combined.paths["/api/v1/tickets"]).toBeDefined();

    // Common schemas should be unprefixed
    expect(combined.components.schemas.errorJson).toBeDefined();

    // Ticket schemas should be prefixed
    expect(combined.components.schemas.Ticket_ticketList).toBeDefined();
    expect(combined.components.schemas.Ticket_ticket).toBeDefined();

    // Common parameter unprefixed
    expect(combined.components.parameters.orgId).toBeDefined();

    // External $ref rewritten
    const getOp = combined.paths["/api/v1/tickets"].get;
    expect(getOp.parameters[0].$ref).toBe("#/components/parameters/orgId");

    // Internal $ref rewritten with prefix
    const responseSchema =
      getOp.responses["200"].content["application/json"].schema;
    expect(responseSchema.$ref).toBe(
      "#/components/schemas/Ticket_ticketList",
    );

    // Nested internal $ref rewritten
    expect(combined.components.schemas.Ticket_ticketList.items.$ref).toBe(
      "#/components/schemas/Ticket_ticket",
    );
  });

  // --- Fix 1: Discriminator mapping rewriting ---

  it("rewrites discriminator mapping refs with file prefix", () => {
    writeOAS(tmpDir, "Thread.json", {
      openapi: "3.1.0",
      info: { title: "Thread", version: "1.0.0" },
      paths: {
        "/api/v1/tickets/{ticketId}/sendReply": {
          post: {
            requestBody: {
              content: {
                "application/json": {
                  schema: {
                    oneOf: [
                      { $ref: "#/components/schemas/emailReply" },
                      { $ref: "#/components/schemas/fbReply" },
                    ],
                    discriminator: {
                      propertyName: "channel",
                      mapping: {
                        EMAIL: "#/components/schemas/emailReply",
                        FACEBOOK: "#/components/schemas/fbReply",
                      },
                    },
                  },
                },
              },
            },
            responses: { "200": { description: "OK" } },
          },
        },
      },
      components: {
        schemas: {
          emailReply: {
            type: "object",
            properties: { channel: { type: "string" } },
          },
          fbReply: {
            type: "object",
            properties: { channel: { type: "string" } },
          },
        },
      },
    });

    runMerge(tmpDir, outputFile);
    const combined = JSON.parse(fs.readFileSync(outputFile, "utf-8"));

    // Discriminator mapping values should be rewritten with Thread_ prefix
    const schema =
      combined.paths["/api/v1/tickets/{ticketId}/sendReply"].post.requestBody
        .content["application/json"].schema;

    expect(schema.discriminator.mapping.EMAIL).toBe(
      "#/components/schemas/Thread_emailReply",
    );
    expect(schema.discriminator.mapping.FACEBOOK).toBe(
      "#/components/schemas/Thread_fbReply",
    );

    // oneOf $refs should also be rewritten
    expect(schema.oneOf[0].$ref).toBe(
      "#/components/schemas/Thread_emailReply",
    );
    expect(schema.oneOf[1].$ref).toBe(
      "#/components/schemas/Thread_fbReply",
    );

    // Component schemas should exist with prefix
    expect(combined.components.schemas.Thread_emailReply).toBeDefined();
    expect(combined.components.schemas.Thread_fbReply).toBeDefined();
  });

  // --- Fix 2: Duplicate path normalization ---

  it("merges paths with different parameter names from different files", () => {
    writeOAS(tmpDir, "EntryA.json", {
      openapi: "3.1.0",
      info: { title: "EntryA", version: "1.0.0" },
      paths: {
        "/api/v1/items/{itemId}/entries": {
          get: {
            parameters: [
              { name: "itemId", in: "path", schema: { type: "string" } },
            ],
            responses: { "200": { description: "List entries" } },
          },
        },
      },
      components: {},
    });

    writeOAS(tmpDir, "EntryB.json", {
      openapi: "3.1.0",
      info: { title: "EntryB", version: "1.0.0" },
      paths: {
        "/api/v1/items/{caseId}/entries": {
          post: {
            parameters: [
              { name: "caseId", in: "path", schema: { type: "string" } },
            ],
            responses: { "201": { description: "Created" } },
          },
        },
      },
      components: {},
    });

    runMerge(tmpDir, outputFile);
    const combined = JSON.parse(fs.readFileSync(outputFile, "utf-8"));

    // Should have only one path (EntryA is canonical since it's alphabetically first)
    expect(combined.paths["/api/v1/items/{itemId}/entries"]).toBeDefined();
    expect(combined.paths["/api/v1/items/{caseId}/entries"]).toBeUndefined();

    // Both GET and POST should be present
    const pathItem = combined.paths["/api/v1/items/{itemId}/entries"];
    expect(pathItem.get).toBeDefined();
    expect(pathItem.post).toBeDefined();

    // POST param should be remapped from caseId to itemId
    expect(pathItem.post.parameters[0].name).toBe("itemId");
  });

  it("merges paths with different parameter names from the same file", () => {
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

    runMerge(tmpDir, outputFile);
    const combined = JSON.parse(fs.readFileSync(outputFile, "utf-8"));

    // Should have only one path (thingId is canonical since it appears first)
    expect(combined.paths["/api/v1/things/{thingId}/entries"]).toBeDefined();
    expect(combined.paths["/api/v1/things/{caseId}/entries"]).toBeUndefined();

    const pathItem = combined.paths["/api/v1/things/{thingId}/entries"];
    expect(pathItem.post).toBeDefined();
    expect(pathItem.get).toBeDefined();

    // GET param should be remapped from caseId to thingId
    expect(pathItem.get.parameters[0].name).toBe("thingId");
    // Non-path params should be unchanged
    expect(pathItem.get.parameters[1].name).toBe("limit");
  });

  // --- Fix 3: Enum collision extraction ---

  it("extracts inline enums that collide with path segment names", () => {
    writeOAS(tmpDir, "Blueprint.json", {
      openapi: "3.1.0",
      info: { title: "Blueprint", version: "1.0.0" },
      paths: {
        "/api/v1/blueprints": {
          get: {
            responses: { "200": { description: "List blueprints" } },
          },
        },
      },
      components: {},
    });

    writeOAS(tmpDir, "Feature.json", {
      openapi: "3.1.0",
      info: { title: "Feature", version: "1.0.0" },
      paths: {
        "/api/v1/features": {
          get: {
            parameters: [
              {
                name: "type",
                in: "query",
                schema: {
                  type: "string",
                  enum: ["blueprints", "workflows", "automations"],
                },
              },
            ],
            responses: { "200": { description: "List features" } },
          },
        },
      },
      components: {},
    });

    runMerge(tmpDir, outputFile);
    const combined = JSON.parse(fs.readFileSync(outputFile, "utf-8"));

    // The inline enum should be extracted to a component schema
    expect(combined.components.schemas.features_typeEnum).toBeDefined();
    expect(combined.components.schemas.features_typeEnum.enum).toEqual([
      "blueprints",
      "workflows",
      "automations",
    ]);

    // The parameter should now use a $ref
    const param = combined.paths["/api/v1/features"].get.parameters[0];
    expect(param.schema.$ref).toBe("#/components/schemas/features_typeEnum");
    expect(param.name).toBe("type");
  });

  it("does not extract enums that don't collide with path segments", () => {
    writeOAS(tmpDir, "Status.json", {
      openapi: "3.1.0",
      info: { title: "Status", version: "1.0.0" },
      paths: {
        "/api/v1/statuses": {
          get: {
            parameters: [
              {
                name: "filter",
                in: "query",
                schema: {
                  type: "string",
                  enum: ["active", "inactive", "pending"],
                },
              },
            ],
            responses: { "200": { description: "OK" } },
          },
        },
      },
      components: {},
    });

    runMerge(tmpDir, outputFile);
    const combined = JSON.parse(fs.readFileSync(outputFile, "utf-8"));

    // Enum values don't match any path segment, so should remain inline
    const param = combined.paths["/api/v1/statuses"].get.parameters[0];
    expect(param.schema.enum).toEqual(["active", "inactive", "pending"]);
    expect(param.schema.$ref).toBeUndefined();
  });

  // --- Fix 4: Strip format from union types ---

  it("strips format from integer+string union types", () => {
    writeOAS(tmpDir, "Union.json", {
      openapi: "3.1.0",
      info: { title: "Union", version: "1.0.0" },
      paths: {
        "/api/v1/unions": {
          get: {
            responses: {
              "200": {
                content: {
                  "application/json": {
                    schema: { $ref: "#/components/schemas/unionTest" },
                  },
                },
              },
            },
          },
        },
      },
      components: {
        schemas: {
          unionTest: {
            type: "object",
            properties: {
              mixedField: {
                type: ["integer", "string"],
                format: "int64",
              },
              numberField: {
                type: ["number", "string"],
                format: "double",
              },
              normalInt: {
                type: "integer",
                format: "int64",
              },
              normalString: {
                type: "string",
                format: "date-time",
              },
            },
          },
        },
      },
    });

    runMerge(tmpDir, outputFile);
    const combined = JSON.parse(fs.readFileSync(outputFile, "utf-8"));

    const props = combined.components.schemas.Union_unionTest.properties;

    // Union types should have format stripped
    expect(props.mixedField.type).toEqual(["integer", "string"]);
    expect(props.mixedField.format).toBeUndefined();

    expect(props.numberField.type).toEqual(["number", "string"]);
    expect(props.numberField.format).toBeUndefined();

    // Non-union types should keep their format
    expect(props.normalInt.format).toBe("int64");
    expect(props.normalString.format).toBe("date-time");
  });
});
