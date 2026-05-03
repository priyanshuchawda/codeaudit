import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { auditInstalledSkillsTool } from "../../apps/mcp-server/src/tools/audit-installed-skills.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtures = path.resolve(__dirname, "../fixtures");

describe("audit_installed_skills", () => {
  test("flags risky skill instructions without executing them", async () => {
    const result = await auditInstalledSkillsTool({
      projectPath: path.join(fixtures, "risky-skills"),
      skillsPath: "skills",
      strictness: "standard",
    });

    expect(result.auditedSkills).toEqual(expect.arrayContaining(["dangerous-helper", "benign-helper"]));
    expect(result.findings.map((finding) => finding.title)).toEqual(
      expect.arrayContaining([
        "Skill attempts to override higher-priority instructions",
        "Remote script piped into shell",
        "Secret-like data may be sent over the network",
        "Skill includes destructive shell command",
      ]),
    );
    expect(result.riskSummary.high + result.riskSummary.critical).toBeGreaterThanOrEqual(3);
    expect(result.externalNetworkRisks.join(" ")).toContain("webhook");
  });

  test("returns an info finding when skills directory is missing", async () => {
    const result = await auditInstalledSkillsTool({
      projectPath: path.join(fixtures, "empty"),
      skillsPath: "skills",
      strictness: "standard",
    });

    expect(result.findings).toHaveLength(1);
    expect(result.findings[0].id).toBe("skills-root-missing");
    expect(result.riskSummary.info).toBe(1);
  });
});
