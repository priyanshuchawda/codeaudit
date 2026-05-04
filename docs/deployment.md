# Deployment

CodeAudit can run as a local stdio MCP server or as a Streamable HTTP MCP server. The tool surface is read-only in both modes.

## Free Public npm Distribution

The cheapest production distribution is the public npm package `codeaudit`. It lets users run CodeAudit locally against their own filesystem without paid hosting or a GitHub clone:

```bash
npx -y codeaudit
```

Current npm version: `0.1.2`.

Publishing future versions is configured through `.github/workflows/publish-npm.yml`.

Before publishing a future version:

1. Create or log in to an npm account.
2. Create a granular npm access token with package publish/write access and bypass 2FA enabled.
3. Add it to GitHub repository secrets as `NPM_TOKEN`.
4. Bump the package version.
5. Create a GitHub release such as `v0.1.3`.

The package publishes as public/free via:

```bash
pnpm --filter codeaudit publish --access public --provenance --no-git-checks
```

If npm returns `Two-factor authentication or granular access token with bypass 2fa enabled is required`, replace `NPM_TOKEN` with a granular token that has bypass 2FA enabled, then rerun the failed GitHub Actions job.

## Production Recommendation

Use Streamable HTTP behind HTTPS when multiple machines or remote clients need access.

Required controls:

- Set `CODEAUDIT_API_KEY` for hosted HTTP deployments.
- Use HTTPS at the reverse proxy, load balancer, or hosting provider.
- Set `CODEAUDIT_ALLOWED_ORIGINS` to trusted origins when browser clients are allowed.
- Keep filesystem access scoped by passing explicit `projectPath` values to tools.
- Do not expose write, push, merge, delete, or unrestricted command tools without a separate approval model.

## Environment

See `.env.example`.

| Variable                    | Default                | Purpose                                                             |
| --------------------------- | ---------------------- | ------------------------------------------------------------------- |
| `CODEAUDIT_TRANSPORT`       | `stdio`                | `stdio` or `http`.                                                  |
| `CODEAUDIT_HOST`            | `127.0.0.1`            | HTTP bind host. Use `0.0.0.0` in containers.                        |
| `CODEAUDIT_PORT` / `PORT`   | `3000`                 | HTTP port.                                                          |
| `CODEAUDIT_PUBLIC_BASE_URL` | derived from host/port | Public base URL used in metadata.                                   |
| `CODEAUDIT_REQUIRE_API_KEY` | `false`                | Require auth even when no API key is inferred.                      |
| `CODEAUDIT_API_KEY`         | unset                  | API key for HTTP deployments. Enables API-key requirement when set. |
| `CODEAUDIT_ALLOWED_ORIGINS` | `*`                    | Comma-separated CORS allowlist.                                     |

## Local HTTP

```bash
pnpm install
pnpm build
CODEAUDIT_API_KEY=change-me pnpm start:http
```

Verify:

```bash
curl http://127.0.0.1:3000/health
curl http://127.0.0.1:3000/.well-known/codeaudit
```

MCP endpoint:

```text
http://127.0.0.1:3000/mcp
```

Use one of these auth headers:

```text
Authorization: Bearer change-me
X-API-Key: change-me
CodeAudit-API-Key: change-me
```

## Docker

Build:

```bash
docker build -t codeaudit .
```

Run:

```bash
docker run --rm -p 3000:3000 \
  -e CODEAUDIT_API_KEY=change-me \
  -e CODEAUDIT_PUBLIC_BASE_URL=https://your-host.example.com \
  codeaudit
```

## Production Checklist

- [ ] `pnpm check` passes.
- [ ] `pnpm build` passes.
- [ ] `/health` returns `status: ok`.
- [ ] `/.well-known/codeaudit` shows the correct public MCP endpoint.
- [ ] Hosted HTTP has HTTPS in front.
- [ ] Hosted HTTP sets `CODEAUDIT_API_KEY`.
- [ ] Browser-accessible HTTP has a narrow `CODEAUDIT_ALLOWED_ORIGINS`.
- [ ] Client config sends `Authorization: Bearer <CODEAUDIT_API_KEY>`.
- [ ] No raw secrets are committed to `.env`, docs, or client configs.

## Current Limits

- OAuth is not implemented yet.
- Tools are intentionally read-only.
- Reports are returned as strings; the MCP server does not write reports into target repositories.
- GitHub issue/PR creation is planned as a future explicitly-gated capability.
