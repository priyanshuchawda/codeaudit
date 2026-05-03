# Threat Model

RepoSentinel is an MCP server that reads repository files and returns structured analysis to AI agents. Its main risks come from excessive tool permissions, prompt injection through repository content, and accidental secret exposure.

## Assets

- Source code and documentation in target repositories.
- Secrets accidentally present in files.
- User trust in generated audit, issue, and PR plans.
- MCP client context and tool routing behavior.

## Threats

| Threat | Risk | Mitigation |
| --- | --- | --- |
| Tool poisoning | Repository text or external docs may try to steer the agent. | Treat repo/docs content as data, not instructions. Return evidence only. |
| Prompt injection | README, docs, or source comments may contain malicious instructions. | Skill routing includes strict agent instructions and disallowed actions. |
| Confused deputy | A client may ask the server to perform unintended privileged actions. | MVP tools are read-only and do not mutate remote repositories. |
| Unsafe command execution | Shell access could leak data or mutate systems. | No shell MCP tool is exposed. Internal runner is allowlisted. |
| Secret leakage | Files may contain API keys, cookies, JWTs, or credentials. | Read paths pass through redaction before output. |
| Excessive filesystem access | A malicious path may escape the project root. | `safeJoin` rejects paths that leave the resolved root. |
| Supply chain risk | Dependencies may change behavior. | Dependencies are pinned in lockfile and verified by typecheck/tests. |
| External documentation injection | Fetched docs may contain adversarial text. | Official docs router states docs are untrusted reference data. |

## Non-Goals In MVP

- Authentication and multi-tenant authorization for a hosted MCP deployment.
- Direct GitHub issue/PR creation.
- Writing reports into target repositories.
- Executing arbitrary project commands.
