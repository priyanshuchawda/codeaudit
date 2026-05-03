---
name: nextjs-security-review
description: Reviews Next.js applications for App Router, route handler, middleware, auth, validation, headers, environment, and deployment security risks. Use when a Next.js project is detected or the user requests a Next.js security audit.
---

# Next.js Security Review

## Required Checks

- App Router conventions and server/client boundaries.
- Route handlers and server actions for input validation.
- Auth and authorization checks on sensitive paths.
- Middleware coverage or documented route-level alternatives.
- Rate limiting on public mutation and AI/model routes.
- Security headers and deployment-layer header evidence.
- Environment validation and client/server secret separation.
- Unsafe redirects, SSRF, file uploads, and raw provider error leakage.
- Logging that may expose headers, cookies, tokens, requests, or model/provider errors.

## Evidence

Use concrete files such as `middleware.ts`, `app/api/**/route.ts`, `next.config.*`, env modules, tests, and security docs. If a control is missing, say missing rather than assuming it exists elsewhere.
