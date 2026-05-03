import { z } from "zod";
import { FindingSchema, PrioritySchema } from "./findings.js";

export const ProjectStateSchema = z.enum(["empty", "existing"]);

export const DetectedProjectSchema = z.object({
  state: ProjectStateSchema,
  framework: z.string().nullable(),
  router: z.string().nullable(),
  packageManager: z.string().nullable(),
  language: z.string().nullable(),
  appType: z.string().nullable(),
  testFrameworks: z.array(z.string()),
  auth: z.string().nullable(),
  database: z.string().nullable(),
  deployment: z.string().nullable(),
  ci: z.array(z.string()),
  riskNotes: z.array(z.string()),
});

export const SkillRecommendationSchema = z.object({
  skill: z.string(),
  reason: z.string(),
  required: z.boolean(),
});

export const SkillRoutingManifestSchema = z.object({
  projectState: ProjectStateSchema,
  task: z.string(),
  riskLevel: z.enum(["low", "medium", "high"]),
  recommendedSkills: z.array(SkillRecommendationSchema),
  requiredWorkflow: z.string(),
  requiredOutputs: z.array(z.string()),
  strictAgentInstructions: z.array(z.string()),
  disallowedActions: z.array(z.string()),
});

export const ScanRepoOutputSchema = z.object({
  summarizedTree: z.array(z.string()),
  importantFiles: z.array(z.string()),
  riskFiles: z.array(z.string()),
  docsFiles: z.array(z.string()),
  testFiles: z.array(z.string()),
  configFiles: z.array(z.string()),
  skipped: z.array(z.string()),
});

export const CodeQualityAuditOutputSchema = z.object({
  findings: z.array(FindingSchema),
  longFileCandidates: z.array(z.string()),
  mixedResponsibilityCandidates: z.array(z.string()),
  missingTests: z.array(z.string()),
  weakTypingOrSchemaBoundaries: z.array(z.string()),
  maintainabilityScore: z.number().min(0).max(100),
});

export const NextjsSecurityAuditOutputSchema = z.object({
  findings: z.array(FindingSchema),
  routeHandlerRisks: z.array(z.string()),
  middlewareRisks: z.array(z.string()),
  authRisks: z.array(z.string()),
  rateLimitGaps: z.array(z.string()),
  securityHeaderGaps: z.array(z.string()),
  envSecretRisks: z.array(z.string()),
  unsafeLoggingRisks: z.array(z.string()),
  ssrfOpenRedirectFileUploadRisks: z.array(z.string()),
});

export const DocsClaimSchema = z.object({
  claim: z.string(),
  sourceDocFile: z.string(),
  claimStrength: z.enum(["weak", "moderate", "strong"]),
  evidenceFound: z.array(z.string()),
  evidenceMissing: z.array(z.string()),
  recommendation: z.enum(["keep", "weaken", "remove", "add-evidence"]),
});

export const DocsClaimsAuditOutputSchema = z.object({
  claims: z.array(DocsClaimSchema),
});

export const AuditTestsOutputSchema = z.object({
  testFrameworks: z.array(z.string()),
  testFiles: z.array(z.string()),
  missingTestAreas: z.array(z.string()),
  weakTests: z.array(z.string()),
  recommendedTests: z.array(z.string()),
});

export const OfficialDocsRouterOutputSchema = z.object({
  preferredDocsSource: z.string(),
  queryGuidance: z.array(z.string()),
  safetyWarning: z.string(),
});

export const IssueSchema = z.object({
  title: z.string(),
  priority: PrioritySchema,
  severity: z.string(),
  labels: z.array(z.string()),
  suggestedBranchName: z.string(),
  findings: z.array(FindingSchema),
});

export const IssuePlanOutputSchema = z.object({
  issues: z.array(IssueSchema),
});

export const PrPlanOutputSchema = z.object({
  branchName: z.string(),
  steps: z.array(z.string()),
  filesLikelyToChange: z.array(z.string()),
  testsToRun: z.array(z.string()),
  docsToUpdate: z.array(z.string()),
  prTitle: z.string(),
  prBodyTemplate: z.string(),
});

export const GeneratedReportSchema = z.object({
  fileName: z.string(),
  markdown: z.string(),
});

export const GenerateReportOutputSchema = z.object({
  reports: z.array(GeneratedReportSchema),
});

export type DetectedProject = z.infer<typeof DetectedProjectSchema>;
export type SkillRoutingManifest = z.infer<typeof SkillRoutingManifestSchema>;
export type ScanRepoOutput = z.infer<typeof ScanRepoOutputSchema>;
export type DocsClaim = z.infer<typeof DocsClaimSchema>;
export type Issue = z.infer<typeof IssueSchema>;
