import { promises as fs } from "node:fs";
import path from "node:path";
import { redactSecrets } from "./redaction.js";

const DEFAULT_EXCLUDES = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  ".next",
  "coverage",
  ".turbo",
  ".cache",
]);

export type FileEntry = {
  absolutePath: string;
  relativePath: string;
  depth: number;
  size: number;
};

export async function resolveProjectRoot(projectPath: string): Promise<string> {
  const resolved = path.resolve(projectPath);
  const stat = await fs.stat(resolved).catch(() => null);
  if (!stat?.isDirectory()) {
    throw new Error(`Project path does not exist or is not a directory: ${resolved}`);
  }
  return resolved;
}

export async function assertProjectPathAllowed(
  projectPath: string,
  allowedRoots: string[],
): Promise<void> {
  if (allowedRoots.length === 0) return;

  const projectRoot = await realpathOrResolve(projectPath);
  const allowedRealRoots = await Promise.all(allowedRoots.map(realpathOrResolve));
  if (allowedRealRoots.some((allowedRoot) => isSameOrInsideRoot(projectRoot, allowedRoot))) {
    return;
  }

  throw new Error(`Project path is outside CODEAUDIT_ALLOWED_ROOTS: ${path.resolve(projectPath)}`);
}

export async function pathExists(filePath: string): Promise<boolean> {
  return Boolean(await fs.stat(filePath).catch(() => null));
}

export async function readTextFile(
  root: string,
  relativePath: string,
  maxBytes = 250_000,
): Promise<string> {
  const absolutePath = safeJoin(root, relativePath);
  const stat = await fs.stat(absolutePath);
  if (!stat.isFile()) throw new Error(`Not a file: ${relativePath}`);
  if (stat.size > maxBytes) {
    const handle = await fs.open(absolutePath, "r");
    try {
      const buffer = Buffer.alloc(maxBytes);
      await handle.read(buffer, 0, maxBytes, 0);
      return redactSecrets(buffer.toString("utf8"));
    } finally {
      await handle.close();
    }
  }
  return redactSecrets(await fs.readFile(absolutePath, "utf8"));
}

export async function readJsonFile<T>(root: string, relativePath: string): Promise<T | null> {
  try {
    return JSON.parse(await readTextFile(root, relativePath)) as T;
  } catch {
    return null;
  }
}

export async function listFiles(
  root: string,
  options: {
    maxDepth?: number;
    includePatterns?: string[];
    excludePatterns?: string[];
  } = {},
): Promise<{ files: FileEntry[]; skipped: string[] }> {
  const files: FileEntry[] = [];
  const skipped: string[] = [];
  const maxDepth = options.maxDepth ?? 6;

  async function visit(current: string, depth: number): Promise<void> {
    if (depth > maxDepth) {
      skipped.push(path.relative(root, current) || ".");
      return;
    }

    const entries = await fs.readdir(current, { withFileTypes: true }).catch(() => []);
    for (const entry of entries) {
      if (DEFAULT_EXCLUDES.has(entry.name)) continue;
      const absolutePath = path.join(current, entry.name);
      const relativePath = path.relative(root, absolutePath).replace(/\\/g, "/");
      if (matchesAny(relativePath, options.excludePatterns ?? [])) continue;

      if (entry.isDirectory()) {
        await visit(absolutePath, depth + 1);
        continue;
      }

      if (!entry.isFile()) continue;
      if (options.includePatterns?.length && !matchesAny(relativePath, options.includePatterns))
        continue;
      const stat = await fs.stat(absolutePath);
      files.push({ absolutePath, relativePath, depth, size: stat.size });
    }
  }

  await visit(root, 1);
  return { files: files.sort((a, b) => a.relativePath.localeCompare(b.relativePath)), skipped };
}

export function safeJoin(root: string, relativePath: string): string {
  const absolutePath = path.resolve(root, relativePath);
  const relative = path.relative(root, absolutePath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Path escapes project root: ${relativePath}`);
  }
  return absolutePath;
}

export function normalizeAllowedRoots(roots: string[]): string[] {
  return [...new Set(roots.map((root) => path.resolve(root)).filter(Boolean))];
}

function isSameOrInsideRoot(candidatePath: string, allowedRoot: string): boolean {
  const relative = path.relative(allowedRoot, candidatePath);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

async function realpathOrResolve(filePath: string): Promise<string> {
  const resolved = path.resolve(filePath);
  return fs.realpath(resolved).catch(() => resolved);
}

function matchesAny(filePath: string, patterns: string[]): boolean {
  return patterns.some((pattern) => {
    const normalized = pattern.replace(/\\/g, "/");
    if (normalized.includes("*")) {
      const regex = new RegExp(`^${normalized.split("*").map(escapeRegex).join(".*")}$`);
      return regex.test(filePath);
    }
    return filePath.includes(normalized);
  });
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
