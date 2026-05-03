---
name: python-backend-quality
description: Use when reviewing, creating, or improving Python services, CLIs, libraries, FastAPI, Django, Flask, pytest, uv, pyproject, typing, Pydantic, SQLAlchemy, async code, packaging, or deployment.
---

# Python Backend Quality

## Core Standard

Python projects need explicit packaging, typed boundaries, fast tests, and predictable runtime configuration. Prefer boring structure over clever dynamic behavior.

## Required Checks

- Packaging: `pyproject.toml`, lockfile (`uv.lock` or equivalent), clear scripts, Python version pin, and no ad-hoc global installs.
- Boundaries: Pydantic/dataclasses/TypedDicts for request, config, tool, API, database, and external-service inputs.
- Types: meaningful annotations, mypy/pyright/basedpyright where practical, no broad `Any` at trust boundaries.
- Tests: pytest or equivalent with unit tests for pure logic and integration tests for API/auth/database boundaries.
- Quality tools: Ruff format/lint, deterministic imports, CI command that runs lint, typecheck, and tests.
- Runtime: env validation, secret redaction, structured logging, graceful startup/shutdown, and clear error models.
- Frameworks: FastAPI dependencies and routers stay thin; Django views/serializers/services are separated; Flask routes validate inputs before business logic.
- Data: migrations are explicit, sessions/transactions are scoped, and database errors do not leak raw internals.

## Output

For each finding, include the file evidence, risk, smallest practical fix, and tests to run. Do not claim production-ready Python unless packaging, tests, typing, env handling, and deployment checks are evidenced.

## Common Mistakes

- Treating `requirements.txt` alone as a full project contract.
- Putting business logic directly in FastAPI route functions, Django views, or Flask handlers.
- Swallowing exceptions with `except Exception: pass` or returning `None` without context.
- Logging raw request bodies, tokens, connection strings, prompts, or provider errors.
