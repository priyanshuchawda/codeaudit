import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { auditCodeQualityTool } from "../../apps/mcp-server/src/tools/audit-code-quality.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtures = path.resolve(__dirname, "../fixtures");

describe("audit_code_quality", () => {
  test("flags weak API schema boundaries in fixture projects", async () => {
    const result = await auditCodeQualityTool({
      projectPath: path.join(fixtures, "nextjs-app"),
      strictness: "standard",
    });

    expect(result.weakTypingOrSchemaBoundaries).toContain("app/api/chat/route.ts");
    expect(result.findings.map((finding) => finding.title)).toContain("Weak input schema boundary");
    expect(result.maintainabilityScore).toBeLessThan(100);
  });
});
