import path from "node:path";
import { promises as fs } from "node:fs";
import os from "node:os";
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

    expect(result.auditedSkills).toEqual(
      expect.arrayContaining(["dangerous-helper", "benign-helper"]),
    );
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

  test("flags manifest quality, duplicate names, auxiliary docs, and undiscoverable resources", async () => {
    const projectPath = await fs.mkdtemp(path.join(os.tmpdir(), "codeaudit-skills-"));
    try {
      await fs.mkdir(path.join(projectPath, "skills", "duplicate-one"), { recursive: true });
      await fs.mkdir(path.join(projectPath, "skills", "duplicate-two"), { recursive: true });
      await fs.mkdir(path.join(projectPath, "skills", "resource-heavy", "scripts"), {
        recursive: true,
      });
      await fs.mkdir(path.join(projectPath, "skills", "missing-manifest"), { recursive: true });

      await fs.writeFile(
        path.join(projectPath, "skills", "duplicate-one", "SKILL.md"),
        [
          "---",
          "name: duplicate-skill",
          "description: Short description without trigger guidance.",
          "metadata:",
          "  owner: platform",
          "---",
          "# Duplicate One",
          "",
          "Use normal workflow.",
        ].join("\n"),
      );
      await fs.writeFile(
        path.join(projectPath, "skills", "duplicate-two", "SKILL.md"),
        [
          "---",
          "name: duplicate-skill",
          "description: Also short and missing trigger guidance.",
          "audience: internal",
          "---",
          "# Duplicate Two",
        ].join("\n"),
      );
      await fs.writeFile(
        path.join(projectPath, "skills", "resource-heavy", "SKILL.md"),
        [
          "---",
          "name: resource-heavy",
          "description: Validates bundled resources. Use when checking whether a skill exposes references correctly.",
          "---",
          "# Resource Heavy",
          "",
          "Follow the workflow.",
        ].join("\n"),
      );
      await fs.writeFile(
        path.join(projectPath, "skills", "resource-heavy", "scripts", "helper.py"),
        "print('ok')\n",
      );
      await fs.writeFile(
        path.join(projectPath, "skills", "resource-heavy", "README.md"),
        "# Extra docs\n",
      );

      const result = await auditInstalledSkillsTool({
        projectPath,
        skillsPath: "skills",
        strictness: "strict",
      });

      expect(result.findings.map((finding) => finding.title)).toEqual(
        expect.arrayContaining([
          "Skill directory is missing SKILL.md",
          "Duplicate skill manifest name",
          "Skill manifest frontmatter has nonstandard fields",
          "Skill description lacks trigger guidance",
          "Skill resource is not discoverable from SKILL.md",
          "Skill contains top-level auxiliary documentation",
        ]),
      );
      expect(result.duplicateSkillRisks.join(" ")).toContain("Duplicate skill manifest name");
      expect(result.manifestQualityRisks.join(" ")).toContain(
        "Skill description lacks trigger guidance",
      );
      expect(result.resourceDiscoveryRisks.join(" ")).toContain("helper.py");
      expect(result.auxiliaryDocRisks.join(" ")).toContain("README.md");
    } finally {
      await fs.rm(projectPath, { recursive: true, force: true });
    }
  });
});
