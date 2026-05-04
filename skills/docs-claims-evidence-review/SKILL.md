---
name: docs-claims-evidence-review
description: Use when reviewing README or docs truthfulness, recruiter-facing claims, security claims, production-readiness claims, evidence maps, or unsupported project claims.
metadata:
  internal: true
---

# Docs Claims Evidence Review

## Workflow

1. Extract strong claims from README and docs.
2. Classify claim strength: weak, moderate, or strong.
3. Map each claim to file, test, or documentation evidence.
4. Mark missing evidence explicitly.
5. Recommend keep, weaken, remove, or add evidence.

## Strong Claims

Never allow unsupported claims such as secure, production-ready, enterprise-grade, fully tested, scalable, robust, or battle-tested. Docs should stay positive but truthful.

## Evidence Examples

- Security: middleware, auth checks, rate limits, headers, validation, threat model, security tests.
- Production-ready: deployment docs, env docs, smoke tests, error handling, observability.
- Fully tested: test framework, meaningful test files, coverage or test command evidence.
