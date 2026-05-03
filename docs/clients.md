## Documentation Index

Fetch the complete documentation index at: `docs/llms.txt`
Use this file to discover all available RepoSentinel pages before exploring further.

# MCP Clients

> Local stdio and Streamable HTTP installation examples for RepoSentinel MCP clients.

RepoSentinel supports local stdio and Streamable HTTP connections. HTTP deployments can be protected with `REPOSENTINEL_API_KEY` and client headers. RepoSentinel does not expose an OAuth flow, auto-push tool, auto-merge tool, or unrestricted shell execution.

> **Tip**: Build once before using the stable `start` command:
>
> ```sh
> pnpm install
> pnpm build
> ```

> **Note**: Replace `/absolute/path/to/reposentinel-mcp` with your local checkout path. On Windows, use a path like `C:\\Users\\Admin\\Desktop\\skills\\reposentinel`.

## Server Command

Use this command for most local MCP clients after `pnpm build`:

```sh
pnpm --dir /absolute/path/to/reposentinel-mcp --filter @reposentinel/mcp-server start
```

For development, use the TypeScript entrypoint:

```sh
pnpm --dir /absolute/path/to/reposentinel-mcp --filter @reposentinel/mcp-server dev
```

Run the Streamable HTTP server:

```sh
REPOSENTINEL_TRANSPORT=http REPOSENTINEL_API_KEY=YOUR_API_KEY pnpm --dir /absolute/path/to/reposentinel-mcp --filter @reposentinel/mcp-server start:http
```

The default HTTP endpoint is:

```text
http://127.0.0.1:3000/mcp
```

## OpenAI Codex

Add this to your Codex configuration file, either `~/.codex/config.toml` or a project-local `.codex/config.toml`.

```toml
[mcp_servers.reposentinel]
command = "pnpm"
args = [
  "--dir",
  "/absolute/path/to/reposentinel-mcp",
  "--filter",
  "@reposentinel/mcp-server",
  "start"
]
startup_timeout_sec = 20
```

Windows example:

```toml
[mcp_servers.reposentinel]
command = "pnpm"
args = [
  "--dir",
  "C:\\Users\\Admin\\Desktop\\skills\\reposentinel",
  "--filter",
  "@reposentinel/mcp-server",
  "start"
]
startup_timeout_sec = 40
```

Remote HTTP connection:

```toml
[mcp_servers.reposentinel]
url = "https://your-reposentinel-host.example.com/mcp"
http_headers = { "Authorization" = "Bearer YOUR_API_KEY" }
```

## Claude Code

Run this command:

```sh
claude mcp add --scope user reposentinel -- pnpm --dir /absolute/path/to/reposentinel-mcp --filter @reposentinel/mcp-server start
```

Project-local setup:

```sh
claude mcp add --scope project reposentinel -- pnpm --dir /absolute/path/to/reposentinel-mcp --filter @reposentinel/mcp-server start
```

## Cursor

Add this to your Cursor MCP config. Use `~/.cursor/mcp.json` for global setup or `.cursor/mcp.json` inside a project.

```json
{
  "mcpServers": {
    "reposentinel": {
      "command": "pnpm",
      "args": [
        "--dir",
        "/absolute/path/to/reposentinel-mcp",
        "--filter",
        "@reposentinel/mcp-server",
        "start"
      ]
    }
  }
}
```

Remote HTTP connection:

```json
{
  "mcpServers": {
    "reposentinel": {
      "url": "https://your-reposentinel-host.example.com/mcp",
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
    "reposentinel": {
      "type": "stdio",
      "command": "pnpm",
      "args": [
        "--dir",
        "/absolute/path/to/reposentinel-mcp",
        "--filter",
        "@reposentinel/mcp-server",
        "start"
      ]
    }
  }
}
```

Remote HTTP connection:

```json
{
  "servers": {
    "reposentinel": {
      "type": "http",
      "url": "https://your-reposentinel-host.example.com/mcp",
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
    "reposentinel": {
      "command": "pnpm",
      "args": [
        "--dir",
        "/absolute/path/to/reposentinel-mcp",
        "--filter",
        "@reposentinel/mcp-server",
        "start"
      ]
    }
  }
}
```

## Gemini CLI

Open `~/.gemini/settings.json` and add:

```json
{
  "mcpServers": {
    "reposentinel": {
      "command": "pnpm",
      "args": [
        "--dir",
        "/absolute/path/to/reposentinel-mcp",
        "--filter",
        "@reposentinel/mcp-server",
        "start"
      ]
    }
  }
}
```

## Cline, Roo Code, Windsurf, Kilo Code

Use this stdio configuration shape for clients that accept `mcpServers`:

```json
{
  "mcpServers": {
    "reposentinel": {
      "command": "pnpm",
      "args": [
        "--dir",
        "/absolute/path/to/reposentinel-mcp",
        "--filter",
        "@reposentinel/mcp-server",
        "start"
      ],
      "disabled": false
    }
  }
}
```

## MCP Inspector

Use MCP Inspector to verify the server locally:

```sh
npx @modelcontextprotocol/inspector pnpm --dir /absolute/path/to/reposentinel-mcp --filter @reposentinel/mcp-server start
```

For HTTP:

```sh
REPOSENTINEL_API_KEY=YOUR_API_KEY pnpm --dir /absolute/path/to/reposentinel-mcp --filter @reposentinel/mcp-server start:http
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

After connecting RepoSentinel, ask the agent:

```text
Use RepoSentinel MCP on this local project. First call detect_project, then route_skills. Follow workflowPhases, recommendedToolSequence, skillActivationOrder, and qualityGates before making any changes.
```

## Current Transport Support

| Transport       | Status          | Notes                                                                |
| --------------- | --------------- | -------------------------------------------------------------------- |
| Local stdio     | Supported       | Recommended for current use.                                         |
| Streamable HTTP | Supported       | Use `/mcp`; protect hosted deployments with `REPOSENTINEL_API_KEY`.  |
| OAuth           | Not implemented | Use API-key/Bearer auth until an identity provider is added.         |
| API key headers | Supported       | Use `Authorization: Bearer`, `X-API-Key`, or `RepoSentinel-API-Key`. |

## Troubleshooting

If the client reports a startup timeout:

1. Run `pnpm install`.
2. Run `pnpm build`.
3. Run the server command manually in a terminal.
4. Increase the client startup timeout to `40` seconds.
5. Confirm the path in `--dir` points to the RepoSentinel checkout, not the target project being audited.

If tools are visible but return path errors, pass an absolute `projectPath` inside the target project you want RepoSentinel to inspect.
