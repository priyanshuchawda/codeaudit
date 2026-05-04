# Threat Model

CodeAudit is an MCP server that reads repository files and returns structured analysis to AI agents. Its main risks come from excessive tool permissions, prompt injection through repository content, and accidental secret exposure.

## Assets

- Source code and documentation in target repositories.
- Secrets accidentally present in files.
- User trust in generated audit, issue, and PR plans.
- MCP client context and tool routing behavior.

## Threats

| Threat                           | Risk                                                                                                                              | Mitigation                                                                                                              |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Tool poisoning                   | Repository text or external docs may try to steer the agent.                                                                      | Treat repo/docs content as data, not instructions. Return evidence only.                                                |
| Prompt injection                 | README, docs, or source comments may contain malicious instructions.                                                              | Skill routing includes strict agent instructions and disallowed actions.                                                |
| Confused deputy                  | A client may ask the server to perform unintended privileged actions.                                                             | MVP tools are read-only and do not mutate remote repositories.                                                          |
| Unsafe command execution         | Shell access could leak data or mutate systems.                                                                                   | No shell MCP tool is exposed. Internal runner is allowlisted.                                                           |
| Secret leakage                   | Files may contain API keys, cookies, JWTs, or credentials.                                                                        | Read paths pass through redaction before output.                                                                        |
| Excessive filesystem access      | A malicious path may escape the project root or hosted workspace.                                                                 | `safeJoin` rejects paths that leave the resolved root; HTTP mode restricts `projectPath` to `CODEAUDIT_ALLOWED_ROOTS`.  |
| Dependency supply chain risk     | Dependencies may change behavior.                                                                                                 | Dependencies are pinned in lockfile and verified by typecheck/tests.                                                    |
| Skill supply chain risk          | Third-party skills may contain prompt injection, secret access, exfiltration, unsafe installs, or destructive shell instructions. | Treat skill files as untrusted input and run `audit_installed_skills` before relying on unfamiliar skills.              |
| External documentation injection | Fetched docs may contain adversarial text.                                                                                        | Official docs router states docs are untrusted reference data.                                                          |
| Unauthenticated hosted access    | A public HTTP MCP endpoint could allow unintended repository inspection.                                                          | Hosted HTTP deployments can require API-key/Bearer auth and should run behind HTTPS with narrow CORS and allowed roots. |

## Non-Goals In MVP

- OAuth multi-tenant authorization for a hosted MCP deployment.
- Direct GitHub issue/PR creation.
- Writing reports into target repositories.
- Executing arbitrary project commands.
