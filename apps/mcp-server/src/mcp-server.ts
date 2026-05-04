import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { redactObject } from "./lib/redaction.js";
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
  SkillRoutingManifestSchema,
  SkillSupplyChainAuditOutputSchema,
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

type ToolDefinition<Input extends z.ZodTypeAny, Output extends z.ZodTypeAny> = {
  name: string;
  title: string;
  description: string;
  inputSchema: Input;
  outputSchema: Output;
  handler: (input: z.infer<Input>) => Promise<z.infer<Output>>;
};

export const SERVER_VERSION = "0.1.3";

export function createCodeAuditServer(): McpServer {
  const server = new McpServer(
    {
      name: "codeaudit",
      version: SERVER_VERSION,
    },
    {
      instructions:
        "Use CodeAudit to inspect local software projects, route to the right engineering skills, run read-only audits, and produce evidence-backed issue and PR plans. Start with detect_project, then route_skills. Follow workflowPhases, recommendedToolSequence, skillActivationOrder, and qualityGates before making project changes.",
    },
  );

  registerReadOnlyTool(server, {
    name: "detect_project",
    title: "Detect Project",
    description:
      "Detect project state, stack, package manager, tests, auth, database, deployment, CI, and risk notes.",
    inputSchema: DetectProjectInputSchema,
    outputSchema: DetectedProjectSchema,
    handler: detectProjectTool,
  });

  registerReadOnlyTool(server, {
    name: "route_skills",
    title: "Route Skills",
    description:
      "Return a skill-routing manifest with workflow phases, recommended tool sequence, skill activation order, quality gates, required outputs, instructions, and disallowed actions.",
    inputSchema: RouteSkillsInputSchema,
    outputSchema: SkillRoutingManifestSchema,
    handler: routeSkillsTool,
  });

  registerReadOnlyTool(server, {
    name: "scan_repo",
    title: "Scan Repository",
    description:
      "Summarize a repository tree and classify important, risk, docs, test, and config files.",
    inputSchema: ScanRepoInputSchema,
    outputSchema: ScanRepoOutputSchema,
    handler: scanRepoTool,
  });

  registerReadOnlyTool(server, {
    name: "audit_code_quality",
    title: "Audit Code Quality",
    description:
      "Find maintainability risks including long files, mixed responsibilities, missing tests, weak schema boundaries, and error-handling smells.",
    inputSchema: AuditCodeQualityInputSchema,
    outputSchema: CodeQualityAuditOutputSchema,
    handler: auditCodeQualityTool,
  });

  registerReadOnlyTool(server, {
    name: "audit_nextjs_security",
    title: "Audit Next.js Security",
    description:
      "Audit Next.js middleware, route handlers, input validation, auth, rate limits, headers, env safety, logging, SSRF, redirects, and upload risks.",
    inputSchema: AuditNextjsSecurityInputSchema,
    outputSchema: NextjsSecurityAuditOutputSchema,
    handler: auditNextjsSecurityTool,
  });

  registerReadOnlyTool(server, {
    name: "audit_docs_claims",
    title: "Audit Documentation Claims",
    description: "Extract strong README/docs claims and map them to evidence or missing evidence.",
    inputSchema: AuditDocsClaimsInputSchema,
    outputSchema: DocsClaimsAuditOutputSchema,
    handler: auditDocsClaimsTool,
  });

  registerReadOnlyTool(server, {
    name: "audit_tests",
    title: "Audit Tests",
    description:
      "Detect test frameworks, test files, weak tests, missing areas, and recommended tests.",
    inputSchema: AuditTestsInputSchema,
    outputSchema: AuditTestsOutputSchema,
    handler: auditTestsTool,
  });

  registerReadOnlyTool(server, {
    name: "audit_installed_skills",
    title: "Audit Installed Skills",
    description:
      "Audit local agent skills for supply-chain, prompt-injection, secret-leakage, dependency-install, webhook, destructive-shell, manifest-quality, duplicate-name, auxiliary-doc, and resource-discovery risks.",
    inputSchema: AuditInstalledSkillsInputSchema,
    outputSchema: SkillSupplyChainAuditOutputSchema,
    handler: auditInstalledSkillsTool,
  });

  registerReadOnlyTool(server, {
    name: "official_docs_router",
    title: "Official Docs Router",
    description:
      "Route technology questions to preferred official docs sources and safe query guidance.",
    inputSchema: OfficialDocsRouterInputSchema,
    outputSchema: OfficialDocsRouterOutputSchema,
    handler: officialDocsRouterTool,
  });

  registerReadOnlyTool(server, {
    name: "generate_issue_plan",
    title: "Generate Issue Plan",
    description:
      "Group findings into prioritized GitHub issue candidates with labels and branch names.",
    inputSchema: GenerateIssuePlanInputSchema,
    outputSchema: IssuePlanOutputSchema,
    handler: generateIssuePlanTool,
  });

  registerReadOnlyTool(server, {
    name: "generate_pr_plan",
    title: "Generate PR Plan",
    description: "Create a scoped PR workflow from selected findings or an issue candidate.",
    inputSchema: GeneratePrPlanInputSchema,
    outputSchema: PrPlanOutputSchema,
    handler: generatePrPlanTool,
  });

  registerReadOnlyTool(server, {
    name: "generate_report",
    title: "Generate Report",
    description:
      "Generate report markdown strings for audit, security, code quality, docs evidence, issue, and PR plan outputs.",
    inputSchema: GenerateReportInputSchema,
    outputSchema: GenerateReportOutputSchema,
    handler: generateReportTool,
  });

  registerServerResources(server);

  return server;
}

function registerServerResources(server: McpServer): void {
  server.registerResource(
    "codeaudit_docs_index",
    "codeaudit://docs/llms",
    {
      title: "CodeAudit Documentation Index",
      description: "Documentation index and recommended agent workflow for CodeAudit MCP.",
      mimeType: "text/markdown",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.toString(),
          mimeType: "text/markdown",
          text: [
            "# CodeAudit MCP Documentation Index",
            "",
            "Use this resource to discover CodeAudit's operating model before changing a project.",
            "",
            "## Core Docs",
            "",
            "- README.md: overview, setup, safety model, skills pack, and example workflow.",
            "- AGENTS.md: required read order, engineering rules, security rules, workflow, and Git rules.",
            "- TOOLS.md: allowed MCP tools, disallowed actions, and capability boundaries.",
            "- docs/clients.md: stdio and Streamable HTTP client setup.",
            "- docs/skill-routing-design.md: route_skills manifest fields and workflow intent.",
            "- docs/security-model.md and docs/threat-model.md: production safety model.",
            "",
            "## Required Agent Workflow",
            "",
            "1. Call detect_project on the target project.",
            "2. Call route_skills with the user task and detected project.",
            "3. Follow workflowPhases, recommendedToolSequence, skillActivationOrder, and qualityGates.",
            "4. Run relevant audits before edits in existing projects.",
            "5. Do not claim secure, production-ready, enterprise-grade, or fully tested without evidence.",
          ].join("\n"),
        },
      ],
    }),
  );

  server.registerResource(
    "codeaudit_skills_index",
    "codeaudit://skills/index",
    {
      title: "CodeAudit Skills Index",
      description: "Built-in CodeAudit skills and when agents should use them.",
      mimeType: "application/json",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.toString(),
          mimeType: "application/json",
          text: JSON.stringify(
            {
              publicSkill: "codeaudit",
              installCommand: "npx skills add priyanshuchawda/codeaudit --skill codeaudit",
              skills: [
                "codeaudit",
                "codeaudit-orchestrator",
                "python-backend-quality",
                "python-mcp-server-quality",
                "enterprise-code-quality",
                "nextjs-security-review",
                "ai-app-security-review",
                "docs-claims-evidence-review",
                "refactor-with-tests",
                "github-issue-pr-workflow",
                "official-docs-grounding",
                "skill-supply-chain-auditor",
              ],
              rule: "Use route_skills to select the right subset and activation order for the user's task.",
            },
            null,
            2,
          ),
        },
      ],
    }),
  );
}

function registerReadOnlyTool<
  Input extends z.ZodObject<z.ZodRawShape>,
  Output extends z.ZodTypeAny,
>(server: McpServer, definition: ToolDefinition<Input, Output>): void {
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
        idempotentHint: true,
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
        const message = error instanceof Error ? error.message : "Unknown CodeAudit tool error";
        return {
          isError: true,
          content: [{ type: "text", text: `CodeAudit error: ${message}` }],
        };
      }
    },
  );
}
