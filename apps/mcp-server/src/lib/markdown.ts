export function heading(level: 1 | 2 | 3, text: string): string {
  return `${"#".repeat(level)} ${text}`;
}

export function bullet(items: string[]): string {
  return items.map((item) => `- ${item}`).join("\n");
}

export function table(headers: string[], rows: string[][]): string {
  const header = `| ${headers.join(" | ")} |`;
  const separator = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows.map((row) => `| ${row.map(escapeCell).join(" | ")} |`).join("\n");
  return [header, separator, body].filter(Boolean).join("\n");
}

function escapeCell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\n/g, "<br>");
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}
