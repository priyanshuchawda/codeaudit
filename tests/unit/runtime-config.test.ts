import { describe, expect, test } from "vitest";
import { parseRuntimeConfig } from "../../apps/mcp-server/src/runtime-config.js";

describe("runtime config", () => {
  test("defaults to stdio transport", () => {
    const result = parseRuntimeConfig([], {});
    expect(result.transport).toBe("stdio");
    expect(result.port).toBe(3000);
    expect(result.requireApiKey).toBe(false);
    expect(result.allowedRoots).toEqual([]);
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
      allowedRoots: [process.cwd()],
    });
  });

  test("parses allowed roots from env and CLI", () => {
    expect(
      parseRuntimeConfig(["--transport", "http", "--allowed-roots", "/workspace,/repos"], {}),
    ).toMatchObject({
      allowedRoots: ["/workspace", "/repos"],
    });

    expect(parseRuntimeConfig([], { CODEAUDIT_ALLOWED_ROOTS: "/workspace" })).toMatchObject({
      allowedRoots: ["/workspace"],
    });
  });

  test("rejects http auth requirement without an api key", () => {
    expect(() => parseRuntimeConfig(["--transport", "http", "--require-api-key"], {})).toThrow(
      "CODEAUDIT_API_KEY",
    );
  });

  test("rejects http-only flags in stdio mode", () => {
    expect(() => parseRuntimeConfig(["--port", "3001"], {})).toThrow("only valid");
  });
});
