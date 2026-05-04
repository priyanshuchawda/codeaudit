import type { GenerateReportInput } from "../schemas/tool-inputs.js";
import { bullet, heading, table } from "../lib/markdown.js";

export async function generateReportTool(input: GenerateReportInput) {
  const findings = input.findings;
  const rows = findings.map((finding) => [
    finding.severity,
    finding.category,
    finding.file ?? "n/a",
    finding.title,
    finding.recommendation,
  ]);

  const auditReport = [
    heading(1, "CodeAudit Audit Report"),
    "",
    heading(2, "Project Metadata"),
    "```json",
    JSON.stringify(input.projectMetadata, null, 2),
    "```",
    "",
    heading(2, "Findings"),
    table(["Severity", "Category", "File", "Title", "Recommendation"], rows),
  ].join("\n");

  return {
    reports: [
      { fileName: "AUDIT_REPORT.md", markdown: auditReport },
      {
        fileName: "SECURITY_REVIEW.md",
        markdown: sectionReport(
          "Security Review",
          findings.filter((finding) => finding.category === "security"),
        ),
      },
      {
        fileName: "CODE_QUALITY_REVIEW.md",
        markdown: sectionReport(
          "Code Quality Review",
          findings.filter(
            (finding) => finding.category === "code-quality" || finding.category === "architecture",
          ),
        ),
      },
      {
        fileName: "DOCS_CLAIMS_EVIDENCE_MAP.md",
        markdown: sectionReport(
          "Docs Claims Evidence Map",
          findings.filter((finding) => finding.category === "docs"),
        ),
      },
      {
        fileName: "ISSUES.md",
        markdown: [
          heading(1, "Issue Candidates"),
          "",
          bullet(findings.map((finding) => `${finding.severity}: ${finding.title}`)),
        ].join("\n"),
      },
      {
        fileName: "PR_PLAN.md",
        markdown: [
          heading(1, "PR Plan"),
          "",
          "Use generate_pr_plan for scoped branch, test, docs, and PR body details for selected findings.",
        ].join("\n"),
      },
    ],
  };
}

function sectionReport(title: string, findings: GenerateReportInput["findings"]): string {
  if (findings.length === 0)
    return [heading(1, title), "", "No findings produced for this category."].join("\n");
  return [
    heading(1, title),
    "",
    ...findings.flatMap((finding) => [
      heading(2, finding.title),
      "",
      `Severity: ${finding.severity}`,
      "",
      `Evidence: ${finding.evidence}`,
      "",
      `Recommendation: ${finding.recommendation}`,
      "",
    ]),
  ].join("\n");
}
