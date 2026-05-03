# RepoSentinel MCP

RepoSentinel MCP is a TypeScript MCP server and skills pack for AI coding agents that need to inspect projects, route to the right engineering skills, run structured audits, map documentation claims to evidence, and prepare issue/PR plans.

The current MVP is read-only by default. It does not implement unrestricted shell execution, remote repository mutation, auto-push, auto-delete, or auto-merge.

## What Works

- `detect_project` identifies empty/existing projects, package manager, framework, language, tests, auth, database, deployment, CI, and risk notes.
- `route_skills` returns a skill-routing manifest with recommended skills, workflow, required outputs, strict instructions, and disallowed actions.
- `scan_repo` summarizes trees and classifies important, risk, docs, test, and config files.
- `audit_code_quality` checks maintainability signals such as long files, weak schema boundaries, missing tests, and weak error handling.
- `audit_nextjs_security` checks Next.js route, middleware, env, headers, validation, logging, redirect, SSRF, upload, rate-limit, and auth indicators.
- `audit_docs_claims` maps strong README/docs claims to evidence found or missing.
- `audit_tests` summarizes test setup and missing test areas.
- `audit_installed_skills` checks local agent skills for supply-chain, prompt-injection, secret-leakage, dependency-install, webhook, destructive-shell, manifest-quality, duplicate-name, auxiliary-doc, and resource-discovery risks.
- `official_docs_router` recommends where to look up official/current docs.
- `generate_issue_plan`, `generate_pr_plan`, and `generate_report` produce planning artifacts from findings.

## Setup

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm build
```

Run the stdio server:

```bash
pnpm --filter @reposentinel/mcp-server dev
```

Example MCP Inspector command:

```bash
npx @modelcontextprotocol/inspector pnpm --filter @reposentinel/mcp-server dev
```

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

These skills are written so clients that cannot literally activate skills can still use `route_skills` as a manifest of recommended skills, workflow, outputs, and guardrails.

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
