export type TransportMode = "stdio" | "http";

export type RuntimeConfig = {
  transport: TransportMode;
  host: string;
  port: number;
  publicBaseUrl: string;
  apiKey?: string;
  requireApiKey: boolean;
  allowedOrigins: string[];
  allowedRoots: string[];
};

type Env = Record<string, string | undefined>;

const DEFAULT_PORT = 3000;
const DEFAULT_HOST = "127.0.0.1";

export function parseRuntimeConfig(
  argv = process.argv.slice(2),
  env: Env = process.env,
): RuntimeConfig {
  const args = parseArgs(argv);
  const transport = parseTransport(args.get("transport") ?? env.CODEAUDIT_TRANSPORT ?? "stdio");
  const host = args.get("host") ?? env.CODEAUDIT_HOST ?? DEFAULT_HOST;
  const port = parsePort(args.get("port") ?? env.PORT ?? env.CODEAUDIT_PORT ?? `${DEFAULT_PORT}`);
  const apiKey = args.get("api-key") ?? env.CODEAUDIT_API_KEY;
  const requireApiKey =
    args.has("require-api-key") || env.CODEAUDIT_REQUIRE_API_KEY === "true" || Boolean(apiKey);
  const allowedOrigins = parseCsv(args.get("allow-origin") ?? env.CODEAUDIT_ALLOWED_ORIGINS ?? "*");
  const allowedRootsValue = args.get("allowed-roots") ?? env.CODEAUDIT_ALLOWED_ROOTS;
  const allowedRoots = allowedRootsValue
    ? parseCsv(allowedRootsValue)
    : transport === "http"
      ? [process.cwd()]
      : [];
  const publicBaseUrl =
    args.get("public-base-url") ?? env.CODEAUDIT_PUBLIC_BASE_URL ?? `http://${host}:${port}`;

  if (transport === "stdio" && (args.has("port") || args.has("host") || args.has("allow-origin"))) {
    throw new Error("--port, --host, and --allow-origin are only valid with --transport http.");
  }

  if (transport === "http" && requireApiKey && !apiKey) {
    throw new Error(
      "HTTP API key protection was requested but CODEAUDIT_API_KEY or --api-key was not provided.",
    );
  }

  return {
    transport,
    host,
    port,
    publicBaseUrl,
    apiKey,
    requireApiKey,
    allowedOrigins,
    allowedRoots,
  };
}

function parseArgs(argv: string[]): Map<string, string> {
  const values = new Map<string, string>();
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg?.startsWith("--")) continue;
    const [rawKey, inlineValue] = arg.slice(2).split("=", 2);
    if (!rawKey) continue;
    if (inlineValue !== undefined) {
      values.set(rawKey, inlineValue);
      continue;
    }
    const next = argv[index + 1];
    if (next && !next.startsWith("--")) {
      values.set(rawKey, next);
      index += 1;
      continue;
    }
    values.set(rawKey, "true");
  }
  return values;
}

function parseTransport(value: string): TransportMode {
  if (value === "stdio" || value === "http") return value;
  throw new Error(`Invalid transport "${value}". Expected "stdio" or "http".`);
}

function parsePort(value: string): number {
  const port = Number.parseInt(value, 10);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error(`Invalid port "${value}". Expected an integer from 1 to 65535.`);
  }
  return port;
}

function parseCsv(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
