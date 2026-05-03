import path from "node:path";
import { listFiles, pathExists, readJsonFile, resolveProjectRoot } from "./safe-fs.js";
import type { DetectedProject } from "../schemas/tool-outputs.js";

type PackageJson = {
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

export async function detectProject(projectPath: string): Promise<DetectedProject> {
  const root = await resolveProjectRoot(projectPath);
  const { files } = await listFiles(root, { maxDepth: 5 });
  const meaningfulFiles = files.filter((file) => !file.relativePath.startsWith(".git/"));
  const packageJson = await readJsonFile<PackageJson>(root, "package.json");
  const deps = dependencyNames(packageJson);

  const state = meaningfulFiles.length === 0 ? "empty" : "existing";
  const framework = detectFramework(files.map((file) => file.relativePath), deps);
  const router = await detectRouter(root, framework);
  const testFrameworks = detectTestFrameworks(files.map((file) => file.relativePath), deps);

  const detected: DetectedProject = {
    state,
    framework,
    router,
    packageManager: detectPackageManager(files.map((file) => file.relativePath)),
    language: detectLanguage(files.map((file) => file.relativePath), deps),
    appType: detectAppType(framework, deps),
    testFrameworks,
    auth: detectAuth(deps, files.map((file) => file.relativePath)),
    database: detectDatabase(deps),
    deployment: detectDeployment(files.map((file) => file.relativePath), deps),
    ci: detectCi(files.map((file) => file.relativePath)),
    riskNotes: [],
  };

  detected.riskNotes = buildRiskNotes(root, detected, files.map((file) => file.relativePath), deps);
  return detected;
}

function dependencyNames(packageJson: PackageJson | null): Set<string> {
  return new Set([
    ...Object.keys(packageJson?.dependencies ?? {}),
    ...Object.keys(packageJson?.devDependencies ?? {}),
  ]);
}

function detectPackageManager(files: string[]): string | null {
  if (files.includes("pnpm-lock.yaml")) return "pnpm";
  if (files.includes("yarn.lock")) return "yarn";
  if (files.includes("package-lock.json")) return "npm";
  if (files.includes("bun.lockb") || files.includes("bun.lock")) return "bun";
  return files.includes("package.json") ? "npm" : null;
}

function detectFramework(files: string[], deps: Set<string>): string | null {
  if (deps.has("next") || files.some((file) => file.startsWith("app/") || file.startsWith("pages/"))) return "nextjs";
  if (deps.has("@remix-run/react")) return "remix";
  if (deps.has("vite")) return "vite";
  if (deps.has("express")) return "express";
  if (deps.has("fastify")) return "fastify";
  return null;
}

async function detectRouter(root: string, framework: string | null): Promise<string | null> {
  if (framework !== "nextjs") return null;
  if (await pathExists(path.join(root, "app"))) return "app-router";
  if (await pathExists(path.join(root, "src", "app"))) return "app-router";
  if (await pathExists(path.join(root, "pages"))) return "pages-router";
  if (await pathExists(path.join(root, "src", "pages"))) return "pages-router";
  return null;
}

function detectLanguage(files: string[], deps: Set<string>): string | null {
  if (files.includes("tsconfig.json") || deps.has("typescript") || files.some((file) => /\.tsx?$/.test(file))) {
    return "typescript";
  }
  if (files.some((file) => /\.[cm]?jsx?$/.test(file))) return "javascript";
  if (files.some((file) => /\.py$/.test(file))) return "python";
  if (files.some((file) => /\.go$/.test(file))) return "go";
  return null;
}

function detectTestFrameworks(files: string[], deps: Set<string>): string[] {
  const frameworks = new Set<string>();
  if (deps.has("vitest")) frameworks.add("vitest");
  if (deps.has("jest")) frameworks.add("jest");
  if (deps.has("@playwright/test") || deps.has("playwright")) frameworks.add("playwright");
  if (deps.has("cypress")) frameworks.add("cypress");
  if (files.some((file) => /\.(test|spec)\.[cm]?[jt]sx?$/.test(file))) frameworks.add("node-test-files");
  return [...frameworks];
}

function detectAuth(deps: Set<string>, files: string[]): string | null {
  if (deps.has("better-auth")) return "better-auth";
  if (deps.has("next-auth")) return "next-auth";
  if (deps.has("@auth/core")) return "authjs";
  if (deps.has("@clerk/nextjs")) return "clerk";
  if (deps.has("firebase") || deps.has("firebase-admin")) return "firebase-auth-possible";
  if (files.some((file) => file.toLowerCase().includes("auth"))) return "custom-auth-possible";
  return null;
}

function detectDatabase(deps: Set<string>): string | null {
  if (deps.has("prisma")) return "prisma";
  if (deps.has("drizzle-orm")) return "drizzle";
  if (deps.has("@supabase/supabase-js")) return "supabase";
  if (deps.has("mongoose")) return "mongodb";
  if (deps.has("pg")) return "postgres";
  return null;
}

function detectDeployment(files: string[], deps: Set<string>): string | null {
  if (files.includes("vercel.json") || deps.has("@vercel/analytics")) return "vercel";
  if (files.includes("netlify.toml")) return "netlify";
  if (files.includes("firebase.json")) return "firebase";
  if (files.includes("Dockerfile")) return "container";
  return null;
}

function detectCi(files: string[]): string[] {
  const ci: string[] = [];
  if (files.some((file) => file.startsWith(".github/workflows/"))) ci.push("github-actions");
  if (files.includes(".gitlab-ci.yml")) ci.push("gitlab-ci");
  if (files.includes("azure-pipelines.yml")) ci.push("azure-pipelines");
  return ci;
}

function detectAppType(framework: string | null, deps: Set<string>): string | null {
  if (["ai", "@ai-sdk/openai", "openai", "langchain", "@genkit-ai/core"].some((dep) => deps.has(dep))) {
    return "ai-app";
  }
  if (framework === "nextjs" || framework === "vite" || framework === "remix") return "web-app";
  if (framework === "express" || framework === "fastify") return "api-service";
  return null;
}

function buildRiskNotes(root: string, detected: DetectedProject, files: string[], deps: Set<string>): string[] {
  const notes: string[] = [];
  if (detected.state === "empty") {
    notes.push("Project appears empty; initialize a secure baseline before adding features.");
    return notes;
  }
  if (detected.framework === "nextjs" && !files.some((file) => file.includes("middleware."))) {
    notes.push("Next.js middleware was not detected; verify auth and request boundary controls.");
  }
  if (detected.testFrameworks.length === 0) {
    notes.push("No test framework was detected.");
  }
  if (!files.some((file) => /env\.(ts|js)$/.test(file) || file.includes("env.schema"))) {
    notes.push("Environment validation was not detected.");
  }
  if (detected.framework === "nextjs" && !deps.has("zod") && !deps.has("valibot")) {
    notes.push("Schema validation dependency was not detected.");
  }
  if (!files.includes("README.md")) {
    notes.push("README.md was not detected.");
  }
  if (!files.includes(path.relative(root, path.join(root, ".gitignore")).replace(/\\/g, "/"))) {
    notes.push(".gitignore was not detected.");
  }
  return notes;
}
