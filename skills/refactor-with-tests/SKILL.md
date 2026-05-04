---
name: refactor-with-tests
description: Use when splitting files, improving architecture, reducing duplication, changing internals, or preserving behavior through focused tests during refactors.
metadata:
  internal: true
---

# Refactor With Tests

## Workflow

1. Identify the exact behavior to preserve.
2. Add or locate tests that cover the behavior.
3. Make the smallest useful refactor.
4. Run relevant tests and typecheck.
5. Update docs only when behavior, architecture, or setup changes.
6. Summarize changed files and validation.

## Guardrails

- Do not combine unrelated refactors.
- Do not rename public APIs without an explicit migration reason.
- Do not weaken validation, auth, error handling, or observability to simplify code.
- Preserve user changes in a dirty worktree.
