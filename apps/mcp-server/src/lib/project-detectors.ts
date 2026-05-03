import path from "node:path";
import {
  listFiles,
  pathExists,
  readJsonFile,
  readTextFile,
  resolveProjectRoot,
} from "./safe-fs.js";
import type { DetectedProject } from "../schemas/tool-outputs.js";

type PackageJson = {
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

export async function detectProject(projectPath: string): Promise<DetectedProject> {
  const root = await resolveProjectRoot(projectPath);
  const { files } = await listFiles(root, { maxDepth: 5 });
  const meaningfulFiles = files.filter((file) => {
    const name = path.basename(file.relativePath);
    return !file.relativePath.startsWith(".git/") && name !== ".gitkeep" && name !== ".keep";
  });
  const packageJson = await readJsonFile<PackageJson>(root, "package.json");
  const filesList = files.map((file) => file.relativePath);
  const deps = new Set([
    ...dependencyNames(packageJson),
    ...pythonDependencyNames(await readOptionalPythonDependencyFiles(root, filesList)),
  ]);

  const state = meaningfulFiles.length === 0 ? "empty" : "existing";
  const framework = detectFramework(filesList, deps);
  const router = await detectRouter(root, framework);
  const testFrameworks = detectTestFrameworks(filesList, deps);

  const detected: DetectedProject = {
    state,
    framework,
    router,
    packageManager: detectPackageManager(filesList),
    language: detectLanguage(filesList, deps),
    appType: detectAppType(framework, deps),
    testFrameworks,
    auth: detectAuth(deps, filesList),
    database: detectDatabase(deps),
    deployment: detectDeployment(filesList, deps),
    ci: detectCi(filesList),
    riskNotes: [],
  };

  detected.riskNotes = buildRiskNotes(root, detected, filesList, deps);
  return detected;
}

function dependencyNames(packageJson: PackageJson | null): Set<string> {
  return new Set([
    ...Object.keys(packageJson?.dependencies ?? {}),
    ...Object.keys(packageJson?.devDependencies ?? {}),
  ]);
}

function detectPackageManager(files: string[]): string | null {
  if (files.includes("uv.lock")) return "uv";
  if (files.includes("poetry.lock")) return "poetry";
  if (files.includes("Pipfile.lock") || files.includes("Pipfile")) return "pipenv";
  if (files.includes("pnpm-lock.yaml")) return "pnpm";
  if (files.includes("yarn.lock")) return "yarn";
  if (files.includes("package-lock.json")) return "npm";
  if (files.includes("bun.lockb") || files.includes("bun.lock")) return "bun";
  if (files.includes("requirements.txt") || files.includes("pyproject.toml")) return "pip";
  return files.includes("package.json") ? "npm" : null;
}

function detectFramework(files: string[], deps: Set<string>): string | null {
  if (
    deps.has("next") ||
    files.some((file) => file.startsWith("app/") || file.startsWith("pages/"))
  )
    return "nextjs";
  if (deps.has("@remix-run/react")) return "remix";
  if (deps.has("vite")) return "vite";
  if (deps.has("express")) return "express";
  if (deps.has("fastify")) return "fastify";
  if (deps.has("fastapi")) return "fastapi";
  if (deps.has("django") || files.some((file) => file.endsWith("manage.py"))) return "django";
  if (deps.has("flask")) return "flask";
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
  if (
    files.includes("tsconfig.json") ||
    deps.has("typescript") ||
    files.some((file) => /\.tsx?$/.test(file))
  ) {
    return "typescript";
  }
  if (files.some((file) => /\.[cm]?jsx?$/.test(file))) return "javascript";
  if (
    files.includes("pyproject.toml") ||
    files.includes("requirements.txt") ||
    files.some((file) => /\.py$/.test(file))
  )
    return "python";
  if (files.some((file) => /\.go$/.test(file))) return "go";
  return null;
}

function detectTestFrameworks(files: string[], deps: Set<string>): string[] {
  const frameworks = new Set<string>();
  if (deps.has("vitest")) frameworks.add("vitest");
  if (deps.has("jest")) frameworks.add("jest");
  if (deps.has("@playwright/test") || deps.has("playwright")) frameworks.add("playwright");
  if (deps.has("cypress")) frameworks.add("cypress");
  if (deps.has("pytest")) frameworks.add("pytest");
  if (deps.has("behave")) frameworks.add("behave");
  if (deps.has("hypothesis")) frameworks.add("hypothesis");
  if (files.some((file) => /(^|\/)test_[^/]+\.py$|(^|\/)[^/]+_test\.py$/.test(file))) {
    frameworks.add("python-test-files");
  }
  if (files.some((file) => /\.(test|spec)\.[cm]?[jt]sx?$/.test(file)))
    frameworks.add("node-test-files");
  return [...frameworks];
}

function detectAuth(deps: Set<string>, files: string[]): string | null {
  if (deps.has("better-auth")) return "better-auth";
  if (deps.has("next-auth")) return "next-auth";
  if (deps.has("@auth/core")) return "authjs";
  if (deps.has("@clerk/nextjs")) return "clerk";
  if (deps.has("firebase") || deps.has("firebase-admin")) return "firebase-auth-possible";
  if (deps.has("fastapi-users")) return "fastapi-users";
  if (deps.has("django-allauth")) return "django-allauth";
  if (deps.has("authlib")) return "authlib";
  if (deps.has("python-jose") || deps.has("pyjwt")) return "jwt-auth-possible";
  if (files.some((file) => file.toLowerCase().includes("auth"))) return "custom-auth-possible";
  return null;
}

function detectDatabase(deps: Set<string>): string | null {
  if (deps.has("prisma")) return "prisma";
  if (deps.has("drizzle-orm")) return "drizzle";
  if (deps.has("@supabase/supabase-js")) return "supabase";
  if (deps.has("mongoose")) return "mongodb";
  if (deps.has("sqlalchemy")) return "sqlalchemy";
  if (deps.has("django")) return "django-orm";
  if (deps.has("psycopg") || deps.has("psycopg2") || deps.has("asyncpg") || deps.has("pg"))
    return "postgres";
  if (deps.has("pymongo")) return "mongodb";
  return null;
}

function detectDeployment(files: string[], deps: Set<string>): string | null {
  if (files.includes("vercel.json") || deps.has("@vercel/analytics")) return "vercel";
  if (files.includes("netlify.toml")) return "netlify";
  if (files.includes("firebase.json")) return "firebase";
  if (files.includes("fly.toml")) return "fly";
  if (files.includes("render.yaml")) return "render";
  if (files.includes("Procfile")) return "procfile";
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
  if (deps.has("mcp")) return "mcp-server";
  if (
    [
      "ai",
      "@ai-sdk/openai",
      "openai",
      "langchain",
      "@genkit-ai/core",
      "llama-index",
      "semantic-kernel",
    ].some((dep) => deps.has(dep))
  ) {
    return "ai-app";
  }
  if (framework === "nextjs" || framework === "vite" || framework === "remix") return "web-app";
  if (framework === "express" || framework === "fastify") return "api-service";
  if (framework === "fastapi" || framework === "flask") return "api-service";
  if (framework === "django") return "web-app";
  return null;
}

function buildRiskNotes(
  root: string,
  detected: DetectedProject,
  files: string[],
  deps: Set<string>,
): string[] {
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
  if (detected.language === "python" && !files.includes("pyproject.toml")) {
    notes.push("pyproject.toml was not detected for Python packaging and tooling configuration.");
  }
  if (
    detected.language === "python" &&
    !deps.has("pydantic") &&
    (detected.framework === "fastapi" || detected.appType === "mcp-server")
  ) {
    notes.push("Pydantic was not detected for Python boundary models.");
  }
  if (
    detected.language === "python" &&
    !deps.has("mypy") &&
    !deps.has("pyright") &&
    !deps.has("basedpyright")
  ) {
    notes.push("Python static type checking was not detected.");
  }
  if (detected.language === "python" && !deps.has("ruff")) {
    notes.push("Ruff lint/format tooling was not detected.");
  }
  if (!files.includes("README.md")) {
    notes.push("README.md was not detected.");
  }
  if (!files.includes(path.relative(root, path.join(root, ".gitignore")).replace(/\\/g, "/"))) {
    notes.push(".gitignore was not detected.");
  }
  return notes;
}

async function readOptionalPythonDependencyFiles(root: string, files: string[]): Promise<string[]> {
  const dependencyFiles = files.filter((file) =>
    [
      "pyproject.toml",
      "requirements.txt",
      "requirements-dev.txt",
      "dev-requirements.txt",
      "Pipfile",
      "setup.cfg",
    ].includes(file),
  );
  const texts = await Promise.all(
    dependencyFiles.map((file) => readTextFile(root, file).catch(() => "")),
  );
  return texts;
}

function pythonDependencyNames(texts: string[]): Set<string> {
  const names = new Set<string>();
  for (const text of texts) {
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim().replace(/^["']|["'],?$/g, "");
      if (
        !line ||
        line.startsWith("#") ||
        line.startsWith("[") ||
        /^[A-Za-z0-9_.-]+\s*=/.test(line)
      ) {
        continue;
      }
      const match = line.match(/^([A-Za-z0-9_.-]+)(?:\[.*?\])?\s*(?:[<>=!~]|$)/);
      if (match?.[1]) names.add(normalizePythonPackageName(match[1]));
    }
  }
  return names;
}

function normalizePythonPackageName(name: string): string {
  return name.toLowerCase().replace(/_/g, "-");
}
