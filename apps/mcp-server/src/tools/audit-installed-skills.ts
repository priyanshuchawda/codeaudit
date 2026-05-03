import { promises as fs } from "node:fs";
import path from "node:path";
import { listFiles, readTextFile, resolveProjectRoot, safeJoin } from "../lib/safe-fs.js";
import type { Finding } from "../schemas/findings.js";
import type { AuditInstalledSkillsInput } from "../schemas/tool-inputs.js";

type RiskPattern = {
  id: string;
  title: string;
  severity: Finding["severity"];
  bucket: "suspiciousCommands" | "secretAccessRequests" | "externalNetworkRisks" | "destructiveOperationRisks";
  recommendation: string;
  pattern: RegExp;
};

const RISK_PATTERNS: RiskPattern[] = [
  {
    id: "curl-pipe-shell",
    title: "Remote script piped into shell",
    severity: "high",
    bucket: "suspiciousCommands",
    recommendation: "Require a pinned, reviewed script or replace the bootstrap command with explicit audited steps.",
    pattern: /\b(curl|wget|iwr|Invoke-WebRequest)\b[^\n|]*(\||;)[^\n]*(bash|sh|pwsh|powershell|iex|Invoke-Expression)\b/i,
  },
  {
    id: "unknown-package-install",
    title: "Skill asks to install dependencies",
    severity: "medium",
    bucket: "suspiciousCommands",
    recommendation: "Review package provenance, pin versions, and move deterministic installs into a documented project setup step.",
    pattern: /\b(npm|pnpm|yarn|bun)\s+(install|add|i)\b|\bpip\s+install\b|\buv\s+pip\s+install\b|\bcargo\s+install\b|\bbrew\s+install\b/i,
  },
  {
    id: "secret-access-request",
    title: "Skill requests secret access",
    severity: "high",
    bucket: "secretAccessRequests",
    recommendation: "Do not allow skills to read or print raw secrets; require scoped env names and redacted validation only.",
    pattern: /\b(read|dump|print|show|send|upload|copy|exfiltrate|get)\b[^\n]*(\.env|secret|token|api[-_ ]?key|credential|cookie|jwt|private[-_ ]?key)/i,
  },
  {
    id: "secret-network-exfiltration",
    title: "Secret-like data may be sent over the network",
    severity: "critical",
    bucket: "externalNetworkRisks",
    recommendation: "Quarantine the skill until the network send is removed or constrained to a trusted, documented endpoint.",
    pattern: /(\.env|secret|token|api[-_ ]?key|credential|cookie|jwt|private[-_ ]?key)[^\n]*(fetch|curl|https?:\/\/|post|send|upload|exfiltrate)/i,
  },
  {
    id: "webhook-or-paste-exfiltration",
    title: "Skill references a risky external sink",
    severity: "high",
    bucket: "externalNetworkRisks",
    recommendation: "Remove webhook or paste-site output unless it is explicitly approved and documented for this project.",
    pattern:
      /\b(send|post|upload|exfiltrate|forward|curl|fetch)\b[^\n]*(webhook|discord(?:app)?\.com\/api\/webhooks|requestbin|webhook\.site|pastebin|hastebin|ngrok|tunnel)|https?:\/\/[^\s]*(discord(?:app)?\.com\/api\/webhooks|requestbin|webhook\.site|pastebin|hastebin|ngrok)/i,
  },
  {
    id: "destructive-shell-command",
    title: "Skill includes destructive shell command",
    severity: "high",
    bucket: "destructiveOperationRisks",
    recommendation: "Replace destructive commands with scoped, reviewed file operations and explicit approval gates.",
    pattern: /\brm\s+-rf\b|\bRemove-Item\b[^\n]*-(Recurse|r)\b|\bdel\s+\/[fsq]\b|\bgit\s+reset\s+--hard\b|\bgit\s+clean\s+-fd\b/i,
  },
  {
    id: "instruction-override",
    title: "Skill attempts to override higher-priority instructions",
    severity: "high",
    bucket: "suspiciousCommands",
    recommendation: "Remove hidden authority claims; skills must operate below system, developer, user, and project instructions.",
    pattern: /\b(ignore|override|bypass)\b[^\n]*(system|developer|user|previous|higher[- ]priority|approval|sandbox|policy|instructions)/i,
  },
  {
    id: "hidden-behavior",
    title: "Skill asks to hide behavior from the user",
    severity: "high",
    bucket: "suspiciousCommands",
    recommendation: "Reject skills that require hidden behavior; all risky actions must be visible and approved.",
    pattern: /\b(do not tell|don't tell|hide this|secretly|silently|without notifying|without asking)\b/i,
  },
  {
    id: "remote-mutation",
    title: "Skill may mutate remote systems",
    severity: "medium",
    bucket: "destructiveOperationRisks",
    recommendation: "Gate remote mutation behind explicit user approval and a narrow task-specific workflow.",
    pattern: /\b(git\s+push|gh\s+pr\s+merge|gh\s+release|vercel\s+deploy|firebase\s+deploy|supabase\s+db\s+push)\b/i,
  },
  {
    id: "persistence-or-permission-change",
    title: "Skill may change persistence or permissions",
    severity: "medium",
    bucket: "destructiveOperationRisks",
    recommendation: "Avoid global persistence and permission changes from skills unless the user explicitly requested setup.",
    pattern: /\b(chmod\s+\+x|Set-ExecutionPolicy|crontab|schtasks|startup|profile\.ps1|\.bashrc|\.zshrc|credential-helper)\b/i,
  },
];

export async function auditInstalledSkillsTool(input: AuditInstalledSkillsInput) {
  const root = await resolveProjectRoot(input.projectPath);
  const normalizedSkillsPath = input.skillsPath.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
  const skillsRoot = safeJoin(root, normalizedSkillsPath);
  const stat = await fs.stat(skillsRoot).catch(() => null);

  if (!stat?.isDirectory()) {
    return emptyResult([
      {
        id: "skills-root-missing",
        title: "Skills directory not found",
        category: "security",
        severity: "info",
        evidence: `No skills directory exists at ${normalizedSkillsPath}.`,
        recommendation: "Create a skills directory before running a skill supply-chain audit.",
        confidence: 0.9,
      },
    ]);
  }

  const { files } = await listFiles(skillsRoot, { maxDepth: 6 });
  const relevantFiles = files.filter((file) => isRelevantSkillFile(file.relativePath) && file.size <= 300_000);
  const auditedSkills = new Set<string>();
  const auditedFiles: string[] = [];
  const findings: Finding[] = [];
  const buckets = {
    suspiciousCommands: [] as string[],
    secretAccessRequests: [] as string[],
    externalNetworkRisks: [] as string[],
    destructiveOperationRisks: [] as string[],
  };

  for (const file of relevantFiles) {
    const projectRelativePath = `${normalizedSkillsPath}/${file.relativePath}`.replace(/\\/g, "/");
    auditedFiles.push(projectRelativePath);
    const skillName = file.relativePath.split(/[\\/]/)[0];
    if (skillName) auditedSkills.add(skillName);

    const text = await readTextFile(skillsRoot, file.relativePath);
    const lines = text.split(/\r?\n/);
    lines.forEach((line, index) => {
      if (isRiskTaxonomyLine(line) || isDefensiveInstructionLine(line)) return;
      for (const risk of RISK_PATTERNS) {
        if (!risk.pattern.test(line)) continue;
        const evidence = compactEvidence(line);
        findings.push({
          id: `skill-supply-chain-${risk.id}-${slug(projectRelativePath)}-${index + 1}`,
          title: risk.title,
          category: "security",
          severity: input.strictness === "strict" && risk.severity === "medium" ? "high" : risk.severity,
          file: projectRelativePath,
          line: index + 1,
          evidence,
          recommendation: risk.recommendation,
          confidence: confidenceFor(risk.severity),
        });
        buckets[risk.bucket].push(`${projectRelativePath}:${index + 1}: ${evidence}`);
      }
    });
  }

  const missingManifests = await findMissingSkillManifests(skillsRoot, normalizedSkillsPath);
  findings.push(...missingManifests);

  return {
    findings,
    auditedSkills: [...auditedSkills].sort(),
    auditedFiles: auditedFiles.sort(),
    suspiciousCommands: unique(buckets.suspiciousCommands),
    secretAccessRequests: unique(buckets.secretAccessRequests),
    externalNetworkRisks: unique(buckets.externalNetworkRisks),
    destructiveOperationRisks: unique(buckets.destructiveOperationRisks),
    riskSummary: summarize(findings),
  };
}

function emptyResult(findings: Finding[]) {
  return {
    findings,
    auditedSkills: [],
    auditedFiles: [],
    suspiciousCommands: [],
    secretAccessRequests: [],
    externalNetworkRisks: [],
    destructiveOperationRisks: [],
    riskSummary: summarize(findings),
  };
}

async function findMissingSkillManifests(skillsRoot: string, skillsPath: string): Promise<Finding[]> {
  const entries = await fs.readdir(skillsRoot, { withFileTypes: true }).catch(() => []);
  const findings: Finding[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const skillFile = path.join(skillsRoot, entry.name, "SKILL.md");
    if (await fs.stat(skillFile).catch(() => null)) continue;
    findings.push({
      id: `skill-supply-chain-missing-manifest-${slug(entry.name)}`,
      title: "Skill directory is missing SKILL.md",
      category: "security",
      severity: "low",
      file: `${skillsPath}/${entry.name}`,
      evidence: "Directory under skills/ does not contain a SKILL.md manifest.",
      recommendation: "Add a concise SKILL.md manifest or remove the directory from the skills pack.",
      confidence: 0.85,
    });
  }
  return findings;
}

function isRelevantSkillFile(relativePath: string): boolean {
  return /\.(md|mdx|txt|ya?ml|json|sh|bash|ps1|js|mjs|cjs|ts|tsx|py)$/i.test(relativePath);
}

function isRiskTaxonomyLine(line: string): boolean {
  return /^\s*(-\s*)?(critical|high|medium|low|hidden instruction override|secret access|exfiltration|dangerous installation|destructive shell|remote mutation|persistence|ambiguous authority):/i.test(
    line,
  );
}

function isDefensiveInstructionLine(line: string): boolean {
  return /\b(ignore|reject|do not follow)\b[^\n]*(instructions|commands)[^\n]*(conflict|untrusted|fetched docs|repository content)[^\n]*(system|developer|user|repository policy|safety model|project instructions|policy)/i.test(
    line,
  );
}

function compactEvidence(line: string): string {
  const trimmed = line.trim().replace(/\s+/g, " ");
  return trimmed.length > 220 ? `${trimmed.slice(0, 217)}...` : trimmed;
}

function confidenceFor(severity: Finding["severity"]): number {
  if (severity === "critical") return 0.9;
  if (severity === "high") return 0.82;
  return 0.72;
}

function summarize(findings: Finding[]) {
  return {
    critical: findings.filter((finding) => finding.severity === "critical").length,
    high: findings.filter((finding) => finding.severity === "high").length,
    medium: findings.filter((finding) => finding.severity === "medium").length,
    low: findings.filter((finding) => finding.severity === "low").length,
    info: findings.filter((finding) => finding.severity === "info").length,
  };
}

function unique(values: string[]): string[] {
  return [...new Set(values)].sort();
}

function slug(value: string): string {
  return value.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase();
}
