import { describe, expect, test } from "vitest";
import { officialDocsRouterTool } from "../../apps/mcp-server/src/tools/official-docs-router.js";

describe("official_docs_router", () => {
  test("routes Python MCP questions to Python MCP SDK docs", async () => {
    const result = await officialDocsRouterTool({
      technology: "Python MCP",
      topic: "FastMCP streamable HTTP tools",
    });

    expect(result.preferredDocsSource).toContain("Official Python MCP SDK");
    expect(result.queryGuidance.join(" ")).toContain("FastMCP");
  });

  test("routes Python framework questions to official framework docs", async () => {
    const result = await officialDocsRouterTool({
      technology: "FastAPI",
      topic: "request validation with Pydantic",
    });

    expect(result.preferredDocsSource).toContain("Official Python");
    expect(result.queryGuidance.join(" ")).toContain("FastAPI");
  });
});
