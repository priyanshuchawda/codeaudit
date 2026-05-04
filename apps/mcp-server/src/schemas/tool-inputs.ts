import { z } from "zod";
import { FindingSchema } from "./findings.js";

export const StrictnessSchema = z.enum(["standard", "strict"]).default("standard");

export const DetectProjectInputSchema = z.object({
  projectPath: z.string().min(1).describe("Absolute or relative path to the project root."),
});

export const RouteSkillsInputSchema = z.object({
  projectPath: z.string().min(1).describe("Absolute or relative path to the project root."),
  userTask: z.string().min(1).describe("The user's requested project task."),
  detectedProject: z.unknown().optional().describe("Optional detect_project output."),
});

export const ScanRepoInputSchema = z.object({
  projectPath: z.string().min(1).describe("Absolute or relative path to the project root."),
  maxDepth: z
    .number()
    .int()
    .min(1)
    .max(12)
    .default(5)
    .describe("Maximum directory depth to traverse."),
  includePatterns: z
    .array(z.string())
    .default([])
    .describe("Optional simple path patterns to include."),
  excludePatterns: z
    .array(z.string())
    .default([])
    .describe("Optional simple path patterns to exclude."),
});

export const AuditCodeQualityInputSchema = z.object({
  projectPath: z.string().min(1).describe("Absolute or relative path to the project root."),
  strictness: StrictnessSchema.describe("Audit strictness level."),
});

export const AuditNextjsSecurityInputSchema = z.object({
  projectPath: z.string().min(1).describe("Absolute or relative path to the project root."),
  strictness: StrictnessSchema.describe("Audit strictness level."),
});

export const AuditDocsClaimsInputSchema = z.object({
  projectPath: z.string().min(1).describe("Absolute or relative path to the project root."),
});

export const AuditTestsInputSchema = z.object({
  projectPath: z.string().min(1).describe("Absolute or relative path to the project root."),
});

export const AuditInstalledSkillsInputSchema = z.object({
  projectPath: z.string().min(1).describe("Absolute or relative path to the project root."),
  skillsPath: z
    .string()
    .min(1)
    .default("skills")
    .describe("Project-relative path to the skills directory to audit."),
  strictness: StrictnessSchema.describe("Audit strictness level."),
});

export const OfficialDocsRouterInputSchema = z.object({
  technology: z.string().min(1).describe("Technology or framework name."),
  topic: z.string().min(1).describe("Question, API, or topic that needs official documentation."),
  version: z.string().optional().describe("Optional version string when known."),
});

export const GenerateIssuePlanInputSchema = z.object({
  findings: z.array(FindingSchema).describe("Findings to group into issue candidates."),
});

export const GeneratePrPlanInputSchema = z.object({
  selectedIssue: z
    .object({
      title: z.string().describe("Issue title."),
      priority: z.enum(["P0", "P1", "P2"]).describe("Issue priority."),
      labels: z.array(z.string()).default([]).describe("Issue labels."),
      findings: z.array(FindingSchema).default([]).describe("Findings attached to the issue."),
    })
    .optional()
    .describe("Optional selected issue candidate to turn into a PR plan."),
  findings: z
    .array(FindingSchema)
    .default([])
    .describe("Findings to use when no selected issue is supplied."),
});

export const GenerateReportInputSchema = z.object({
  findings: z.array(FindingSchema).describe("Findings to render into markdown reports."),
  projectMetadata: z
    .record(z.unknown())
    .default({})
    .describe("Project metadata to include in the audit report."),
});

export type DetectProjectInput = z.infer<typeof DetectProjectInputSchema>;
export type RouteSkillsInput = z.infer<typeof RouteSkillsInputSchema>;
export type ScanRepoInput = z.infer<typeof ScanRepoInputSchema>;
export type AuditCodeQualityInput = z.infer<typeof AuditCodeQualityInputSchema>;
export type AuditNextjsSecurityInput = z.infer<typeof AuditNextjsSecurityInputSchema>;
export type AuditDocsClaimsInput = z.infer<typeof AuditDocsClaimsInputSchema>;
export type AuditTestsInput = z.infer<typeof AuditTestsInputSchema>;
export type AuditInstalledSkillsInput = z.infer<typeof AuditInstalledSkillsInputSchema>;
export type OfficialDocsRouterInput = z.infer<typeof OfficialDocsRouterInputSchema>;
export type GenerateIssuePlanInput = z.infer<typeof GenerateIssuePlanInputSchema>;
export type GeneratePrPlanInput = z.infer<typeof GeneratePrPlanInputSchema>;
export type GenerateReportInput = z.infer<typeof GenerateReportInputSchema>;
