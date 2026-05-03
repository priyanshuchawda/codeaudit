## Documentation Index

Fetch the complete documentation index at: `docs/llms.txt`
Use this file to discover all available RepoSentinel pages before exploring further.

# MCP Clients

> Local stdio installation examples for RepoSentinel MCP clients.

RepoSentinel currently supports local MCP connections over stdio. It does not expose a hosted remote HTTP endpoint, OAuth flow, auto-push tool, auto-merge tool, or unrestricted shell execution.

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

| Transport       | Status          | Notes                                                               |
| --------------- | --------------- | ------------------------------------------------------------------- |
| Local stdio     | Supported       | Recommended for current use.                                        |
| Remote HTTP     | Not implemented | Do not configure a remote URL until the server adds HTTP transport. |
| OAuth           | Not implemented | Only relevant after remote HTTP support exists.                     |
| API key headers | Not required    | Current server is local and read-only.                              |

## Troubleshooting

If the client reports a startup timeout:

1. Run `pnpm install`.
2. Run `pnpm build`.
3. Run the server command manually in a terminal.
4. Increase the client startup timeout to `40` seconds.
5. Confirm the path in `--dir` points to the RepoSentinel checkout, not the target project being audited.

If tools are visible but return path errors, pass an absolute `projectPath` inside the target project you want RepoSentinel to inspect.
