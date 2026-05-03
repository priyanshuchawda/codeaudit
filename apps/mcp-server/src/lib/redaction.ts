const SECRET_PATTERNS: Array<[RegExp, string]> = [
  [/\bgh[pousr]_[A-Za-z0-9_]{20,}\b/g, "GITHUB_TOKEN_REDACTED"],
  [/\bsk-[A-Za-z0-9_-]{20,}\b/g, "OPENAI_KEY_REDACTED"],
  [/\bAIza[0-9A-Za-z_-]{20,}\b/g, "GOOGLE_KEY_REDACTED"],
  [/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, "JWT_REDACTED"],
  [/\b[A-Za-z0-9._%+-]+:[A-Za-z0-9._%+-]+@[\w.-]+\.[A-Za-z]{2,}\b/g, "CREDENTIAL_URL_REDACTED"],
  [/(api[_-]?key|token|secret|password|cookie|authorization)\s*[:=]\s*["']?[^"'\s]+/gi, "$1=REDACTED"],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g, "PRIVATE_KEY_REDACTED"],
];

export function redactSecrets(value: string): string {
  return SECRET_PATTERNS.reduce((current, [pattern, replacement]) => {
    return current.replace(pattern, replacement);
  }, value);
}

export function redactObject<T>(value: T): T {
  return JSON.parse(redactSecrets(JSON.stringify(value))) as T;
}
