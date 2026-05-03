import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { detectProjectTool } from "../../apps/mcp-server/src/tools/detect-project.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtures = path.resolve(__dirname, "../fixtures");

describe("detect_project", () => {
  test("detects an empty folder", async () => {
    const result = await detectProjectTool({ projectPath: path.join(fixtures, "empty") });
    expect(result.state).toBe("empty");
    expect(result.riskNotes).toContain(
      "Project appears empty; initialize a secure baseline before adding features.",
    );
  });

  test("detects a Next.js app fixture", async () => {
    const result = await detectProjectTool({ projectPath: path.join(fixtures, "nextjs-app") });
    expect(result.state).toBe("existing");
    expect(result.framework).toBe("nextjs");
    expect(result.router).toBe("app-router");
    expect(result.packageManager).toBe("pnpm");
    expect(result.language).toBe("typescript");
    expect(result.testFrameworks).toEqual(expect.arrayContaining(["vitest", "playwright"]));
    expect(result.auth).toBe("better-auth");
    expect(result.deployment).toBe("vercel");
  });

  test("detects a Python MCP server fixture", async () => {
    const result = await detectProjectTool({ projectPath: path.join(fixtures, "python-mcp") });
    expect(result.state).toBe("existing");
    expect(result.framework).toBe("fastapi");
    expect(result.packageManager).toBe("uv");
    expect(result.language).toBe("python");
    expect(result.appType).toBe("mcp-server");
    expect(result.testFrameworks).toEqual(expect.arrayContaining(["pytest", "python-test-files"]));
    expect(result.database).toBe("sqlalchemy");
    expect(result.riskNotes).not.toContain("No test framework was detected.");
  });
});
