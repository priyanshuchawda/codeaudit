# MCP Tool Contracts

All tool inputs and outputs are defined with zod in `apps/mcp-server/src/schemas`.

## Tools

See `clients.md` for MCP client configuration examples.

- `detect_project(projectPath)`
- `route_skills(projectPath, userTask, detectedProject?)`
- `scan_repo(projectPath, maxDepth, includePatterns, excludePatterns)`
- `audit_code_quality(projectPath, strictness)`
- `audit_nextjs_security(projectPath, strictness)`
- `audit_docs_claims(projectPath)`
- `audit_tests(projectPath)`
- `audit_installed_skills(projectPath, skillsPath?, strictness)`
- `official_docs_router(technology, topic, version?)`
- `generate_issue_plan(findings)`
- `generate_pr_plan(selectedIssue?, findings?)`
- `generate_report(findings, projectMetadata)`

## Resources

- `codeaudit://docs/llms`: documentation index and required agent workflow.
- `codeaudit://skills/index`: built-in skill list and routing rule.

## Output Rules

- Findings include severity, category, evidence, recommendation, and confidence.
- Skill routing outputs include ordered workflow phases, tool sequence, skill activation order, and quality gates.
- File paths are project-relative.
- Secret-like values are redacted.
- Report generation returns markdown strings and does not write files.
- Skill audits inspect files only; they never execute skill instructions or install packages, and they report security, manifest-quality, duplicate-name, auxiliary-doc, and resource-discovery findings.
- The server supports stdio and Streamable HTTP. HTTP deployments may require an API key via `Authorization: Bearer`, `X-API-Key`, or `CodeAudit-API-Key`.
