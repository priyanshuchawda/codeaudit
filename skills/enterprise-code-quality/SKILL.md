---
name: enterprise-code-quality
description: Applies strict maintainability standards for readable, typed, testable software. Use when auditing, reviewing, refactoring, or planning improvements to application or infrastructure code.
---

# Enterprise Code Quality

## Standards

- Prefer small focused files with one clear responsibility.
- Use typed contracts and schema validation at external boundaries.
- Prefer clear names and simple control flow over clever abstractions.
- Avoid god files, vague helpers, dead code, and duplicated logic.
- Keep error handling explicit and useful without leaking secrets.
- Refactor only with tests before or alongside the change.

## Review Checklist

- File size and responsibility boundaries.
- API, CLI, config, and database input validation.
- Test coverage for changed behavior.
- Data flow across server/client or trust boundaries.
- Duplicated logic that can be safely consolidated.
- Overengineering that hides simple domain logic.

## Output Style

Findings should include severity, file evidence, why it matters, and the smallest practical recommendation.
