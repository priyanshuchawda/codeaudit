---
name: github-issue-pr-workflow
description: Use when generating GitHub issue plans, PR plans, branch names, commit scopes, review checklists, merge guidance, or issue-first workflow guidance.
metadata:
  internal: true
---

# GitHub Issue PR Workflow

## Required Flow

1. Create or propose an issue first.
2. Use a clean scoped branch.
3. Keep commits focused and descriptive.
4. Link the PR to the issue.
5. List tests run.
6. Describe security impact and docs impact.
7. Merge only after clean review and verification.

## Branch Names

- `fix/issue-12-api-rate-limit`
- `refactor/issue-18-split-security-utils`
- `docs/issue-21-evidence-map`

## PR Body Sections

- Linked issue
- Summary
- Tests run
- Security impact
- Docs impact
- Screenshots when UI changed

No auto-push, branch deletion, remote mutation, or auto-merge without explicit user approval.
