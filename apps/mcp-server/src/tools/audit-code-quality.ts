import { isCodeFile, isTestFile } from "../lib/file-classifier.js";
import { listFiles, readTextFile, resolveProjectRoot } from "../lib/safe-fs.js";
import type { Finding } from "../schemas/findings.js";
import type { AuditCodeQualityInput } from "../schemas/tool-inputs.js";

export async function auditCodeQualityTool(input: AuditCodeQualityInput) {
  const root = await resolveProjectRoot(input.projectPath);
  const { files } = await listFiles(root, { maxDepth: 8 });
  const codeFiles = files.filter((file) => isCodeFile(file.relativePath));
  const testFiles = files.filter((file) => isTestFile(file.relativePath));
  const findings: Finding[] = [];
  const longFileCandidates: string[] = [];
  const mixedResponsibilityCandidates: string[] = [];
  const missingTests: string[] = [];
  const weakTypingOrSchemaBoundaries: string[] = [];
  const longFileLimit = input.strictness === "strict" ? 250 : 350;

  for (const file of codeFiles) {
    if (file.size > 500_000) continue;
    const text = await readTextFile(root, file.relativePath);
    const lines = text.split(/\r?\n/);
    if (lines.length > longFileLimit) {
      longFileCandidates.push(file.relativePath);
      findings.push({
        id: `code-quality-long-file-${slug(file.relativePath)}`,
        title: "Long file candidate",
        category: "code-quality",
        severity: input.strictness === "strict" ? "medium" : "low",
        file: file.relativePath,
        evidence: `${file.relativePath} has ${lines.length} lines.`,
        recommendation:
          "Split the file around cohesive responsibilities and preserve behavior with focused tests.",
        confidence: 0.8,
      });
    }

    const hasUi = /from ["']react["']|jsx|tsx|use client/.test(text);
    const hasData = /prisma|drizzle|sql|fetch\(|db\.|createClient/.test(text);
    const hasAuth = /auth|session|permission|role|userId/.test(text);
    if ([hasUi, hasData, hasAuth].filter(Boolean).length >= 2 && lines.length > 120) {
      mixedResponsibilityCandidates.push(file.relativePath);
    }

    if (
      /app\/api\/.*route\.[tj]s$|pages\/api\/.*\.[tj]s$/.test(file.relativePath) &&
      !/zod|safeParse|parse\(|valibot|yup/.test(text)
    ) {
      weakTypingOrSchemaBoundaries.push(file.relativePath);
      findings.push({
        id: `code-quality-schema-boundary-${slug(file.relativePath)}`,
        title: "Weak input schema boundary",
        category: "code-quality",
        severity: "medium",
        file: file.relativePath,
        evidence: "API boundary file does not show schema validation keywords.",
        recommendation: "Add explicit request parsing and schema validation at the API boundary.",
        confidence: 0.72,
      });
    }

    if (
      /catch\s*\([^)]*\)\s*{\s*}/.test(text) ||
      /catch\s*\([^)]*\)\s*{\s*return\s+null/.test(text)
    ) {
      findings.push({
        id: `code-quality-error-handling-${slug(file.relativePath)}`,
        title: "Weak error handling",
        category: "code-quality",
        severity: "low",
        file: file.relativePath,
        evidence: "Catch block appears to swallow errors or return null without context.",
        recommendation:
          "Return typed errors or log redacted diagnostic context at a controlled boundary.",
        confidence: 0.65,
      });
    }
  }

  if (codeFiles.length > 0 && testFiles.length === 0) {
    missingTests.push("No test files were detected for the codebase.");
    findings.push({
      id: "code-quality-missing-tests",
      title: "Missing test coverage baseline",
      category: "testing",
      severity: "medium",
      evidence: "No *.test.* or *.spec.* files were found.",
      recommendation:
        "Add focused tests for detection, security-sensitive boundaries, and changed behavior.",
      confidence: 0.9,
    });
  }

  const score = Math.max(0, 100 - findings.length * 8 - longFileCandidates.length * 3);
  return {
    findings,
    longFileCandidates,
    mixedResponsibilityCandidates,
    missingTests,
    weakTypingOrSchemaBoundaries,
    maintainabilityScore: score,
  };
}

function slug(value: string): string {
  return value
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}
