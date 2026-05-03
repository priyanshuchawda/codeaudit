# Deployment

RepoSentinel can run as a local stdio MCP server or as a Streamable HTTP MCP server. The tool surface is read-only in both modes.

## Free Public npm Distribution

The cheapest production distribution is a public npm package. It lets users run RepoSentinel locally against their own filesystem without paid hosting:

```bash
npx -y reposentinel-mcp
```

Publishing is configured through `.github/workflows/publish-npm.yml`.

Before the first publish:

1. Create or log in to an npm account.
2. Create a granular npm access token with package publish/write access and bypass 2FA enabled.
3. Add it to GitHub repository secrets as `NPM_TOKEN`.
4. Create a GitHub release such as `v0.1.0`.

The package publishes as public/free via:

```bash
pnpm --filter reposentinel-mcp publish --access public --provenance --no-git-checks
```

If npm returns `Two-factor authentication or granular access token with bypass 2fa enabled is required`, replace `NPM_TOKEN` with a granular token that has bypass 2FA enabled, then rerun the failed GitHub Actions job.

## Production Recommendation

Use Streamable HTTP behind HTTPS when multiple machines or remote clients need access.

Required controls:

- Set `REPOSENTINEL_API_KEY` for hosted HTTP deployments.
- Use HTTPS at the reverse proxy, load balancer, or hosting provider.
- Set `REPOSENTINEL_ALLOWED_ORIGINS` to trusted origins when browser clients are allowed.
- Keep filesystem access scoped by passing explicit `projectPath` values to tools.
- Do not expose write, push, merge, delete, or unrestricted command tools without a separate approval model.

## Environment

See `.env.example`.

| Variable                       | Default                | Purpose                                                             |
| ------------------------------ | ---------------------- | ------------------------------------------------------------------- |
| `REPOSENTINEL_TRANSPORT`       | `stdio`                | `stdio` or `http`.                                                  |
| `REPOSENTINEL_HOST`            | `127.0.0.1`            | HTTP bind host. Use `0.0.0.0` in containers.                        |
| `REPOSENTINEL_PORT` / `PORT`   | `3000`                 | HTTP port.                                                          |
| `REPOSENTINEL_PUBLIC_BASE_URL` | derived from host/port | Public base URL used in metadata.                                   |
| `REPOSENTINEL_REQUIRE_API_KEY` | `false`                | Require auth even when no API key is inferred.                      |
| `REPOSENTINEL_API_KEY`         | unset                  | API key for HTTP deployments. Enables API-key requirement when set. |
| `REPOSENTINEL_ALLOWED_ORIGINS` | `*`                    | Comma-separated CORS allowlist.                                     |

## Local HTTP

```bash
pnpm install
pnpm build
REPOSENTINEL_API_KEY=change-me pnpm start:http
```

Verify:

```bash
curl http://127.0.0.1:3000/health
curl http://127.0.0.1:3000/.well-known/reposentinel-mcp
```

MCP endpoint:

```text
http://127.0.0.1:3000/mcp
```

Use one of these auth headers:

```text
Authorization: Bearer change-me
X-API-Key: change-me
RepoSentinel-API-Key: change-me
```

## Docker

Build:

```bash
docker build -t reposentinel-mcp .
```

Run:

```bash
docker run --rm -p 3000:3000 \
  -e REPOSENTINEL_API_KEY=change-me \
  -e REPOSENTINEL_PUBLIC_BASE_URL=https://your-host.example.com \
  reposentinel-mcp
```

## Production Checklist

- [ ] `pnpm check` passes.
- [ ] `pnpm build` passes.
- [ ] `/health` returns `status: ok`.
- [ ] `/.well-known/reposentinel-mcp` shows the correct public MCP endpoint.
- [ ] Hosted HTTP has HTTPS in front.
- [ ] Hosted HTTP sets `REPOSENTINEL_API_KEY`.
- [ ] Browser-accessible HTTP has a narrow `REPOSENTINEL_ALLOWED_ORIGINS`.
- [ ] Client config sends `Authorization: Bearer <REPOSENTINEL_API_KEY>`.
- [ ] No raw secrets are committed to `.env`, docs, or client configs.

## Current Limits

- OAuth is not implemented yet.
- Tools are intentionally read-only.
- Reports are returned as strings; the MCP server does not write reports into target repositories.
- GitHub issue/PR creation is planned as a future explicitly-gated capability.
