import { detectProject } from "../lib/project-detectors.js";
import type { DetectProjectInput } from "../schemas/tool-inputs.js";

export async function detectProjectTool(input: DetectProjectInput) {
  return detectProject(input.projectPath);
}
