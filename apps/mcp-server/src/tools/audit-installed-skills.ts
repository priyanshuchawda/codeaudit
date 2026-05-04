import { promises as fs } from "node:fs";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import { listFiles, readTextFile, resolveProjectRoot, safeJoin } from "../lib/safe-fs.js";
import type { Finding } from "../schemas/findings.js";
import type { AuditInstalledSkillsInput } from "../schemas/tool-inputs.js";

type RiskPattern = {
  id: string;
  title: string;
  severity: Finding["severity"];
  bucket:
    | "suspiciousCommands"
    | "secretAccessRequests"
    | "externalNetworkRisks"
    | "destructiveOperationRisks";
  recommendation: string;
  pattern: RegExp;
};

type SkillManifest = {
  folderName: string;
  skillFilePath: string;
  name: string | null;
  description: string | null;
  frontmatterKeys: string[];
  body: string;
};

const RISK_PATTERNS: RiskPattern[] = [
  {
    id: "curl-pipe-shell",
    title: "Remote script piped into shell",
    severity: "high",
    bucket: "suspiciousCommands",
    recommendation:
      "Require a pinned, reviewed script or replace the bootstrap command with explicit audited steps.",
    pattern:
      /\b(curl|wget|iwr|Invoke-WebRequest)\b[^\n|]*(\||;)[^\n]*(bash|sh|pwsh|powershell|iex|Invoke-Expression)\b/i,
  },
  {
    id: "unknown-package-install",
    title: "Skill asks to install dependencies",
    severity: "medium",
    bucket: "suspiciousCommands",
    recommendation:
      "Review package provenance, pin versions, and move deterministic installs into a documented project setup step.",
    pattern:
      /\b(npm|pnpm|yarn|bun)\s+(install|add|i)\b|\bpip\s+install\b|\buv\s+pip\s+install\b|\bcargo\s+install\b|\bbrew\s+install\b/i,
  },
  {
    id: "secret-access-request",
    title: "Skill requests secret access",
    severity: "high",
    bucket: "secretAccessRequests",
    recommendation:
      "Do not allow skills to read or print raw secrets; require scoped env names and redacted validation only.",
    pattern:
      /\b(read|dump|print|show|send|upload|copy|exfiltrate|get)\b[^\n]*(\.env|secret|access[-_ ]?token|refresh[-_ ]?token|auth[-_ ]?token|bearer[-_ ]?token|api[-_ ]?key|credential|cookie|jwt|private[-_ ]?key)/i,
  },
  {
    id: "secret-network-exfiltration",
    title: "Secret-like data may be sent over the network",
    severity: "critical",
    bucket: "externalNetworkRisks",
    recommendation:
      "Quarantine the skill until the network send is removed or constrained to a trusted, documented endpoint.",
    pattern:
      /(\.env|secret|access[-_ ]?token|refresh[-_ ]?token|auth[-_ ]?token|bearer[-_ ]?token|api[-_ ]?key|credential|cookie|jwt|private[-_ ]?key)[^\n]*(\b(fetch|curl|post|send|upload|exfiltrate)\b|https?:\/\/)/i,
  },
  {
    id: "webhook-or-paste-exfiltration",
    title: "Skill references a risky external sink",
    severity: "high",
    bucket: "externalNetworkRisks",
    recommendation:
      "Remove webhook or paste-site output unless it is explicitly approved and documented for this project.",
    pattern:
      /\b(send|post|upload|exfiltrate|forward|curl|fetch)\b[^\n]*(webhook|discord(?:app)?\.com\/api\/webhooks|requestbin|webhook\.site|pastebin|hastebin|ngrok|tunnel)|https?:\/\/[^\s]*(discord(?:app)?\.com\/api\/webhooks|requestbin|webhook\.site|pastebin|hastebin|ngrok)/i,
  },
  {
    id: "destructive-shell-command",
    title: "Skill includes destructive shell command",
    severity: "high",
    bucket: "destructiveOperationRisks",
    recommendation:
      "Replace destructive commands with scoped, reviewed file operations and explicit approval gates.",
    pattern:
      /\brm\s+-rf\b|\bRemove-Item\b[^\n]*-(Recurse|r)\b|\bdel\s+\/[fsq]\b|\bgit\s+reset\s+--hard\b|\bgit\s+clean\s+-fd\b/i,
  },
  {
    id: "instruction-override",
    title: "Skill attempts to override higher-priority instructions",
    severity: "high",
    bucket: "suspiciousCommands",
    recommendation:
      "Remove hidden authority claims; skills must operate below system, developer, user, and project instructions.",
    pattern:
      /\b(ignore|override|bypass)\b[^\n]*(system|developer|user|previous|higher[- ]priority|approval|sandbox|policy|instructions)/i,
  },
  {
    id: "hidden-behavior",
    title: "Skill asks to hide behavior from the user",
    severity: "high",
    bucket: "suspiciousCommands",
    recommendation:
      "Reject skills that require hidden behavior; all risky actions must be visible and approved.",
    pattern: /\b(do not tell|don't tell|hide this|secretly|without notifying|without asking)\b/i,
  },
  {
    id: "remote-mutation",
    title: "Skill may mutate remote systems",
    severity: "medium",
    bucket: "destructiveOperationRisks",
    recommendation:
      "Gate remote mutation behind explicit user approval and a narrow task-specific workflow.",
    pattern:
      /\b(git\s+push|gh\s+pr\s+merge|gh\s+release|vercel\s+deploy|firebase\s+deploy|supabase\s+db\s+push)\b/i,
  },
  {
    id: "persistence-or-permission-change",
    title: "Skill may change persistence or permissions",
    severity: "medium",
    bucket: "destructiveOperationRisks",
    recommendation:
      "Avoid global persistence and permission changes from skills unless the user explicitly requested setup.",
    pattern:
      /\b(chmod\s+\+x|Set-ExecutionPolicy|crontab|schtasks|profile\.ps1|\.bashrc|\.zshrc|credential-helper)\b|\b(write|append|add|install|register|persist)\b[^\n]*(startup|login item|launch agent|scheduled task)/i,
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
  const relevantFiles = files.filter(
    (file) => isRelevantSkillFile(file.relativePath) && file.size <= 300_000,
  );
  const auditedSkills = new Set<string>();
  const auditedFiles: string[] = [];
  const findings: Finding[] = [];
  const buckets = {
    suspiciousCommands: [] as string[],
    secretAccessRequests: [] as string[],
    externalNetworkRisks: [] as string[],
    destructiveOperationRisks: [] as string[],
    manifestQualityRisks: [] as string[],
    duplicateSkillRisks: [] as string[],
    resourceDiscoveryRisks: [] as string[],
    auxiliaryDocRisks: [] as string[],
  };
  const manifests = new Map<string, SkillManifest>();

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
          severity: risk.severity,
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

  const skillDirectories = await listSkillDirectories(skillsRoot);
  const manifestFindings = await auditSkillManifests(
    skillsRoot,
    normalizedSkillsPath,
    skillDirectories,
    manifests,
  );
  findings.push(...manifestFindings);
  for (const finding of manifestFindings) {
    buckets.manifestQualityRisks.push(formatFindingReference(finding));
  }

  const duplicateFindings = findDuplicateSkillNames(manifests, normalizedSkillsPath);
  findings.push(...duplicateFindings);
  for (const finding of duplicateFindings) {
    buckets.duplicateSkillRisks.push(formatFindingReference(finding));
  }

  const resourceFindings = findUndiscoverableResources(
    relevantFiles,
    normalizedSkillsPath,
    manifests,
  );
  findings.push(...resourceFindings);
  for (const finding of resourceFindings) {
    buckets.resourceDiscoveryRisks.push(formatFindingReference(finding));
  }

  const auxiliaryDocFindings = findAuxiliaryTopLevelDocs(relevantFiles, normalizedSkillsPath);
  findings.push(...auxiliaryDocFindings);
  for (const finding of auxiliaryDocFindings) {
    buckets.auxiliaryDocRisks.push(formatFindingReference(finding));
  }

  return {
    findings,
    auditedSkills: [...auditedSkills].sort(),
    auditedFiles: auditedFiles.sort(),
    suspiciousCommands: unique(buckets.suspiciousCommands),
    secretAccessRequests: unique(buckets.secretAccessRequests),
    externalNetworkRisks: unique(buckets.externalNetworkRisks),
    destructiveOperationRisks: unique(buckets.destructiveOperationRisks),
    manifestQualityRisks: unique(buckets.manifestQualityRisks),
    duplicateSkillRisks: unique(buckets.duplicateSkillRisks),
    resourceDiscoveryRisks: unique(buckets.resourceDiscoveryRisks),
    auxiliaryDocRisks: unique(buckets.auxiliaryDocRisks),
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
    manifestQualityRisks: [],
    duplicateSkillRisks: [],
    resourceDiscoveryRisks: [],
    auxiliaryDocRisks: [],
    riskSummary: summarize(findings),
  };
}

async function listSkillDirectories(skillsRoot: string): Promise<string[]> {
  const entries = await fs.readdir(skillsRoot, { withFileTypes: true }).catch(() => []);
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

async function auditSkillManifests(
  skillsRoot: string,
  skillsPath: string,
  skillDirectories: string[],
  manifests: Map<string, SkillManifest>,
): Promise<Finding[]> {
  const findings: Finding[] = [];
  for (const skillName of skillDirectories) {
    const skillFileRelative = `${skillName}/SKILL.md`;
    const skillFile = path.join(skillsRoot, skillName, "SKILL.md");
    if (!(await fs.stat(skillFile).catch(() => null))) {
      findings.push({
        id: `skill-quality-missing-manifest-${slug(skillName)}`,
        title: "Skill directory is missing SKILL.md",
        category: "workflow",
        severity: "high",
        file: `${skillsPath}/${skillName}`,
        evidence: "Directory under skills/ does not contain a SKILL.md manifest.",
        recommendation:
          "Add a concise SKILL.md manifest or remove the directory from the skills pack.",
        confidence: 0.9,
      });
      continue;
    }

    const text = await readTextFile(skillsRoot, skillFileRelative);
    const parsed = parseSkillManifest(text, skillName, `${skillsPath}/${skillFileRelative}`);
    if (parsed.manifest) manifests.set(skillName, parsed.manifest);
    findings.push(...parsed.findings);
  }
  return findings;
}

function parseSkillManifest(
  text: string,
  folderName: string,
  skillFilePath: string,
): { manifest: SkillManifest | null; findings: Finding[] } {
  const findings: Finding[] = [];
  const frontmatter = extractFrontmatter(text);
  if (!frontmatter) {
    findings.push({
      id: `skill-quality-missing-frontmatter-${slug(skillFilePath)}`,
      title: "Skill manifest is missing YAML frontmatter",
      category: "workflow",
      severity: "high",
      file: skillFilePath,
      evidence: "SKILL.md must start with YAML frontmatter bounded by --- lines.",
      recommendation:
        "Add frontmatter with only name and description fields before the Markdown body.",
      confidence: 0.9,
    });
    return { manifest: null, findings };
  }

  let data: unknown;
  try {
    data = parseYaml(frontmatter.yaml);
  } catch (error) {
    findings.push({
      id: `skill-quality-invalid-frontmatter-${slug(skillFilePath)}`,
      title: "Skill manifest has invalid YAML frontmatter",
      category: "workflow",
      severity: "high",
      file: skillFilePath,
      evidence:
        error instanceof Error
          ? compactEvidence(error.message)
          : "YAML parser rejected the frontmatter.",
      recommendation: "Fix the frontmatter so name and description parse as plain YAML strings.",
      confidence: 0.9,
    });
    return { manifest: null, findings };
  }

  const record = isRecord(data) ? data : {};
  const name = typeof record.name === "string" ? record.name.trim() : null;
  const description = typeof record.description === "string" ? record.description.trim() : null;
  const manifest = {
    folderName,
    skillFilePath,
    name,
    description,
    frontmatterKeys: Object.keys(record),
    body: frontmatter.body,
  };
  findings.push(...validateManifestFields(manifest));
  return { manifest, findings };
}

function validateManifestFields(manifest: SkillManifest): Finding[] {
  const findings: Finding[] = [];
  const extraFrontmatterKeys = manifest.frontmatterKeys.filter(
    (key) => key !== "name" && key !== "description" && key !== "metadata",
  );
  if (extraFrontmatterKeys.length) {
    findings.push({
      id: `skill-quality-extra-frontmatter-${slug(manifest.skillFilePath)}`,
      title: "Skill manifest frontmatter has nonstandard fields",
      category: "workflow",
      severity: "low",
      file: manifest.skillFilePath,
      evidence: `Extra fields: ${extraFrontmatterKeys.sort().join(", ")}.`,
      recommendation:
        "Keep SKILL.md frontmatter to name and description; move UI metadata or implementation details into supported resource files.",
      confidence: 0.78,
    });
  }

  if (!manifest.name) {
    findings.push({
      id: `skill-quality-missing-name-${slug(manifest.skillFilePath)}`,
      title: "Skill manifest is missing name",
      category: "workflow",
      severity: "high",
      file: manifest.skillFilePath,
      evidence: "Frontmatter does not define a non-empty name.",
      recommendation: "Set name to the lowercase hyphen-case skill folder name.",
      confidence: 0.9,
    });
  } else {
    if (!/^[a-z0-9][a-z0-9-]{0,62}[a-z0-9]$|^[a-z0-9]$/.test(manifest.name)) {
      findings.push({
        id: `skill-quality-invalid-name-${slug(manifest.skillFilePath)}`,
        title: "Skill manifest name is not hyphen-case",
        category: "workflow",
        severity: "medium",
        file: manifest.skillFilePath,
        evidence: `name is "${manifest.name}".`,
        recommendation: "Use lowercase letters, digits, and hyphens only, under 64 characters.",
        confidence: 0.86,
      });
    }
    if (manifest.name !== manifest.folderName) {
      findings.push({
        id: `skill-quality-name-folder-mismatch-${slug(manifest.skillFilePath)}`,
        title: "Skill name does not match folder name",
        category: "workflow",
        severity: "medium",
        file: manifest.skillFilePath,
        evidence: `name is "${manifest.name}" but folder is "${manifest.folderName}".`,
        recommendation:
          "Rename the folder or manifest so discovery, routing, and references use one canonical skill name.",
        confidence: 0.9,
      });
    }
  }

  if (!manifest.description) {
    findings.push({
      id: `skill-quality-missing-description-${slug(manifest.skillFilePath)}`,
      title: "Skill manifest is missing description",
      category: "workflow",
      severity: "high",
      file: manifest.skillFilePath,
      evidence: "Frontmatter does not define a non-empty description.",
      recommendation:
        "Add a concise description that states what the skill does and starts trigger guidance with Use when.",
      confidence: 0.9,
    });
  } else {
    if (manifest.description.length > 1024) {
      findings.push({
        id: `skill-quality-description-too-long-${slug(manifest.skillFilePath)}`,
        title: "Skill description is too long",
        category: "workflow",
        severity: "low",
        file: manifest.skillFilePath,
        evidence: `Description is ${manifest.description.length} characters.`,
        recommendation:
          "Keep the description under 1024 characters so the always-loaded skill index stays compact.",
        confidence: 0.86,
      });
    }
    if (!/\buse when\b/i.test(manifest.description)) {
      findings.push({
        id: `skill-quality-description-missing-trigger-${slug(manifest.skillFilePath)}`,
        title: "Skill description lacks trigger guidance",
        category: "workflow",
        severity: "medium",
        file: manifest.skillFilePath,
        evidence: "Description does not contain a Use when trigger clause.",
        recommendation:
          "Include specific trigger contexts in the description because it is the primary skill-routing signal.",
        confidence: 0.84,
      });
    }
    if (manifest.description.length < 80) {
      findings.push({
        id: `skill-quality-description-too-thin-${slug(manifest.skillFilePath)}`,
        title: "Skill description is too thin for reliable routing",
        category: "workflow",
        severity: "low",
        file: manifest.skillFilePath,
        evidence: `Description is ${manifest.description.length} characters.`,
        recommendation:
          "Describe both the capability and the specific contexts or file types that should trigger the skill.",
        confidence: 0.76,
      });
    }
  }

  if (!/^#\s+\S+/m.test(manifest.body)) {
    findings.push({
      id: `skill-quality-missing-heading-${slug(manifest.skillFilePath)}`,
      title: "Skill body is missing a top-level heading",
      category: "workflow",
      severity: "low",
      file: manifest.skillFilePath,
      evidence: "No Markdown H1 heading was found after frontmatter.",
      recommendation: "Add a short H1 that names the workflow the skill provides.",
      confidence: 0.78,
    });
  }

  const bodyLines = manifest.body.split(/\r?\n/).length;
  if (bodyLines > 500) {
    findings.push({
      id: `skill-quality-body-too-long-${slug(manifest.skillFilePath)}`,
      title: "Skill body is too long for progressive disclosure",
      category: "workflow",
      severity: "low",
      file: manifest.skillFilePath,
      evidence: `SKILL.md body is ${bodyLines} lines.`,
      recommendation:
        "Move detailed or variant-specific material into one-level-deep reference files and keep SKILL.md procedural.",
      confidence: 0.82,
    });
  }

  return findings;
}

function findDuplicateSkillNames(
  manifests: Map<string, SkillManifest>,
  skillsPath: string,
): Finding[] {
  const byName = new Map<string, SkillManifest[]>();
  for (const manifest of manifests.values()) {
    if (!manifest.name) continue;
    const entries = byName.get(manifest.name) ?? [];
    entries.push(manifest);
    byName.set(manifest.name, entries);
  }

  const findings: Finding[] = [];
  for (const [name, entries] of byName.entries()) {
    if (entries.length < 2) continue;
    const files = entries.map((entry) => entry.skillFilePath).sort();
    findings.push({
      id: `skill-quality-duplicate-name-${slug(name)}`,
      title: "Duplicate skill manifest name",
      category: "workflow",
      severity: "high",
      file: `${skillsPath}/${entries[0].folderName}/SKILL.md`,
      evidence: `${name} appears in ${files.join(", ")}.`,
      recommendation:
        "Use one canonical skill name or rename overlapping skills so routing cannot trigger the wrong workflow.",
      confidence: 0.92,
    });
  }
  return findings;
}

function findUndiscoverableResources(
  files: { relativePath: string; size: number }[],
  skillsPath: string,
  manifests: Map<string, SkillManifest>,
): Finding[] {
  const findings: Finding[] = [];
  const resourceDirs = new Set([
    "references",
    "reference",
    "rules",
    "examples",
    "templates",
    "scripts",
    "assets",
  ]);

  for (const file of files) {
    const parts = file.relativePath.split(/[\\/]/);
    if (parts.length < 3 || parts[1] === "SKILL.md" || !resourceDirs.has(parts[1])) continue;
    const manifest = manifests.get(parts[0]);
    if (!manifest) continue;
    const body = manifest.body.toLowerCase();
    const resourceDir = parts[1].toLowerCase();
    const fileName = parts[parts.length - 1].toLowerCase();
    const relativeToSkill = parts.slice(1).join("/").toLowerCase();
    if (body.includes(resourceDir) || body.includes(fileName) || body.includes(relativeToSkill))
      continue;

    const projectRelativePath = `${skillsPath}/${file.relativePath}`.replace(/\\/g, "/");
    findings.push({
      id: `skill-quality-undiscoverable-resource-${slug(projectRelativePath)}`,
      title: "Skill resource is not discoverable from SKILL.md",
      category: "workflow",
      severity: "low",
      file: projectRelativePath,
      evidence:
        "A bundled resource exists under a conventional resource directory, but SKILL.md does not mention that directory or file.",
      recommendation:
        "Reference the resource directory or file from SKILL.md and state when the agent should load or execute it.",
      confidence: 0.72,
    });
  }

  return findings;
}

function findAuxiliaryTopLevelDocs(
  files: { relativePath: string; size: number }[],
  skillsPath: string,
): Finding[] {
  const auxiliaryNames = new Set([
    "README.md",
    "CHANGELOG.md",
    "INSTALLATION_GUIDE.md",
    "QUICK_REFERENCE.md",
    "AGENTS.md",
    "metadata.json",
  ]);
  const findings: Finding[] = [];

  for (const file of files) {
    const parts = file.relativePath.split(/[\\/]/);
    if (parts.length !== 2 || !auxiliaryNames.has(parts[1])) continue;
    const projectRelativePath = `${skillsPath}/${file.relativePath}`.replace(/\\/g, "/");
    findings.push({
      id: `skill-quality-auxiliary-doc-${slug(projectRelativePath)}`,
      title: "Skill contains top-level auxiliary documentation",
      category: "docs",
      severity: "low",
      file: projectRelativePath,
      evidence: `${parts[1]} is present beside SKILL.md.`,
      recommendation:
        "Keep only files that directly support agent execution; move necessary details into SKILL.md, references/, scripts/, or assets/.",
      confidence: 0.74,
    });
  }

  return findings;
}

function extractFrontmatter(text: string): { yaml: string; body: string } | null {
  const lines = text.split(/\r?\n/);
  if (lines[0]?.trim() !== "---") return null;
  const endIndex = lines.findIndex((line, index) => index > 0 && line.trim() === "---");
  if (endIndex < 1) return null;
  return {
    yaml: lines.slice(1, endIndex).join("\n"),
    body: lines.slice(endIndex + 1).join("\n"),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function formatFindingReference(finding: Finding): string {
  const location = finding.line ? `${finding.file}:${finding.line}` : (finding.file ?? "(no file)");
  return `${location}: ${finding.title}`;
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
  return (
    /\b(ignore|reject|do not follow)\b[^\n]*(instructions|commands)[^\n]*(conflict|untrusted|fetched docs|repository content)[^\n]*(system|developer|user|repository policy|safety model|project instructions|policy)/i.test(
      line,
    ) ||
    /\b(rather than|avoid|prevent|without)\b[^\n]*(exfiltrat|leak|expos|dump)[^\n]*(secret|credential|token|key)/i.test(
      line,
    )
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
  return value
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}
