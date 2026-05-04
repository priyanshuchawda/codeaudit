import { isDocFile } from "../lib/file-classifier.js";
import { listFiles, readTextFile, resolveProjectRoot } from "../lib/safe-fs.js";
import type { AuditDocsClaimsInput } from "../schemas/tool-inputs.js";
import type { DocsClaim } from "../schemas/tool-outputs.js";

const CLAIM_RULES = [
  {
    pattern: /\b(secure|security-first|hardened)\b/i,
    strength: "strong" as const,
    evidence: ["middleware", "rateLimit", "headers", "auth", "test", "threat-model"],
  },
  {
    pattern: /\bproduction[- ]ready\b/i,
    strength: "strong" as const,
    evidence: ["deploy", "env", "test", "error", "observability"],
  },
  {
    pattern: /\benterprise[- ]grade\b/i,
    strength: "strong" as const,
    evidence: ["policy", "audit", "security", "test", "ci"],
  },
  {
    pattern: /\bfully tested\b/i,
    strength: "strong" as const,
    evidence: ["test", "coverage", "vitest", "playwright"],
  },
  {
    pattern: /\bscalable|robust|reliable\b/i,
    strength: "moderate" as const,
    evidence: ["test", "error", "deploy"],
  },
];

export async function auditDocsClaimsTool(input: AuditDocsClaimsInput) {
  const root = await resolveProjectRoot(input.projectPath);
  const { files } = await listFiles(root, { maxDepth: 8 });
  const docFiles = files.filter((file) => isDocFile(file.relativePath));
  const corpusIndex = await buildCorpusIndex(
    root,
    files.map((file) => file.relativePath),
  );
  const claims: DocsClaim[] = [];

  for (const file of docFiles) {
    if (!/(^README\.md$|^docs\/|\.mdx?$)/i.test(file.relativePath)) continue;
    const text = await readTextFile(root, file.relativePath);
    const sentences = text
      .replace(/\n+/g, " ")
      .split(/(?<=[.!?])\s+/)
      .map((sentence) => sentence.trim())
      .filter(Boolean);

    for (const sentence of sentences) {
      for (const rule of CLAIM_RULES) {
        if (!rule.pattern.test(sentence)) continue;
        const evidenceFound = rule.evidence.filter((keyword) =>
          corpusIndex.includes(keyword.toLowerCase()),
        );
        const evidenceMissing = rule.evidence.filter((keyword) => !evidenceFound.includes(keyword));
        claims.push({
          claim: sentence.slice(0, 500),
          sourceDocFile: file.relativePath,
          claimStrength: rule.strength,
          evidenceFound,
          evidenceMissing,
          recommendation: recommendation(
            rule.strength,
            evidenceFound.length,
            evidenceMissing.length,
          ),
        });
        break;
      }
    }
  }

  return { claims };
}

async function buildCorpusIndex(root: string, paths: string[]): Promise<string> {
  const searchable = paths
    .filter((file) => /\.(md|mdx|ts|tsx|js|jsx|json|yml|yaml)$/i.test(file))
    .slice(0, 500);
  const chunks: string[] = [...searchable];
  for (const file of searchable) {
    try {
      chunks.push((await readTextFile(root, file, 80_000)).toLowerCase());
    } catch {
      continue;
    }
  }
  return chunks.join("\n").toLowerCase();
}

function recommendation(
  strength: "weak" | "moderate" | "strong",
  evidenceFound: number,
  evidenceMissing: number,
): "keep" | "weaken" | "remove" | "add-evidence" {
  if (evidenceMissing === 0) return "keep";
  if (evidenceFound >= 2) return "add-evidence";
  if (strength === "strong") return "weaken";
  return "remove";
}
