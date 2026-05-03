import { isConfigFile, isDocFile, isRiskFile, isTestFile } from "../lib/file-classifier.js";
import { listFiles, resolveProjectRoot } from "../lib/safe-fs.js";
import type { ScanRepoInput } from "../schemas/tool-inputs.js";

export async function scanRepoTool(input: ScanRepoInput) {
  const root = await resolveProjectRoot(input.projectPath);
  const { files, skipped } = await listFiles(root, {
    maxDepth: input.maxDepth,
    includePatterns: input.includePatterns,
    excludePatterns: input.excludePatterns,
  });

  const paths = files.map((file) => file.relativePath);
  return {
    summarizedTree: summarizeTree(paths),
    importantFiles: paths.filter((file) => isConfigFile(file) || file === "README.md").slice(0, 80),
    riskFiles: paths.filter(isRiskFile).slice(0, 80),
    docsFiles: paths.filter(isDocFile).slice(0, 80),
    testFiles: paths.filter(isTestFile).slice(0, 80),
    configFiles: paths.filter(isConfigFile).slice(0, 80),
    skipped,
  };
}

function summarizeTree(paths: string[]): string[] {
  const summary = new Set<string>();
  for (const file of paths) {
    const parts = file.split("/");
    if (parts.length === 1) summary.add(file);
    else if (parts.length === 2) summary.add(`${parts[0]}/${parts[1]}`);
    else summary.add(`${parts[0]}/${parts[1]}/...`);
  }
  return [...summary].sort().slice(0, 160);
}
