import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, test } from "vitest";
import { createRepoSentinelServer } from "../../apps/mcp-server/src/mcp-server.js";

describe("mcp server", () => {
  test("exposes tools and RepoSentinel resources", async () => {
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const server = createRepoSentinelServer();
    const client = new Client({ name: "reposentinel-test", version: "0.0.0" });

    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
    try {
      const tools = await client.listTools();
      expect(tools.tools.map((tool) => tool.name)).toEqual(
        expect.arrayContaining(["detect_project", "route_skills", "audit_installed_skills"]),
      );

      const resources = await client.listResources();
      expect(resources.resources.map((resource) => resource.uri)).toEqual(
        expect.arrayContaining(["reposentinel://docs/llms", "reposentinel://skills/index"]),
      );

      const docs = await client.readResource({ uri: "reposentinel://docs/llms" });
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
});
