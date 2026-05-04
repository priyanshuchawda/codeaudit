import type { GeneratePrPlanInput } from "../schemas/tool-inputs.js";
import { slugify } from "../lib/markdown.js";

export async function generatePrPlanTool(input: GeneratePrPlanInput) {
  const findings = input.selectedIssue?.findings?.length
    ? input.selectedIssue.findings
    : input.findings;
  const title = input.selectedIssue?.title ?? findings[0]?.title ?? "CodeAudit scoped improvement";
  const priority = input.selectedIssue?.priority ?? "P1";
  const category = findings[0]?.category ?? "workflow";
  const files = [
    ...new Set(
      findings.map((finding) => finding.file).filter((file): file is string => Boolean(file)),
    ),
  ];

  return {
    branchName: `${branchPrefix(category)}/${slugify(`${priority}-${title}`)}`,
    steps: [
      "Confirm issue scope and acceptance criteria.",
      "Create a clean branch from the current base branch.",
      "Make the smallest scoped change that resolves the selected findings.",
      "Add or update tests for the behavior/security boundary.",
      "Update docs when behavior, setup, architecture, or claims change.",
      "Run relevant verification commands.",
      "Open a PR that links the issue and lists tests, security impact, and docs impact.",
    ],
    filesLikelyToChange: files,
    testsToRun: recommendedTests(category),
    docsToUpdate: docsFor(category),
    prTitle: title.replace(/^P[0-2]:\s*/, ""),
    prBodyTemplate: [
      "## Linked issue",
      "Closes #<issue-number>",
      "",
      "## Summary",
      "- ",
      "",
      "## Tests run",
      "- ",
      "",
      "## Security impact",
      "- ",
      "",
      "## Docs impact",
      "- ",
    ].join("\n"),
  };
}

function branchPrefix(category: string): string {
  if (category === "docs") return "docs";
  if (category === "code-quality" || category === "architecture") return "refactor";
  return "fix";
}

function recommendedTests(category: string): string[] {
  if (category === "docs") return ["docs claim audit tests", "markdown lint/manual review"];
  if (category === "security")
    return ["unit tests for validation/auth boundary", "security regression tests"];
  return ["unit tests", "typecheck"];
}

function docsFor(category: string): string[] {
  if (category === "security")
    return ["SECURITY_REVIEW.md", "docs/threat-model.md if architecture changed"];
  if (category === "docs") return ["README.md", "DOCS_CLAIMS_EVIDENCE_MAP.md"];
  return ["README.md if public behavior changed", "architecture docs if module boundaries changed"];
}
