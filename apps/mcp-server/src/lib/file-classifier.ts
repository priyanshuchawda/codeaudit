const DOC_EXTENSIONS = [".md", ".mdx", ".txt"];
const CODE_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".py"];
const CONFIG_NAMES = [
  "package.json",
  "tsconfig.json",
  "pyproject.toml",
  "requirements.txt",
  "requirements-dev.txt",
  "uv.lock",
  "poetry.lock",
  "Pipfile",
  "setup.py",
  "setup.cfg",
  "pytest.ini",
  "tox.ini",
  "mypy.ini",
  "ruff.toml",
  "next.config.js",
  "next.config.mjs",
  "next.config.ts",
  "vercel.json",
  "netlify.toml",
  "firebase.json",
  "Dockerfile",
  ".github/workflows",
];

export function isDocFile(path: string): boolean {
  return DOC_EXTENSIONS.some((extension) => path.endsWith(extension));
}

export function isCodeFile(path: string): boolean {
  return CODE_EXTENSIONS.some((extension) => path.endsWith(extension));
}

export function isTestFile(path: string): boolean {
  return (
    /(^|\/|\\)(__tests__|tests?|specs?)(\/|\\)/i.test(path) ||
    /\.(test|spec)\.[cm]?[jt]sx?$/i.test(path) ||
    /(^|\/|\\)test_[^/\\]+\.py$/i.test(path) ||
    /(^|\/|\\)[^/\\]+_test\.py$/i.test(path)
  );
}

export function isConfigFile(path: string): boolean {
  const normalized = path.replace(/\\/g, "/");
  return CONFIG_NAMES.some((name) => normalized.endsWith(name) || normalized.includes(name));
}

export function isRiskFile(path: string): boolean {
  const normalized = path.replace(/\\/g, "/").toLowerCase();
  return (
    normalized.includes("/api/") ||
    normalized.endsWith("middleware.ts") ||
    normalized.endsWith("middleware.js") ||
    normalized.includes("auth") ||
    normalized.includes("permission") ||
    normalized.includes("upload") ||
    normalized.includes("webhook") ||
    normalized.includes("views.py") ||
    normalized.includes("serializers.py") ||
    normalized.includes("schemas.py") ||
    normalized.includes("main.py") ||
    normalized.includes("route.ts") ||
    normalized.includes("server-action")
  );
}
