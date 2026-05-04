# CodeAudit MCP Server

CodeAudit is a read-only MCP server for local project inspection, skill routing, repository audits, documentation evidence checks, and issue/PR planning.

It detects and routes JavaScript/TypeScript and Python projects, including FastAPI, Django, Flask, and Python MCP SDK servers.

## Install

Run directly from npm:

```bash
npx -y @priyanshuchawda/codeaudit
```

Or with pnpm:

```bash
pnpm dlx @priyanshuchawda/codeaudit
```

Install the public CodeAudit agent skill:

```bash
npx skills add priyanshuchawda/codeaudit --skill codeaudit
```

## Codex

Add this to `~/.codex/config.toml` or `.codex/config.toml`:

```toml
[mcp_servers.codeaudit]
command = "npx"
args = ["-y", "@priyanshuchawda/codeaudit"]
startup_timeout_sec = 40
```

## HTTP

```bash
CODEAUDIT_API_KEY=change-me npx -y @priyanshuchawda/codeaudit --transport http
```

Then connect to:

```text
http://127.0.0.1:3000/mcp
```

Use:

```text
Authorization: Bearer change-me
```

## First Prompt

```text
Use CodeAudit MCP on this local project. First call detect_project, then route_skills. Follow workflowPhases, recommendedToolSequence, skillActivationOrder, and qualityGates before making any changes.
```

## Safety

CodeAudit is read-only by default. It does not expose unrestricted shell execution, auto-push, auto-merge, auto-delete, or remote repository mutation tools.
