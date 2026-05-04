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
RUN pnpm install --frozen-lockfile --prod --filter @priyanshuchawda/codeaudit

COPY --from=builder /app/apps/mcp-server/dist ./apps/mcp-server/dist

ENV CODEAUDIT_TRANSPORT=http
ENV CODEAUDIT_HOST=0.0.0.0
ENV CODEAUDIT_PORT=3000
EXPOSE 3000

CMD ["pnpm", "--filter", "@priyanshuchawda/codeaudit", "start:http"]
