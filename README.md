# RepoSentinel MCP

RepoSentinel MCP is a TypeScript MCP server and skills pack for AI coding agents that need to inspect projects, route to the right engineering skills, run structured audits, map documentation claims to evidence, and prepare issue/PR plans.

The current MVP is read-only by default. It supports local stdio and Streamable HTTP transports. It does not implement unrestricted shell execution, remote repository mutation, auto-push, auto-delete, or auto-merge.

## Production Status

RepoSentinel is usable now for production-style read-only repository inspection and agent workflow routing when deployed with the documented controls:

- use `stdio` for local trusted agent clients, or Streamable HTTP behind HTTPS for remote clients
- set `REPOSENTINEL_API_KEY` for any HTTP deployment that is not strictly local
- restrict `REPOSENTINEL_ALLOWED_ORIGINS` for browser-accessible deployments
- keep the server read-only; do not add write/GitHub mutation tools without an approval model

Validated in this repository with `pnpm check`, `pnpm build`, HTTP health/metadata smoke testing, docs-claims audit, and installed-skill audit. OAuth multi-user identity is not implemented yet; use API-key/Bearer protection for hosted HTTP deployments.

## What Works

- `detect_project` identifies empty/existing projects, package manager, framework, language, tests, auth, database, deployment, CI, and risk notes.
- `route_skills` returns a skill-routing manifest with workflow phases, recommended tool sequence, skill activation order, quality gates, required outputs, strict instructions, and disallowed actions.
- `scan_repo` summarizes trees and classifies important, risk, docs, test, and config files.
- `audit_code_quality` checks maintainability signals such as long files, weak schema boundaries, missing tests, and weak error handling.
- `audit_nextjs_security` checks Next.js route, middleware, env, headers, validation, logging, redirect, SSRF, upload, rate-limit, and auth indicators.
- `audit_docs_claims` maps strong README/docs claims to evidence found or missing.
- `audit_tests` summarizes test setup and missing test areas.
- `audit_installed_skills` checks local agent skills for supply-chain, prompt-injection, secret-leakage, dependency-install, webhook, destructive-shell, manifest-quality, duplicate-name, auxiliary-doc, and resource-discovery risks.
- `official_docs_router` recommends where to look up official/current docs.
- `generate_issue_plan`, `generate_pr_plan`, and `generate_report` produce planning artifacts from findings.
- Resources expose `reposentinel://docs/llms` and `reposentinel://skills/index` for MCP-native discovery.

## Quick Start

After the first npm release, run the free public package directly:

```bash
npx -y reposentinel-mcp
```

Until the package is published, use the GitHub checkout:

```bash
pnpm install
pnpm build
```

Run local stdio:

```bash
pnpm --filter reposentinel-mcp start
```

Run local development stdio:

```bash
pnpm --filter reposentinel-mcp dev
```

Run Streamable HTTP with API-key protection:

```bash
pnpm build
REPOSENTINEL_API_KEY=change-me pnpm --filter reposentinel-mcp start:http
```

HTTP endpoints:

- MCP: `http://127.0.0.1:3000/mcp`
- health: `http://127.0.0.1:3000/health`
- metadata: `http://127.0.0.1:3000/.well-known/reposentinel-mcp`

Example MCP Inspector command:

```bash
npx @modelcontextprotocol/inspector pnpm --filter reposentinel-mcp dev
```

## Add To Codex

Npm stdio config for `~/.codex/config.toml` or project-local `.codex/config.toml`:

```toml
[mcp_servers.reposentinel]
command = "npx"
args = ["-y", "reposentinel-mcp"]
startup_timeout_sec = 40
```

Local checkout stdio config:

```toml
[mcp_servers.reposentinel]
command = "pnpm"
args = [
  "--dir",
  "/absolute/path/to/reposentinel-mcp",
  "--filter",
  "reposentinel-mcp",
  "start"
]
startup_timeout_sec = 40
```

Windows example:

```toml
[mcp_servers.reposentinel]
command = "pnpm"
args = [
  "--dir",
  "C:\\Users\\Admin\\Desktop\\skills\\reposentinel",
  "--filter",
  "reposentinel-mcp",
  "start"
]
startup_timeout_sec = 40
```

HTTP config:

```toml
[mcp_servers.reposentinel]
url = "https://your-reposentinel-host.example.com/mcp"
http_headers = { "Authorization" = "Bearer YOUR_API_KEY" }
```

Recommended first prompt after connecting:

```text
Use RepoSentinel MCP on this local project. First call detect_project, then route_skills. Follow workflowPhases, recommendedToolSequence, skillActivationOrder, and qualityGates before making any changes.
```

## Documentation

- Start with `docs/llms.txt` for the complete documentation index.
- Use `docs/clients.md` for Codex, Claude Code, Cursor, VS Code, Claude Desktop, Gemini CLI, and MCP Inspector setup examples.
- Use `docs/deployment.md` for production HTTP deployment, Docker, environment variables, and verification.
- RepoSentinel supports local stdio and Streamable HTTP MCP connections. HTTP deployments can be protected with an API key or Bearer token.

## Free Public Distribution

- Npm public package: `reposentinel-mcp`
- Npm public packages are free to publish with `npm publish --access public`.
- Release publishing is configured through `.github/workflows/publish-npm.yml`.
- To publish, add an npm automation token as the GitHub secret `NPM_TOKEN`, then create a GitHub release.
- The package name is currently available on npm, but it is not live until the first publish succeeds.

## Safety Model

- Tools are registered with read-only annotations.
- Filesystem access is bounded to the supplied project root.
- Common secret formats are redacted before output.
- Command execution is not exposed as an MCP tool.
- The internal command runner only supports a small allowlist.
- Skill files are treated as untrusted input and can be audited before use.
- External documentation is treated as untrusted reference data.
- Generated reports are returned as markdown strings; this server does not write them into target repositories.

## Skills Pack

Custom skills live in `skills/`:

- `reposentinel-orchestrator`
- `enterprise-code-quality`
- `nextjs-security-review`
- `ai-app-security-review`
- `docs-claims-evidence-review`
- `refactor-with-tests`
- `github-issue-pr-workflow`
- `official-docs-grounding`
- `skill-supply-chain-auditor`

These skills are written so clients that cannot literally activate skills can still use `route_skills` as a manifest of recommended skills, ordered workflow phases, tool sequence, outputs, and guardrails.

## Example Workflow

```json
{
  "tool": "detect_project",
  "input": {
    "projectPath": "./some-project"
  }
}
```

Then route:

```json
{
  "tool": "route_skills",
  "input": {
    "projectPath": "./some-project",
    "userTask": "Audit and improve this repo",
    "detectedProject": "<detect_project output>"
  }
}
```

For an existing project, run audits before refactors:

```text
scan_repo -> audit_code_quality -> audit_nextjs_security -> audit_docs_claims -> audit_tests -> audit_installed_skills -> generate_issue_plan -> generate_pr_plan
```

## Future Work

- More language/framework detectors.
- Deeper AST-based duplicate and complexity analysis.
- Optional report writer tool gated by explicit approval.
- Optional GitHub issue/PR creation gated by explicit approval.
- Broader security policy packs for Firebase, Azure, and AI agents.
- Optional OAuth provider integration for hosted multi-user deployments.
