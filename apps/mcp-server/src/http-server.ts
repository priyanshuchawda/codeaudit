import type { Server as HttpServer } from "node:http";
import express, { type NextFunction, type Request, type Response } from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createCodeAuditServer, SERVER_VERSION } from "./mcp-server.js";
import type { RuntimeConfig } from "./runtime-config.js";

const MCP_PATH = "/mcp";

export function createHttpApp(config: RuntimeConfig): express.Express {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "1mb" }));
  app.use(corsMiddleware(config));

  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      name: "codeaudit",
      version: SERVER_VERSION,
      transport: "http",
      mcpEndpoint: MCP_PATH,
      auth: config.requireApiKey ? "api-key" : "none",
    });
  });

  app.get("/.well-known/codeaudit", (_req, res) => {
    res.json({
      name: "codeaudit",
      version: SERVER_VERSION,
      mcpEndpoint: `${config.publicBaseUrl}${MCP_PATH}`,
      transport: "streamable-http",
      authentication: config.requireApiKey
        ? {
            type: "api-key",
            headerNames: ["Authorization: Bearer <token>", "X-API-Key", "CodeAudit-API-Key"],
          }
        : { type: "none" },
      safetyModel: {
        readOnlyTools: true,
        allowedRootsRequired: true,
        allowedRoots: config.allowedRoots,
        noUnrestrictedShell: true,
        noRemoteMutationTools: true,
        redactsSecrets: true,
      },
    });
  });

  app.all(MCP_PATH, async (req, res) => {
    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }

    if (req.method === "GET") {
      res.status(405).json({
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "CodeAudit does not expose server-initiated SSE streams.",
        },
        id: null,
      });
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({
        jsonrpc: "2.0",
        error: { code: -32000, message: "Use POST for MCP Streamable HTTP requests." },
        id: null,
      });
      return;
    }

    if (!isAuthorized(req, config)) {
      res.setHeader("WWW-Authenticate", 'Bearer realm="CodeAudit MCP"');
      res.status(401).json({
        jsonrpc: "2.0",
        error: { code: -32001, message: "Authentication required for CodeAudit HTTP MCP." },
        id: null,
      });
      return;
    }

    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });
    const server = createCodeAuditServer({ allowedRoots: config.allowedRoots });

    res.on("close", () => {
      transport.close().catch(() => undefined);
      server.close().catch(() => undefined);
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error("CodeAudit HTTP transport error:", error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: { code: -32603, message: "Internal CodeAudit MCP server error." },
          id: null,
        });
      }
    }
  });

  app.use((_req, res) => {
    res.status(404).json({
      error: "not_found",
      message: "Endpoint not found. Use /health, /.well-known/codeaudit, or /mcp.",
    });
  });

  return app;
}

export async function startHttpServer(config: RuntimeConfig): Promise<HttpServer> {
  const app = createHttpApp(config);
  return new Promise((resolve, reject) => {
    const httpServer = app.listen(config.port, config.host);
    httpServer.once("error", reject);
    httpServer.once("listening", () => {
      console.error(
        `CodeAudit MCP v${SERVER_VERSION} listening on http://${config.host}:${config.port}${MCP_PATH}`,
      );
      resolve(httpServer);
    });
  });
}

export function extractApiKey(req: Request): string | undefined {
  const auth = headerValue(req.headers.authorization);
  if (auth?.startsWith("Bearer ")) return auth.slice("Bearer ".length).trim();
  return (
    auth ?? headerValue(req.headers["x-api-key"]) ?? headerValue(req.headers["codeaudit-api-key"])
  );
}

function isAuthorized(req: Request, config: RuntimeConfig): boolean {
  if (!config.requireApiKey) return true;
  return extractApiKey(req) === config.apiKey;
}

function corsMiddleware(config: RuntimeConfig) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const requestOrigin = headerValue(req.headers.origin);
    const allowedOrigin = allowedCorsOrigin(requestOrigin, config.allowedOrigins);
    if (allowedOrigin) {
      res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
      res.setHeader("Vary", "Origin");
    }
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-API-Key, CodeAudit-API-Key, MCP-Protocol-Version, MCP-Session-Id",
    );
    res.setHeader("Access-Control-Expose-Headers", "MCP-Session-Id");
    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }
    next();
  };
}

function allowedCorsOrigin(
  requestOrigin: string | undefined,
  allowedOrigins: string[],
): string | undefined {
  if (allowedOrigins.includes("*")) return requestOrigin ?? "*";
  if (requestOrigin && allowedOrigins.includes(requestOrigin)) return requestOrigin;
  return undefined;
}

function headerValue(value: string | string[] | undefined): string | undefined {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
}
