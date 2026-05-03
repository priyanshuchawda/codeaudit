---
name: docs-claims-evidence-review
description: Maps README and documentation claims to code, tests, and documentation evidence. Use when reviewing docs truthfulness, recruiter-facing claims, security claims, or production-readiness claims.
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
