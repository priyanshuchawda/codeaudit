import { z } from "zod";

export const SeveritySchema = z.enum(["critical", "high", "medium", "low", "info"]);
export const PrioritySchema = z.enum(["P0", "P1", "P2"]);
export const FindingCategorySchema = z.enum([
  "security",
  "code-quality",
  "docs",
  "testing",
  "workflow",
  "architecture",
]);

export const FindingSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: FindingCategorySchema,
  severity: SeveritySchema,
  file: z.string().optional(),
  line: z.number().int().positive().optional(),
  evidence: z.string(),
  recommendation: z.string(),
  confidence: z.number().min(0).max(1).default(0.7),
});

export type Severity = z.infer<typeof SeveritySchema>;
export type Priority = z.infer<typeof PrioritySchema>;
export type Finding = z.infer<typeof FindingSchema>;

export function severityToPriority(severity: Severity): Priority {
  if (severity === "critical" || severity === "high") return "P0";
  if (severity === "medium") return "P1";
  return "P2";
}
