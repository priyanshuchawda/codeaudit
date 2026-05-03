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
  maxDepth: z.number().int().min(1).max(12).default(5),
  includePatterns: z.array(z.string()).default([]),
  excludePatterns: z.array(z.string()).default([]),
});

export const AuditCodeQualityInputSchema = z.object({
  projectPath: z.string().min(1),
  strictness: StrictnessSchema,
});

export const AuditNextjsSecurityInputSchema = z.object({
  projectPath: z.string().min(1),
  strictness: StrictnessSchema,
});

export const AuditDocsClaimsInputSchema = z.object({
  projectPath: z.string().min(1),
});

export const AuditTestsInputSchema = z.object({
  projectPath: z.string().min(1),
});

export const OfficialDocsRouterInputSchema = z.object({
  technology: z.string().min(1),
  topic: z.string().min(1),
  version: z.string().optional(),
});

export const GenerateIssuePlanInputSchema = z.object({
  findings: z.array(FindingSchema),
});

export const GeneratePrPlanInputSchema = z.object({
  selectedIssue: z
    .object({
      title: z.string(),
      priority: z.enum(["P0", "P1", "P2"]),
      labels: z.array(z.string()).default([]),
      findings: z.array(FindingSchema).default([]),
    })
    .optional(),
  findings: z.array(FindingSchema).default([]),
});

export const GenerateReportInputSchema = z.object({
  findings: z.array(FindingSchema),
  projectMetadata: z.record(z.unknown()).default({}),
});

export type DetectProjectInput = z.infer<typeof DetectProjectInputSchema>;
export type RouteSkillsInput = z.infer<typeof RouteSkillsInputSchema>;
export type ScanRepoInput = z.infer<typeof ScanRepoInputSchema>;
export type AuditCodeQualityInput = z.infer<typeof AuditCodeQualityInputSchema>;
export type AuditNextjsSecurityInput = z.infer<typeof AuditNextjsSecurityInputSchema>;
export type AuditDocsClaimsInput = z.infer<typeof AuditDocsClaimsInputSchema>;
export type AuditTestsInput = z.infer<typeof AuditTestsInputSchema>;
export type OfficialDocsRouterInput = z.infer<typeof OfficialDocsRouterInputSchema>;
export type GenerateIssuePlanInput = z.infer<typeof GenerateIssuePlanInputSchema>;
export type GeneratePrPlanInput = z.infer<typeof GeneratePrPlanInputSchema>;
export type GenerateReportInput = z.infer<typeof GenerateReportInputSchema>;
