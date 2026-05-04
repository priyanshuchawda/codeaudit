import { isTestFile } from "../lib/file-classifier.js";
import { detectProject } from "../lib/project-detectors.js";
import { listFiles, readTextFile, resolveProjectRoot } from "../lib/safe-fs.js";
import type { AuditTestsInput } from "../schemas/tool-inputs.js";

export async function auditTestsTool(input: AuditTestsInput) {
  const root = await resolveProjectRoot(input.projectPath);
  const detected = await detectProject(root);
  const { files } = await listFiles(root, { maxDepth: 8 });
  const testFiles = files
    .filter((file) => isTestFile(file.relativePath))
    .map((file) => file.relativePath);
  const weakTests: string[] = [];

  for (const file of testFiles.slice(0, 120)) {
    const text = await readTextFile(root, file);
    if (!/expect\(|assert|toEqual|toBe|toContain|toThrow/.test(text)) {
      weakTests.push(`${file}: no obvious assertions.`);
    }
  }

  const missingTestAreas: string[] = [];
  if (
    detected.framework === "nextjs" &&
    !testFiles.some((file) => file.includes("api") || file.includes("route"))
  ) {
    missingTestAreas.push("API route handler tests");
  }
  if (detected.auth && !testFiles.some((file) => file.toLowerCase().includes("auth"))) {
    missingTestAreas.push("auth/authorization tests");
  }
  if (
    !testFiles.some(
      (file) => file.toLowerCase().includes("redact") || file.toLowerCase().includes("secret"),
    )
  ) {
    missingTestAreas.push("secret redaction/security utility tests");
  }

  return {
    testFrameworks: detected.testFrameworks,
    testFiles,
    missingTestAreas,
    weakTests,
    recommendedTests: missingTestAreas.map((area) => `Add focused ${area}.`),
  };
}
