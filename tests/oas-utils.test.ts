import { describe, it, expect } from "vitest";
import {
  normalizePathKey,
  buildParamNameMapping,
  remapParameterNames,
  stripFormatFromUnionTypes,
} from "../scripts/oas-utils.js";

describe("normalizePathKey", () => {
  it("replaces all parameter placeholders with {*}", () => {
    expect(normalizePathKey("/api/v1/items/{itemId}/entries")).toBe(
      "/api/v1/items/{*}/entries",
    );
  });

  it("handles multiple parameters", () => {
    expect(normalizePathKey("/api/{orgId}/items/{itemId}")).toBe(
      "/api/{*}/items/{*}",
    );
  });

  it("returns path unchanged if no parameters", () => {
    expect(normalizePathKey("/api/v1/items")).toBe("/api/v1/items");
  });
});

describe("buildParamNameMapping", () => {
  it("maps different parameter names positionally", () => {
    const mapping = buildParamNameMapping(
      "/api/v1/items/{caseId}/entries",
      "/api/v1/items/{itemId}/entries",
    );
    expect(mapping.get("caseId")).toBe("itemId");
    expect(mapping.size).toBe(1);
  });

  it("returns empty map if names match", () => {
    const mapping = buildParamNameMapping(
      "/api/v1/items/{itemId}",
      "/api/v1/items/{itemId}",
    );
    expect(mapping.size).toBe(0);
  });

  it("handles multiple differing parameters", () => {
    const mapping = buildParamNameMapping(
      "/api/{orgId}/items/{caseId}",
      "/api/{tenantId}/items/{ticketId}",
    );
    expect(mapping.get("orgId")).toBe("tenantId");
    expect(mapping.get("caseId")).toBe("ticketId");
  });
});

describe("remapParameterNames", () => {
  it("remaps path parameter names", () => {
    const obj = {
      parameters: [
        { name: "caseId", in: "path", schema: { type: "string" } },
        { name: "limit", in: "query", schema: { type: "integer" } },
      ],
    };
    const mapping = new Map([["caseId", "itemId"]]);
    const result = remapParameterNames(obj, mapping) as Record<string, unknown>;
    const params = (result.parameters as Array<Record<string, unknown>>);
    expect(params[0].name).toBe("itemId");
    expect(params[1].name).toBe("limit"); // query param unchanged
  });

  it("returns obj unchanged with empty mapping", () => {
    const obj = { name: "test", in: "path" };
    const result = remapParameterNames(obj, new Map());
    expect(result).toBe(obj); // same reference
  });
});

describe("stripFormatFromUnionTypes", () => {
  it("strips format from integer+string union", () => {
    const schema = {
      type: ["integer", "string"],
      format: "int64",
    };
    const result = stripFormatFromUnionTypes(schema) as Record<string, unknown>;
    expect(result.type).toEqual(["integer", "string"]);
    expect(result.format).toBeUndefined();
  });

  it("strips format from number+string union", () => {
    const schema = {
      type: ["number", "string"],
      format: "double",
    };
    const result = stripFormatFromUnionTypes(schema) as Record<string, unknown>;
    expect(result.format).toBeUndefined();
  });

  it("preserves format on non-union types", () => {
    const schema = {
      type: "integer",
      format: "int64",
    };
    const result = stripFormatFromUnionTypes(schema) as Record<string, unknown>;
    expect(result.format).toBe("int64");
  });

  it("preserves format on string-only type", () => {
    const schema = {
      type: "string",
      format: "date-time",
    };
    const result = stripFormatFromUnionTypes(schema) as Record<string, unknown>;
    expect(result.format).toBe("date-time");
  });

  it("recurses into nested objects", () => {
    const obj = {
      properties: {
        field: {
          type: ["integer", "string"],
          format: "int64",
        },
      },
    };
    const result = stripFormatFromUnionTypes(obj) as Record<string, Record<string, Record<string, unknown>>>;
    expect(result.properties.field.format).toBeUndefined();
  });

  it("handles null and undefined", () => {
    expect(stripFormatFromUnionTypes(null)).toBeNull();
    expect(stripFormatFromUnionTypes(undefined)).toBeUndefined();
  });
});
