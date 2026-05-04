import path from "node:path";
import { describe, expect, test } from "vitest";
import { assertProjectPathAllowed, safeJoin } from "../../apps/mcp-server/src/lib/safe-fs.js";

describe("safe filesystem boundaries", () => {
  test("safeJoin rejects paths that escape the project root", () => {
    expect(() => safeJoin(process.cwd(), "../outside.txt")).toThrow("Path escapes project root");
  });

  test("allowed roots reject project paths outside the configured roots", async () => {
    const allowedRoot = process.cwd();
    const outsideRoot = path.resolve(allowedRoot, "..");

    await expect(assertProjectPathAllowed(allowedRoot, [allowedRoot])).resolves.toBeUndefined();
    await expect(assertProjectPathAllowed(outsideRoot, [allowedRoot])).rejects.toThrow(
      "CODEAUDIT_ALLOWED_ROOTS",
    );
  });
});
