import { describe, expect, test } from "vitest";
import { generateIssuePlanTool } from "../../apps/mcp-server/src/tools/generate-issue-plan.js";

describe("generate_issue_plan", () => {
  test("groups findings into prioritized issues", async () => {
    const result = await generateIssuePlanTool({
      findings: [
        {
          id: "f1",
          title: "Add centralized API input validation",
          category: "security",
          severity: "high",
          file: "app/api/chat/route.ts",
          evidence: "POST route lacks schema validation.",
          recommendation: "Add zod validation.",
          confidence: 0.9,
        },
        {
          id: "f2",
          title: "Add docs evidence map",
          category: "docs",
          severity: "medium",
          file: "README.md",
          evidence: "README claims secure without evidence map.",
          recommendation: "Add evidence map.",
          confidence: 0.8,
        },
      ],
    });

    expect(result.issues).toHaveLength(2);
    expect(result.issues[0].priority).toBe("P0");
    expect(result.issues[1].priority).toBe("P1");
    expect(result.issues[0].suggestedBranchName).toMatch(/^fix\//);
  });
});
