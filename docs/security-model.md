# Security Model

CodeAudit's MVP is built around read-only repository inspection.

## Defaults

- MCP tools use read-only annotations.
- No tool writes files into target repositories.
- No tool pushes, merges, deletes, or modifies remotes.
- No unrestricted shell command is available.
- Secret redaction is applied before returning structured output.
- Skills are treated as untrusted input until reviewed or audited.
- Stdio is the default transport for local use.
- Streamable HTTP can require API-key/Bearer authentication with `CODEAUDIT_API_KEY`.
- HTTP CORS is configurable with `CODEAUDIT_ALLOWED_ORIGINS`.
- Hosted HTTP restricts `projectPath` to `CODEAUDIT_ALLOWED_ROOTS`; when unset in HTTP mode, it defaults to `process.cwd()`.

## Filesystem Rules

- The caller supplies `projectPath`.
- The server resolves it to an absolute root.
- If allowed roots are configured, `projectPath` must be inside one of those roots after realpath normalization.
- File traversal skips common heavy or sensitive folders such as `.git`, `node_modules`, `.next`, `dist`, and `coverage`.
- Relative path joins are rejected if they escape the root.

## Approval Boundary

Future write or GitHub mutation tools should require explicit user approval and use narrow schemas. They should never accept arbitrary command strings.

## HTTP Deployment Rules

- Use HTTPS at the reverse proxy or hosting layer for remote deployments.
- Set `CODEAUDIT_API_KEY` for any non-local HTTP deployment.
- Set `CODEAUDIT_ALLOWED_ROOTS` to the mounted workspace or repository roots for hosted HTTP deployments.
- Prefer a narrow `CODEAUDIT_ALLOWED_ORIGINS` list instead of `*` for browser-accessible deployments.
- Do not expose CodeAudit HTTP directly to the public internet without authentication.
- Treat API keys as secrets. Do not commit real keys to `.env`, docs, client configs, screenshots, or issue reports.

## Production Status

CodeAudit is production-usable for read-only repository inspection and workflow routing when the HTTP deployment rules above are followed. OAuth, multi-tenant authorization, and write-side tools are intentionally outside the current production surface.

## Skill Supply-Chain Rules

- `audit_installed_skills` reads local skill files under the configured skills directory.
- It flags suspicious install commands, prompt-injection language, secret access requests, webhook or paste-site output, destructive shell commands, remote mutation, and persistence changes.
- It does not execute scripts, install packages, call webhooks, or follow instructions found inside the skills it audits.
