import type { Server } from "node:http";
import { AddressInfo } from "node:net";
import { afterEach, describe, expect, test } from "vitest";
import { createHttpApp, extractApiKey } from "../../apps/mcp-server/src/http-server.js";
import type { RuntimeConfig } from "../../apps/mcp-server/src/runtime-config.js";

let server: Server | undefined;

afterEach(async () => {
  if (!server) return;
  await new Promise<void>((resolve, reject) => {
    server?.close((error) => (error ? reject(error) : resolve()));
  });
  server = undefined;
});

describe("http server", () => {
  test("serves health and metadata endpoints", async () => {
    const baseUrl = await listen(baseConfig({ requireApiKey: false }));

    const health = await fetch(`${baseUrl}/health`);
    expect(health.status).toBe(200);
    await expect(health.json()).resolves.toMatchObject({
      status: "ok",
      transport: "http",
      auth: "none",
    });

    const metadata = await fetch(`${baseUrl}/.well-known/reposentinel-mcp`);
    expect(metadata.status).toBe(200);
    await expect(metadata.json()).resolves.toMatchObject({
      name: "reposentinel-mcp",
      transport: "streamable-http",
    });
  });

  test("requires api key when configured", async () => {
    const baseUrl = await listen(baseConfig({ apiKey: "secret", requireApiKey: true }));

    const missingAuth = await fetch(`${baseUrl}/mcp`, { method: "POST", body: "{}" });
    expect(missingAuth.status).toBe(401);

    const withAuth = await fetch(`${baseUrl}/mcp`, {
      method: "POST",
      headers: { Authorization: "Bearer secret", "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} }),
    });
    expect(withAuth.status).not.toBe(401);
  });

  test("extracts bearer and header api keys", () => {
    expect(extractApiKey({ headers: { authorization: "Bearer abc" } } as never)).toBe("abc");
    expect(extractApiKey({ headers: { "x-api-key": "def" } } as never)).toBe("def");
    expect(extractApiKey({ headers: { "reposentinel-api-key": "ghi" } } as never)).toBe("ghi");
  });
});

function baseConfig(overrides: Partial<RuntimeConfig>): RuntimeConfig {
  return {
    transport: "http",
    host: "127.0.0.1",
    port: 0,
    publicBaseUrl: "http://127.0.0.1",
    requireApiKey: false,
    allowedOrigins: ["*"],
    ...overrides,
  };
}

async function listen(config: RuntimeConfig): Promise<string> {
  const app = createHttpApp(config);
  await new Promise<void>((resolve) => {
    server = app.listen(0, "127.0.0.1", resolve);
  });
  const address = server?.address() as AddressInfo;
  return `http://127.0.0.1:${address.port}`;
}
