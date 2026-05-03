# MCP Tool Contracts

All tool inputs and outputs are defined with zod in `apps/mcp-server/src/schemas`.

## Tools

- `detect_project(projectPath)`
- `route_skills(projectPath, userTask, detectedProject?)`
- `scan_repo(projectPath, maxDepth, includePatterns, excludePatterns)`
- `audit_code_quality(projectPath, strictness)`
- `audit_nextjs_security(projectPath, strictness)`
- `audit_docs_claims(projectPath)`
- `audit_tests(projectPath)`
- `official_docs_router(technology, topic, version?)`
- `generate_issue_plan(findings)`
- `generate_pr_plan(selectedIssue?, findings?)`
- `generate_report(findings, projectMetadata)`

## Output Rules

- Findings include severity, category, evidence, recommendation, and confidence.
- File paths are project-relative.
- Secret-like values are redacted.
- Report generation returns markdown strings and does not write files.
