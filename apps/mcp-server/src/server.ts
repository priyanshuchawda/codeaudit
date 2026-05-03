#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  AuditCodeQualityInputSchema,
  AuditDocsClaimsInputSchema,
  AuditInstalledSkillsInputSchema,
  AuditNextjsSecurityInputSchema,
  AuditTestsInputSchema,
  DetectProjectInputSchema,
  GenerateIssuePlanInputSchema,
  GeneratePrPlanInputSchema,
  GenerateReportInputSchema,
  OfficialDocsRouterInputSchema,
  RouteSkillsInputSchema,
  ScanRepoInputSchema,
} from "./schemas/tool-inputs.js";
import {
  AuditTestsOutputSchema,
  CodeQualityAuditOutputSchema,
  DetectedProjectSchema,
  DocsClaimsAuditOutputSchema,
  GenerateReportOutputSchema,
  IssuePlanOutputSchema,
  NextjsSecurityAuditOutputSchema,
  OfficialDocsRouterOutputSchema,
  PrPlanOutputSchema,
  ScanRepoOutputSchema,
  SkillSupplyChainAuditOutputSchema,
  SkillRoutingManifestSchema,
} from "./schemas/tool-outputs.js";
import { auditCodeQualityTool } from "./tools/audit-code-quality.js";
import { auditDocsClaimsTool } from "./tools/audit-docs-claims.js";
import { auditInstalledSkillsTool } from "./tools/audit-installed-skills.js";
import { auditNextjsSecurityTool } from "./tools/audit-nextjs-security.js";
import { auditTestsTool } from "./tools/audit-tests.js";
import { detectProjectTool } from "./tools/detect-project.js";
import { generateIssuePlanTool } from "./tools/generate-issue-plan.js";
import { generatePrPlanTool } from "./tools/generate-pr-plan.js";
import { generateReportTool } from "./tools/generate-report.js";
import { officialDocsRouterTool } from "./tools/official-docs-router.js";
import { routeSkillsTool } from "./tools/route-skills.js";
import { scanRepoTool } from "./tools/scan-repo.js";
import { redactObject } from "./lib/redaction.js";

const server = new McpServer({
  name: "reposentinel-mcp",
  version: "0.1.0",
});

registerReadOnlyTool({
  name: "detect_project",
  title: "Detect Project",
  description:
    "Detect project state, stack, package manager, tests, auth, database, deployment, CI, and risk notes.",
  inputSchema: DetectProjectInputSchema,
  outputSchema: DetectedProjectSchema,
  handler: detectProjectTool,
});

registerReadOnlyTool({
  name: "route_skills",
  title: "Route Skills",
  description:
    "Return a skill-routing manifest with recommended skills, workflow, required outputs, instructions, and disallowed actions.",
  inputSchema: RouteSkillsInputSchema,
  outputSchema: SkillRoutingManifestSchema,
  handler: routeSkillsTool,
});

registerReadOnlyTool({
  name: "scan_repo",
  title: "Scan Repository",
  description:
    "Summarize a repository tree and classify important, risk, docs, test, and config files.",
  inputSchema: ScanRepoInputSchema,
  outputSchema: ScanRepoOutputSchema,
  handler: scanRepoTool,
});

registerReadOnlyTool({
  name: "audit_code_quality",
  title: "Audit Code Quality",
  description:
    "Find maintainability risks including long files, mixed responsibilities, missing tests, weak schema boundaries, and error-handling smells.",
  inputSchema: AuditCodeQualityInputSchema,
  outputSchema: CodeQualityAuditOutputSchema,
  handler: auditCodeQualityTool,
});

registerReadOnlyTool({
  name: "audit_nextjs_security",
  title: "Audit Next.js Security",
  description:
    "Audit Next.js middleware, route handlers, input validation, auth, rate limits, headers, env safety, logging, SSRF, redirects, and upload risks.",
  inputSchema: AuditNextjsSecurityInputSchema,
  outputSchema: NextjsSecurityAuditOutputSchema,
  handler: auditNextjsSecurityTool,
});

registerReadOnlyTool({
  name: "audit_docs_claims",
  title: "Audit Documentation Claims",
  description: "Extract strong README/docs claims and map them to evidence or missing evidence.",
  inputSchema: AuditDocsClaimsInputSchema,
  outputSchema: DocsClaimsAuditOutputSchema,
  handler: auditDocsClaimsTool,
});

registerReadOnlyTool({
  name: "audit_tests",
  title: "Audit Tests",
  description:
    "Detect test frameworks, test files, weak tests, missing areas, and recommended tests.",
  inputSchema: AuditTestsInputSchema,
  outputSchema: AuditTestsOutputSchema,
  handler: auditTestsTool,
});

registerReadOnlyTool({
  name: "audit_installed_skills",
  title: "Audit Installed Skills",
  description:
    "Audit local agent skills for supply-chain, prompt-injection, secret-leakage, dependency-install, webhook, destructive-shell, manifest-quality, duplicate-name, auxiliary-doc, and resource-discovery risks.",
  inputSchema: AuditInstalledSkillsInputSchema,
  outputSchema: SkillSupplyChainAuditOutputSchema,
  handler: auditInstalledSkillsTool,
});

registerReadOnlyTool({
  name: "official_docs_router",
  title: "Official Docs Router",
  description:
    "Route technology questions to preferred official docs sources and safe query guidance.",
  inputSchema: OfficialDocsRouterInputSchema,
  outputSchema: OfficialDocsRouterOutputSchema,
  handler: officialDocsRouterTool,
});

registerReadOnlyTool({
  name: "generate_issue_plan",
  title: "Generate Issue Plan",
  description:
    "Group findings into prioritized GitHub issue candidates with labels and branch names.",
  inputSchema: GenerateIssuePlanInputSchema,
  outputSchema: IssuePlanOutputSchema,
  handler: generateIssuePlanTool,
});

registerReadOnlyTool({
  name: "generate_pr_plan",
  title: "Generate PR Plan",
  description: "Create a scoped PR workflow from selected findings or an issue candidate.",
  inputSchema: GeneratePrPlanInputSchema,
  outputSchema: PrPlanOutputSchema,
  handler: generatePrPlanTool,
});

registerReadOnlyTool({
  name: "generate_report",
  title: "Generate Report",
  description:
    "Generate report markdown strings for audit, security, code quality, docs evidence, issue, and PR plan outputs.",
  inputSchema: GenerateReportInputSchema,
  outputSchema: GenerateReportOutputSchema,
  handler: generateReportTool,
});

type ToolDefinition<Input extends z.ZodTypeAny, Output extends z.ZodTypeAny> = {
  name: string;
  title: string;
  description: string;
  inputSchema: Input;
  outputSchema: Output;
  handler: (input: z.infer<Input>) => Promise<z.infer<Output>>;
};

function registerReadOnlyTool<
  Input extends z.ZodObject<z.ZodRawShape>,
  Output extends z.ZodTypeAny,
>(definition: ToolDefinition<Input, Output>): void {
  server.registerTool(
    definition.name,
    {
      title: definition.title,
      description: definition.description,
      inputSchema: definition.inputSchema.shape,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
    },
    async (input) => {
      try {
        const parsedInput = definition.inputSchema.parse(input);
        const output = definition.outputSchema.parse(await definition.handler(parsedInput));
        const safeOutput = redactObject(output);
        return {
          content: [{ type: "text", text: JSON.stringify(safeOutput, null, 2) }],
          structuredContent: safeOutput,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown RepoSentinel tool error";
        return {
          isError: true,
          content: [{ type: "text", text: `RepoSentinel error: ${message}` }],
        };
      }
    },
  );
}

const transport = new StdioServerTransport();
await server.connect(transport);
