---
name: ai-app-security-review
description: Reviews AI applications for prompt injection, tool-call safety, retrieval grounding, provider error leakage, and telemetry redaction. Use when model providers, agents, RAG, tools, or AI SDKs are detected.
---

# AI App Security Review

## Required Checks

- Prompt injection boundaries between user, retrieved, system, and tool content.
- Tool-call allowlists, parameter validation, and destructive-action approval.
- Retrieval/document grounding and citation expectations.
- Model provider error handling without raw provider leakage.
- User input boundaries before prompts, tools, database writes, and outbound requests.
- Logging and telemetry redaction for prompts, documents, tokens, cookies, and keys.

## Output

Group findings by trust boundary. Prefer specific mitigations such as schema validation, allowlisted tools, redacted logs, and explicit human approval gates.
