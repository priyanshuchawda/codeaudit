# Architecture

CodeAudit is split into a TypeScript MCP server and a reusable skills pack.

## Components

- `apps/mcp-server/src/server.ts` starts the selected runtime transport.
- `apps/mcp-server/src/mcp-server.ts` creates the MCP server and registers read-only tools.
- `apps/mcp-server/src/http-server.ts` exposes Streamable HTTP, health, metadata, CORS, and API-key enforcement.
- `apps/mcp-server/src/runtime-config.ts` parses CLI and environment runtime configuration.
- `apps/mcp-server/src/tools/` contains one module per tool.
- `apps/mcp-server/src/schemas/` contains zod input, output, and finding contracts.
- `apps/mcp-server/src/lib/` contains safe filesystem, detection, redaction, markdown, and command-runner utilities.
- `apps/mcp-server/src/policies/` stores YAML policy data used as project standards.
- `skills/` stores agent-facing workflows that can be recommended by `route_skills`.

## Design Choices

- Tool handlers are plain TypeScript functions so tests can call them without an MCP client.
- The MCP layer validates inputs and outputs with zod.
- Tool responses include both text JSON and structured content.
- The MVP returns generated reports as strings rather than writing into target projects.
- The server is read-only by default and exposes no unrestricted shell tool.
- The same tool registry is used for stdio and Streamable HTTP transports.
- HTTP deployments can require API-key/Bearer authentication with `CODEAUDIT_API_KEY`.

## Data Flow

1. Client calls `detect_project`.
2. Client calls `route_skills` with the user task and detection output.
3. Client runs scan/audit tools relevant to the routing manifest.
4. Client generates issue, PR, and report artifacts.
5. The agent decides whether to edit the target project outside this server, following the returned guardrails.
