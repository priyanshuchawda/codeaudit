#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createCodeAuditServer, SERVER_VERSION } from "./mcp-server.js";
import { startHttpServer } from "./http-server.js";
import { parseRuntimeConfig } from "./runtime-config.js";

async function main(): Promise<void> {
  const config = parseRuntimeConfig();

  if (config.transport === "http") {
    await startHttpServer(config);
    return;
  }

  const server = createCodeAuditServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`CodeAudit MCP v${SERVER_VERSION} running on stdio`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : "Unknown CodeAudit startup error";
  console.error(`Fatal CodeAudit error: ${message}`);
  process.exit(1);
});
