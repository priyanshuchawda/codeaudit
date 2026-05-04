import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { createCodeAuditServer } from "../../apps/mcp-server/src/mcp-server.js";

describe("mcp server", () => {
  test("exposes tools and CodeAudit resources", async () => {
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const server = createCodeAuditServer();
    const client = new Client({ name: "codeaudit-test", version: "0.0.0" });

    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
    try {
      const tools = await client.listTools();
      expect(tools.tools.map((tool) => tool.name)).toEqual(
        expect.arrayContaining(["detect_project", "route_skills", "audit_installed_skills"]),
      );

      const resources = await client.listResources();
      expect(resources.resources.map((resource) => resource.uri)).toEqual(
        expect.arrayContaining(["codeaudit://docs/llms", "codeaudit://skills/index"]),
      );

      const docs = await client.readResource({ uri: "codeaudit://docs/llms" });
      expect(docs.contents[0]).toMatchObject({
        mimeType: "text/markdown",
      });
      expect("text" in docs.contents[0] ? docs.contents[0].text : "").toContain(
        "Required Agent Workflow",
      );
    } finally {
      await client.close();
      await server.close();
    }
  });

  test("rejects tool projectPath outside configured allowed roots", async () => {
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const server = createCodeAuditServer({ allowedRoots: [process.cwd()] });
    const client = new Client({ name: "codeaudit-test", version: "0.0.0" });

    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
    try {
      const result = await client.callTool({
        name: "detect_project",
        arguments: { projectPath: path.resolve(process.cwd(), "..") },
      });

      expect(result.isError).toBe(true);
      expect(JSON.stringify(result.content)).toContain("CODEAUDIT_ALLOWED_ROOTS");
    } finally {
      await client.close();
      await server.close();
    }
  });
});
