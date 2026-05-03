import { describe, expect, test } from "vitest";
import { parseRuntimeConfig } from "../../apps/mcp-server/src/runtime-config.js";

describe("runtime config", () => {
  test("defaults to stdio transport", () => {
    const result = parseRuntimeConfig([], {});
    expect(result.transport).toBe("stdio");
    expect(result.port).toBe(3000);
    expect(result.requireApiKey).toBe(false);
  });

  test("parses http CLI options and enables auth when api key is set", () => {
    const result = parseRuntimeConfig(
      [
        "--transport",
        "http",
        "--host",
        "0.0.0.0",
        "--port",
        "8080",
        "--api-key",
        "secret",
        "--allow-origin",
        "https://example.com",
      ],
      {},
    );
    expect(result).toMatchObject({
      transport: "http",
      host: "0.0.0.0",
      port: 8080,
      apiKey: "secret",
      requireApiKey: true,
      allowedOrigins: ["https://example.com"],
    });
  });

  test("rejects http auth requirement without an api key", () => {
    expect(() => parseRuntimeConfig(["--transport", "http", "--require-api-key"], {})).toThrow(
      "REPOSENTINEL_API_KEY",
    );
  });

  test("rejects http-only flags in stdio mode", () => {
    expect(() => parseRuntimeConfig(["--port", "3001"], {})).toThrow("only valid");
  });
});
