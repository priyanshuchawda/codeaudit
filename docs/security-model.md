# Security Model

RepoSentinel's MVP is built around read-only repository inspection.

## Defaults

- MCP tools use read-only annotations.
- No tool writes files into target repositories.
- No tool pushes, merges, deletes, or modifies remotes.
- No unrestricted shell command is available.
- Secret redaction is applied before returning structured output.

## Filesystem Rules

- The caller supplies `projectPath`.
- The server resolves it to an absolute root.
- File traversal skips common heavy or sensitive folders such as `.git`, `node_modules`, `.next`, `dist`, and `coverage`.
- Relative path joins are rejected if they escape the root.

## Approval Boundary

Future write or GitHub mutation tools should require explicit user approval and use narrow schemas. They should never accept arbitrary command strings.
