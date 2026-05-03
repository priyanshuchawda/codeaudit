import { severityToPriority, type Finding } from "../schemas/findings.js";
import type { GenerateIssuePlanInput } from "../schemas/tool-inputs.js";
import { slugify } from "../lib/markdown.js";

export async function generateIssuePlanTool(input: GenerateIssuePlanInput) {
  const groups = new Map<string, Finding[]>();
  for (const finding of input.findings) {
    const priority = severityToPriority(finding.severity);
    const key = `${priority}:${finding.category}:${finding.title}`;
    groups.set(key, [...(groups.get(key) ?? []), finding]);
  }

  const issues = [...groups.entries()].map(([key, findings]) => {
    const [priority, category] = key.split(":");
    const first = findings[0];
    const title = `${priority}: ${first.title}`;
    return {
      title,
      priority: priority as "P0" | "P1" | "P2",
      severity: first.severity,
      labels: [...new Set([category, first.severity, "reposentinel"])],
      suggestedBranchName: `${branchPrefix(category)}/${slugify(title)}`,
      findings,
    };
  });

  return {
    issues: issues.sort((a, b) => a.priority.localeCompare(b.priority)),
  };
}

function branchPrefix(category: string): string {
  if (category === "docs") return "docs";
  if (category === "code-quality" || category === "architecture") return "refactor";
  return "fix";
}
