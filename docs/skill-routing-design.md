# Skill Routing Design

`route_skills` exists because not every MCP client can directly activate local skills. The tool returns a manifest that any AI agent can follow.

## Manifest Fields

- `projectState`: `empty` or `existing`.
- `task`: original user task.
- `riskLevel`: low, medium, or high.
- `recommendedSkills`: skill name, reason, and whether it is required.
- `requiredWorkflow`: recommended workflow name.
- `workflowPhases`: ordered phases with objective, skills, tools, required evidence, and exit criteria.
- `recommendedToolSequence`: default MCP tool order for the task.
- `skillActivationOrder`: ordered skill list derived from workflow phases and recommendations.
- `qualityGates`: completion gates that require evidence or a documented exception.
- `requiredOutputs`: artifacts the agent should produce.
- `strictAgentInstructions`: guardrails the agent should follow.
- `disallowedActions`: actions the agent must not take without explicit approval.

## Routing Inputs

The router considers project state, framework, router type, auth, app type, risk notes, and task keywords such as security, docs, refactor, issue, PR, and audit.

## Workflow Intent

- Empty projects route to `initialize_project`: clarify intent, create baseline architecture, add security/data foundations, then add tests, docs, and CI.
- Existing projects route through inventory and evidence audits before issue/PR planning or refactors.
- Security requests prioritize trust boundaries and remediation planning.
- Docs requests map claims to code, tests, or documentation evidence before allowing strong claims.
- Refactor requests require audit evidence and tests before internal changes.
