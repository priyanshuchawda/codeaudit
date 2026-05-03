---
name: python-mcp-server-quality
description: Use when creating, auditing, or improving Python MCP servers, FastMCP tools, resources, prompts, stdio transports, streamable HTTP transports, MCP Inspector setup, or Python tool schemas.
---

# Python MCP Server Quality

## Core Standard

Python MCP servers should be small, typed, read/write behavior should be explicit, and stdio output must remain protocol-safe.

## Required Checks

- Server shape: use `FastMCP` from the official Python MCP SDK unless the project has a clear reason not to.
- Tools: one tool equals one capability; every tool has type hints, docstring, validation, bounded filesystem/network behavior, and structured return data.
- Resources: expose read-only docs, config, indexes, or templates as resources instead of action tools.
- Prompts: keep reusable instructions parameterized and do not embed secrets or hidden authority.
- Transport: use stdio for local clients and streamable HTTP behind HTTPS/auth for remote clients.
- Stdio safety: never print logs to stdout; use stderr or MCP context logging.
- Errors: return useful, redacted errors; do not leak stack traces, tokens, env values, paths outside the selected project, or provider internals.
- Testing: cover tool functions directly, then verify with MCP Inspector or an in-memory/client smoke test.
- Packaging: prefer `uv`, `pyproject.toml`, pinned Python version, and documented `uv run` commands.

## Generation Workflow

For new Python MCP servers, combine this skill with `python-mcp-server-generator` and `mcp-builder`. Start with a minimal working server, add tests before expanding tools, then document client setup for Codex, Claude Code, Cursor, VS Code, and MCP Inspector.

## Common Mistakes

- Returning broad dictionaries without stable keys or documented schema.
- Using one generic `run_command` or `manage_project` tool instead of focused tools.
- Letting tools read arbitrary paths without resolving them under an allowed project root.
- Adding write, delete, push, deploy, or merge operations before an explicit approval model exists.
