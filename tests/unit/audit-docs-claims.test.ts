import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { auditDocsClaimsTool } from "../../apps/mcp-server/src/tools/audit-docs-claims.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtures = path.resolve(__dirname, "../fixtures");

describe("audit_docs_claims", () => {
  test("detects strong README claims and missing evidence", async () => {
    const result = await auditDocsClaimsTool({ projectPath: path.join(fixtures, "nextjs-app") });
    expect(result.claims.length).toBeGreaterThan(0);
    expect(result.claims.map((claim) => claim.claim).join(" ")).toContain("secure");
    expect(result.claims.some((claim) => claim.evidenceMissing.length > 0)).toBe(true);
    expect(result.claims.some((claim) => claim.evidenceFound.length > 0)).toBe(true);
    expect(result.claims.map((claim) => claim.recommendation)).toContain("add-evidence");
  });
});
