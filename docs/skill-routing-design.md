# Skill Routing Design

`route_skills` exists because not every MCP client can directly activate local skills. The tool returns a manifest that any AI agent can follow.

## Manifest Fields

- `projectState`: `empty` or `existing`.
- `task`: original user task.
- `riskLevel`: low, medium, or high.
- `recommendedSkills`: skill name, reason, and whether it is required.
- `requiredWorkflow`: recommended workflow name.
- `requiredOutputs`: artifacts the agent should produce.
- `strictAgentInstructions`: guardrails the agent should follow.
- `disallowedActions`: actions the agent must not take without explicit approval.

## Routing Inputs

The router considers project state, framework, router type, auth, app type, risk notes, and task keywords such as security, docs, refactor, issue, PR, and audit.
