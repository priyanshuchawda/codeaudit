# CodeAudit MCP

[![npm](https://img.shields.io/npm/v/@priyanshuchawda/codeaudit)](https://www.npmjs.com/package/@priyanshuchawda/codeaudit)
[![CI](https://github.com/priyanshuchawda/codeaudit/actions/workflows/ci.yml/badge.svg)](https://github.com/priyanshuchawda/codeaudit/actions/workflows/ci.yml)
[![MCP](https://img.shields.io/badge/MCP-server-blue)](https://modelcontextprotocol.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

CodeAudit MCP is a read-only MCP server that helps AI coding agents inspect repositories, route engineering skills, verify docs claims, audit code quality, and plan safer issue/PR workflows.

The current MVP is read-only by default. It supports local stdio and Streamable HTTP transports. It does not implement unrestricted shell execution, remote repository mutation, auto-push, auto-delete, or auto-merge.

## Production Status

CodeAudit is usable now for production-style read-only repository inspection and agent workflow routing when deployed with the documented controls:

- use `stdio` for local trusted agent clients, or Streamable HTTP behind HTTPS for remote clients
- set `CODEAUDIT_API_KEY` for any HTTP deployment that is not strictly local
- set `CODEAUDIT_ALLOWED_ROOTS` for hosted HTTP deployments so project reads stay inside approved workspaces
- restrict `CODEAUDIT_ALLOWED_ORIGINS` for browser-accessible deployments
- keep the server read-only; do not add write/GitHub mutation tools without an approval model

Validated in this repository with CI, `pnpm check`, `pnpm build`, HTTP health/metadata smoke testing, allowed-root rejection tests, docs-claims audit, and installed-skill audit. OAuth multi-user identity is not implemented yet; use API-key/Bearer protection for hosted HTTP deployments.

## What Works

- `detect_project` identifies empty/existing projects, package manager, framework, language, tests, auth, database, deployment, CI, and risk notes.
- Python detection covers `pyproject.toml`, `uv.lock`, FastAPI, Django, Flask, Python MCP SDK, pytest, typing/lint tooling, auth, database, and deployment indicators.
- `route_skills` returns a skill-routing manifest with workflow phases, recommended tool sequence, skill activation order, quality gates, required outputs, strict instructions, and disallowed actions.
- `scan_repo` summarizes trees and classifies important, risk, docs, test, and config files.
- `audit_code_quality` runs heuristic maintainability checks for long files, weak schema boundaries, missing tests, mixed responsibilities, and weak error handling.
- `audit_nextjs_security` runs heuristic checks for Next.js route, middleware, env, headers, validation, logging, redirect, SSRF, upload, rate-limit, and auth indicators.
- `audit_docs_claims` maps strong README/docs claims to evidence found or missing.
- `audit_tests` summarizes test setup and missing test areas.
- `audit_installed_skills` checks local agent skills for supply-chain, prompt-injection, secret-leakage, dependency-install, webhook, destructive-shell, manifest-quality, duplicate-name, auxiliary-doc, and resource-discovery risks.
- `official_docs_router` recommends where to look up official/current docs.
- `generate_issue_plan`, `generate_pr_plan`, and `generate_report` produce planning artifacts from findings.
- Resources expose `codeaudit://docs/llms` and `codeaudit://skills/index` for MCP-native discovery.

## Quick Start

Run the free public npm package directly:

```bash
npx -y @priyanshuchawda/codeaudit
```

For local development from the GitHub checkout:

```bash
pnpm install
pnpm build
```

Run local stdio:

```bash
pnpm --filter @priyanshuchawda/codeaudit start
```

Run local development stdio:

```bash
pnpm --filter @priyanshuchawda/codeaudit dev
```

Run Streamable HTTP with API-key protection:

```bash
pnpm build
CODEAUDIT_API_KEY=change-me pnpm --filter @priyanshuchawda/codeaudit start:http
```

HTTP endpoints:

- MCP: `http://127.0.0.1:3000/mcp`
- health: `http://127.0.0.1:3000/health`
- metadata: `http://127.0.0.1:3000/.well-known/codeaudit`

Example MCP Inspector command:

```bash
npx @modelcontextprotocol/inspector pnpm --filter @priyanshuchawda/codeaudit dev
```

## Add To Codex

Npm stdio config for `~/.codex/config.toml` or project-local `.codex/config.toml`:

```toml
[mcp_servers.codeaudit]
command = "npx"
args = ["-y", "@priyanshuchawda/codeaudit"]
startup_timeout_sec = 40
```

Local checkout stdio config:

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
startup_timeout_sec = 40
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

HTTP config:

```toml
[mcp_servers.codeaudit]
url = "https://your-codeaudit-host.example.com/mcp"
http_headers = { "Authorization" = "Bearer YOUR_API_KEY" }
```

Recommended first prompt after connecting:

```text
Use CodeAudit MCP on this local project. First call detect_project, then route_skills. Follow workflowPhases, recommendedToolSequence, skillActivationOrder, and qualityGates before making any changes.
```

## Documentation

- Start with `docs/llms.txt` for the complete documentation index.
- Use `docs/clients.md` for Codex, Claude Code, Cursor, VS Code, Claude Desktop, Gemini CLI, and MCP Inspector setup examples.
- Use `docs/deployment.md` for production HTTP deployment, Docker, environment variables, and verification.
- CodeAudit supports local stdio and Streamable HTTP MCP connections. HTTP deployments can be protected with an API key or Bearer token.

## Free Public Distribution

- Npm public package: `@priyanshuchawda/codeaudit`
- Current npm version: `0.1.4`
- Npm public packages are free to publish with `npm publish --access public`.
- Release publishing is configured through `.github/workflows/publish-npm.yml`.
- To publish, add a granular npm write token with bypass 2FA enabled as the GitHub secret `NPM_TOKEN`, then create a GitHub release.
- Users can install and run without cloning GitHub by using `npx -y @priyanshuchawda/codeaudit`.

## Skills CLI

Install the public CodeAudit skill without cloning this repository:

```bash
npx skills add priyanshuchawda/codeaudit --skill codeaudit
```

List available public skills:

```bash
npx skills add priyanshuchawda/codeaudit --list
```

The public catalog shape intentionally exposes one skill, `codeaudit`. Specialist workflows under `skills/` are marked `metadata.internal: true` so CodeAudit can keep its internal routing vocabulary without duplicating public skills on skills.sh.

## Safety Model

- Tools are registered with read-only annotations.
- Filesystem access is bounded to the supplied project root.
- Hosted HTTP deployments restrict `projectPath` to `CODEAUDIT_ALLOWED_ROOTS`; when unset in HTTP mode, the server defaults to `process.cwd()`.
- Common secret formats are redacted before output.
- Command execution is not exposed as an MCP tool.
- The internal command runner only supports a small allowlist.
- Skill files are treated as untrusted input and can be audited before use.
- External documentation is treated as untrusted reference data.
- Generated reports are returned as markdown strings; this server does not write them into target repositories.

## Skills Pack

Custom skills live in `skills/`:

- `codeaudit` public umbrella skill for `npx skills add`
- `codeaudit-orchestrator`
- `python-backend-quality`
- `python-mcp-server-quality`
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

## Example Output

When run on an existing Next.js project, CodeAudit returns detected stack and risk notes, important/risk/docs/test/config file lists, code quality findings, docs claims with evidence found or missing, a recommended issue plan, and a recommended PR plan.

```json
{
  "projectState": "existing",
  "requiredWorkflow": "repo_audit_then_issue_pr_plan",
  "recommendedSkills": ["codeaudit-orchestrator", "enterprise-code-quality", "next-best-practices"],
  "qualityGates": [
    "Existing project is scanned and audited before refactor work.",
    "Every finding includes file evidence or a clear missing-evidence note."
  ],
  "docsClaim": {
    "claim": "Production-ready and secure by default.",
    "evidenceFound": ["middleware", "test"],
    "evidenceMissing": ["threat-model", "rateLimit"],
    "recommendation": "add-evidence"
  },
  "prPlan": {
    "branchName": "refactor/p1-route-handler-validation",
    "testsToRun": ["unit tests", "typecheck"],
    "docsToUpdate": ["README.md if public behavior changed"]
  }
}
```

## What CodeAudit Is Not

- Not a replacement for Semgrep, CodeQL, or SAST.
- Not a vulnerability scanner.
- Not an autonomous GitHub mutation bot.
- Not a deep AST analyzer yet.
- Best used as a read-only planning and evidence-gathering layer for AI coding agents.

## Future Work

- More language/framework detectors.
- AST-based checks using the TypeScript compiler API or `ts-morph`.
- JSON and SARIF report formats.
- Deeper AST-based duplicate and complexity analysis.
- Optional report writer tool gated by explicit approval.
- Optional GitHub issue/PR creation gated by explicit approval.
- Broader security policy packs for Firebase, Azure, and AI agents.
- Optional OAuth provider integration for hosted multi-user deployments.
