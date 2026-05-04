import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { auditNextjsSecurityTool } from "../../apps/mcp-server/src/tools/audit-nextjs-security.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtures = path.resolve(__dirname, "../fixtures");

describe("audit_nextjs_security", () => {
  test("flags route validation, unsafe logging, and request-controlled fetch risks", async () => {
    const result = await auditNextjsSecurityTool({
      projectPath: path.join(fixtures, "nextjs-app"),
      strictness: "standard",
    });

    expect(result.routeHandlerRisks.join(" ")).toContain("app/api/chat/route.ts");
    expect(result.unsafeLoggingRisks.join(" ")).toContain("sensitive context");
    expect(result.ssrfOpenRedirectFileUploadRisks.join(" ")).toContain("outbound fetch");
    expect(result.findings.map((finding) => finding.title)).toEqual(
      expect.arrayContaining([
        "Route handler lacks obvious input validation",
        "Potentially unsafe logging",
      ]),
    );
  });
});
