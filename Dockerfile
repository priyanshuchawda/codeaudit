# ----- Build Stage -----
FROM node:lts-alpine AS builder
RUN corepack enable pnpm
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/mcp-server/package.json ./apps/mcp-server/package.json
RUN pnpm install --frozen-lockfile

COPY apps ./apps
COPY skills ./skills
COPY docs ./docs
COPY AGENTS.md README.md SOUL.md TOOLS.md ./
RUN pnpm build

# ----- Production Stage -----
FROM node:lts-alpine
RUN corepack enable pnpm
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/mcp-server/package.json ./apps/mcp-server/package.json
RUN pnpm install --frozen-lockfile --prod --filter reposentinel-mcp

COPY --from=builder /app/apps/mcp-server/dist ./apps/mcp-server/dist

ENV REPOSENTINEL_TRANSPORT=http
ENV REPOSENTINEL_HOST=0.0.0.0
ENV REPOSENTINEL_PORT=3000
EXPOSE 3000

CMD ["pnpm", "--filter", "reposentinel-mcp", "start:http"]
