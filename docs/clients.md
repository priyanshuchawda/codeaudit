## Documentation Index

Fetch the complete documentation index at: `docs/llms.txt`
Use this file to discover all available CodeAudit pages before exploring further.

# MCP Clients

> Local stdio and Streamable HTTP installation examples for CodeAudit MCP clients.

CodeAudit supports local stdio and Streamable HTTP connections. The recommended setup is the public npm package `@priyanshuchawda/codeaudit`, which users can run without cloning the GitHub repository. HTTP deployments can be protected with `CODEAUDIT_API_KEY` and client headers. CodeAudit does not expose an OAuth flow, auto-push tool, auto-merge tool, or unrestricted shell execution.

> **Free npm package**: Use `npx -y @priyanshuchawda/codeaudit` for local stdio setup.

> **Tip**: The `pnpm` commands are only needed for local checkout development:
>
> ```sh
> pnpm install
> pnpm build
> ```

> **Note**: Replace `/absolute/path/to/codeaudit` with your local checkout path. On Windows, use a path like `C:\\Users\\Admin\\Desktop\\skills\\codeaudit`.

## Server Command

Use this command for most local MCP clients:

```sh
npx -y @priyanshuchawda/codeaudit
```

For local checkout development after `pnpm build`:

```sh
pnpm --dir /absolute/path/to/codeaudit --filter @priyanshuchawda/codeaudit start
```

For development, use the TypeScript entrypoint:

```sh
pnpm --dir /absolute/path/to/codeaudit --filter @priyanshuchawda/codeaudit dev
```

Run the Streamable HTTP server:

```sh
CODEAUDIT_TRANSPORT=http CODEAUDIT_API_KEY=YOUR_API_KEY CODEAUDIT_ALLOWED_ROOTS=/absolute/path/to/target-project pnpm --dir /absolute/path/to/codeaudit --filter @priyanshuchawda/codeaudit start:http
```

Or from npm:

```sh
CODEAUDIT_API_KEY=YOUR_API_KEY CODEAUDIT_ALLOWED_ROOTS=/absolute/path/to/target-project npx -y @priyanshuchawda/codeaudit --transport http
```

The default HTTP endpoint is:

```text
http://127.0.0.1:3000/mcp
```

For production deployment details, Docker, environment variables, and verification, see `docs/deployment.md`.

## OpenAI Codex

Add this to your Codex configuration file, either `~/.codex/config.toml` or a project-local `.codex/config.toml`.

Npm package:

```toml
[mcp_servers.codeaudit]
command = "npx"
args = ["-y", "@priyanshuchawda/codeaudit"]
startup_timeout_sec = 40
```

Local checkout:

```toml
[mcp_servers.codeaudit]
command = "pnpm"
args = [
  "--dir",
  "/absolute/path/to/codeaudit",
  "--filter",
  "@priyanshuchawda/codeaudit",
  "start"
]
startup_timeout_sec = 20
```

Windows example:

```toml
[mcp_servers.codeaudit]
command = "pnpm"
args = [
  "--dir",
  "C:\\Users\\Admin\\Desktop\\skills\\codeaudit",
  "--filter",
  "@priyanshuchawda/codeaudit",
  "start"
]
startup_timeout_sec = 40
```

Remote HTTP connection:

```toml
[mcp_servers.codeaudit]
url = "https://your-codeaudit-host.example.com/mcp"
http_headers = { "Authorization" = "Bearer YOUR_API_KEY" }
```

## Claude Code

Run this command:

```sh
claude mcp add --scope user codeaudit -- npx -y @priyanshuchawda/codeaudit
```

Local checkout:

```sh
claude mcp add --scope user codeaudit -- pnpm --dir /absolute/path/to/codeaudit --filter @priyanshuchawda/codeaudit start
```

Project-local setup:

```sh
claude mcp add --scope project codeaudit -- pnpm --dir /absolute/path/to/codeaudit --filter @priyanshuchawda/codeaudit start
```

## Cursor

Add this to your Cursor MCP config. Use `~/.cursor/mcp.json` for global setup or `.cursor/mcp.json` inside a project.

```json
{
  "mcpServers": {
    "codeaudit": {
      "command": "npx",
      "args": ["-y", "@priyanshuchawda/codeaudit"]
    }
  }
}
```

For local checkout development, replace the command with the `pnpm --dir ... start` shape shown above.

Remote HTTP connection:

```json
{
  "mcpServers": {
    "codeaudit": {
      "url": "https://your-codeaudit-host.example.com/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}
```

## VS Code

Add this to `.vscode/mcp.json`:

```json
{
  "servers": {
    "codeaudit": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@priyanshuchawda/codeaudit"]
    }
  }
}
```

Remote HTTP connection:

```json
{
  "servers": {
    "codeaudit": {
      "type": "http",
      "url": "https://your-codeaudit-host.example.com/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}
```

## Claude Desktop

Edit `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "codeaudit": {
      "command": "npx",
      "args": ["-y", "@priyanshuchawda/codeaudit"]
    }
  }
}
```

## Gemini CLI

Open `~/.gemini/settings.json` and add:

```json
{
  "mcpServers": {
    "codeaudit": {
      "command": "npx",
      "args": ["-y", "@priyanshuchawda/codeaudit"]
    }
  }
}
```

## Cline, Roo Code, Windsurf, Kilo Code

Use this stdio configuration shape for clients that accept `mcpServers`:

```json
{
  "mcpServers": {
    "codeaudit": {
      "command": "npx",
      "args": ["-y", "@priyanshuchawda/codeaudit"],
      "disabled": false
    }
  }
}
```

## MCP Inspector

Use MCP Inspector to verify the server locally:

```sh
npx @modelcontextprotocol/inspector npx -y @priyanshuchawda/codeaudit
```

For local checkout development:

```sh
npx @modelcontextprotocol/inspector pnpm --dir /absolute/path/to/codeaudit --filter @priyanshuchawda/codeaudit start
```

For HTTP:

```sh
CODEAUDIT_API_KEY=YOUR_API_KEY CODEAUDIT_ALLOWED_ROOTS=/absolute/path/to/target-project pnpm --dir /absolute/path/to/codeaudit --filter @priyanshuchawda/codeaudit start:http
```

Then connect Inspector to `http://127.0.0.1:3000/mcp` and pass:

```text
Authorization: Bearer YOUR_API_KEY
```

Then call:

```json
{
  "tool": "detect_project",
  "input": {
    "projectPath": "/absolute/path/to/target-project"
  }
}
```

Follow with:

```json
{
  "tool": "route_skills",
  "input": {
    "projectPath": "/absolute/path/to/target-project",
    "userTask": "Audit and improve this repo",
    "detectedProject": "<detect_project output>"
  }
}
```

## Recommended First Prompt

After connecting CodeAudit, ask the agent:

```text
Use CodeAudit MCP on this local project. First call detect_project, then route_skills. Follow workflowPhases, recommendedToolSequence, skillActivationOrder, and qualityGates before making any changes.
```

## Current Transport Support

| Transport       | Status          | Notes                                                             |
| --------------- | --------------- | ----------------------------------------------------------------- |
| Local stdio     | Supported       | Recommended for current use.                                      |
| Streamable HTTP | Supported       | Use `/mcp`; protect hosted deployments with `CODEAUDIT_API_KEY`.  |
| OAuth           | Not implemented | Use API-key/Bearer auth until an identity provider is added.      |
| API key headers | Supported       | Use `Authorization: Bearer`, `X-API-Key`, or `CodeAudit-API-Key`. |

Hosted HTTP also restricts `projectPath` to `CODEAUDIT_ALLOWED_ROOTS`. Set it to the mounted workspace or repo roots, for example `/workspace,/repos`.

## Tested Status

The current repository verifies CodeAudit with:

- `pnpm check`
- `pnpm build`
- `npm pack --dry-run` for npm package contents
- published `npx -y @priyanshuchawda/codeaudit --transport http` smoke test
- built HTTP `/health` and `/.well-known/codeaudit` smoke test
- MCP in-memory tool/resource test
- allowed-root rejection test for hosted-style project paths
- docs claims audit
- installed skill audit

## Troubleshooting

If the client reports a startup timeout:

1. Run `npx -y @priyanshuchawda/codeaudit` manually in a terminal.
2. Confirm Node.js `20` or newer is installed.
3. Clear the npm cache if `npx` downloads an old or corrupt package.
4. Increase the client startup timeout to `40` seconds.
5. If using local checkout development, run `pnpm install`, `pnpm build`, and confirm the path in `--dir` points to the CodeAudit checkout, not the target project being audited.

If tools are visible but return path errors, pass an absolute `projectPath` inside the target project you want CodeAudit to inspect.
