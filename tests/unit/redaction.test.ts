import { describe, expect, test } from "vitest";
import { redactSecrets } from "../../apps/mcp-server/src/lib/redaction.js";

describe("redaction", () => {
  test("redacts common secret formats", () => {
    const input = [
      "OPENAI_API_KEY=sk-abcdefghijklmnopqrstuvwxyz123456",
      "token=ghp_abcdefghijklmnopqrstuvwxyz1234567890",
      "jwt=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.signature",
      "password=hunter2",
    ].join("\n");

    const redacted = redactSecrets(input);
    expect(redacted).not.toContain("sk-abcdefghijklmnopqrstuvwxyz123456");
    expect(redacted).not.toContain("ghp_abcdefghijklmnopqrstuvwxyz1234567890");
    expect(redacted).not.toContain("hunter2");
    expect(redacted).toContain("REDACTED");
  });
});
