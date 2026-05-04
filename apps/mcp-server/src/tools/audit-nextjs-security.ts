import { detectProject } from "../lib/project-detectors.js";
import { listFiles, readTextFile, resolveProjectRoot } from "../lib/safe-fs.js";
import type { Finding } from "../schemas/findings.js";
import type { AuditNextjsSecurityInput } from "../schemas/tool-inputs.js";

export async function auditNextjsSecurityTool(input: AuditNextjsSecurityInput) {
  const root = await resolveProjectRoot(input.projectPath);
  const detected = await detectProject(root);
  const { files } = await listFiles(root, { maxDepth: 8 });
  const paths = files.map((file) => file.relativePath);
  const findings: Finding[] = [];
  const routeHandlerRisks: string[] = [];
  const middlewareRisks: string[] = [];
  const authRisks: string[] = [];
  const rateLimitGaps: string[] = [];
  const securityHeaderGaps: string[] = [];
  const envSecretRisks: string[] = [];
  const unsafeLoggingRisks: string[] = [];
  const ssrfOpenRedirectFileUploadRisks: string[] = [];

  if (detected.framework !== "nextjs") {
    findings.push({
      id: "nextjs-security-not-nextjs",
      title: "Next.js project not detected",
      category: "security",
      severity: "info",
      evidence: "detect_project did not identify Next.js.",
      recommendation: "Run framework-specific security audits for the detected stack.",
      confidence: 0.8,
    });
  }

  const middlewareFiles = paths.filter((file) => /(^|\/)middleware\.[cm]?[jt]s$/.test(file));
  if (detected.framework === "nextjs" && middlewareFiles.length === 0) {
    middlewareRisks.push("No middleware file was detected.");
    findings.push(
      finding(
        "nextjs-missing-middleware",
        "Middleware boundary not detected",
        "medium",
        "No middleware.ts/js file found.",
        "Add middleware or document why route-level controls fully cover auth/security boundaries.",
      ),
    );
  }

  if (!paths.some((file) => /env\.(ts|js)$/.test(file) || file.includes("env.schema"))) {
    envSecretRisks.push("No environment validation module was detected.");
    findings.push(
      finding(
        "nextjs-env-validation-missing",
        "Environment validation not detected",
        "medium",
        "No env.ts/env.js or env.schema file found.",
        "Validate required environment variables with a schema and never expose secrets to client bundles.",
      ),
    );
  }

  const configFiles = files.filter((file) => /next\.config\.[cm]?[jt]s$/.test(file.relativePath));
  const configText = (
    await Promise.all(configFiles.map((file) => readTextFile(root, file.relativePath)))
  ).join("\n");
  if (
    detected.framework === "nextjs" &&
    !/headers\s*\(/.test(configText) &&
    !/Content-Security-Policy|X-Frame-Options|frame-ancestors/.test(configText)
  ) {
    securityHeaderGaps.push("Security headers were not detected in next.config.");
    findings.push(
      finding(
        "nextjs-security-headers-missing",
        "Security headers not detected",
        "medium",
        "next.config does not show headers() or common security headers.",
        "Add explicit security headers or document the deployment layer that applies them.",
      ),
    );
  }

  const routeFiles = files.filter((file) =>
    /app\/api\/.*route\.[cm]?[jt]s$|pages\/api\/.*\.[cm]?[jt]s$/.test(file.relativePath),
  );
  for (const route of routeFiles) {
    const text = await readTextFile(root, route.relativePath);
    if (
      /POST|PUT|PATCH/.test(text) &&
      !/safeParse|zod|valibot|schema\.parse|parseAsync/.test(text)
    ) {
      routeHandlerRisks.push(
        `${route.relativePath}: mutation handler without obvious schema validation.`,
      );
      findings.push({
        ...finding(
          `nextjs-route-validation-${slug(route.relativePath)}`,
          "Route handler lacks obvious input validation",
          "high",
          "Mutation route does not show schema validation keywords.",
          "Validate request bodies and query parameters with a schema before using them.",
        ),
        file: route.relativePath,
      });
    }
    if (!/auth|session|getServerSession|currentUser|requireUser|verify/.test(text)) {
      authRisks.push(`${route.relativePath}: no obvious auth or authorization check.`);
    }
    if (!/rateLimit|ratelimit|upstash|limiter|throttle/.test(text)) {
      rateLimitGaps.push(`${route.relativePath}: no obvious rate limiting.`);
    }
    if (/console\.(log|error|warn)\([^)]*(error|err|token|secret|request|headers)/i.test(text)) {
      unsafeLoggingRisks.push(`${route.relativePath}: logging may include sensitive context.`);
      findings.push({
        ...finding(
          `nextjs-unsafe-logging-${slug(route.relativePath)}`,
          "Potentially unsafe logging",
          "medium",
          "Route logs error/request/token-like context.",
          "Log redacted structured fields and avoid raw provider errors, headers, cookies, or request bodies.",
        ),
        file: route.relativePath,
      });
    }
    if (
      /redirect\([^)]*searchParams|NextResponse\.redirect\([^)]*request|new URL\([^)]*request/.test(
        text,
      )
    ) {
      ssrfOpenRedirectFileUploadRisks.push(
        `${route.relativePath}: redirect may depend on request-controlled input.`,
      );
    }
    if (/fetch\([^)]*(url|href|request|searchParams|body)/i.test(text)) {
      ssrfOpenRedirectFileUploadRisks.push(
        `${route.relativePath}: outbound fetch may depend on request-controlled input.`,
      );
    }
    if (
      /formData\(|File|Blob|upload/i.test(text) &&
      !/size|mime|content-type|fileType|virus|scan/i.test(text)
    ) {
      ssrfOpenRedirectFileUploadRisks.push(
        `${route.relativePath}: upload path lacks obvious file validation.`,
      );
    }
  }

  return {
    findings,
    routeHandlerRisks,
    middlewareRisks,
    authRisks,
    rateLimitGaps,
    securityHeaderGaps,
    envSecretRisks,
    unsafeLoggingRisks,
    ssrfOpenRedirectFileUploadRisks,
  };
}

function finding(
  id: string,
  title: string,
  severity: Finding["severity"],
  evidence: string,
  recommendation: string,
): Finding {
  return { id, title, category: "security", severity, evidence, recommendation, confidence: 0.72 };
}

function slug(value: string): string {
  return value
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}
