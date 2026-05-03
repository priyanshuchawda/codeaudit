import { spawn } from "node:child_process";

const ALLOWED_COMMANDS = new Set(["git", "node", "pnpm"]);
const ALLOWED_ARGS = new Map<string, RegExp[]>([
  ["git", [/^status$/, /^rev-parse$/, /^branch$/, /^log$/, /^diff$/]],
  ["node", [/^--version$/]],
  ["pnpm", [/^--version$/]],
]);

export async function runAllowlistedCommand(command: string, args: string[], cwd: string): Promise<string> {
  if (!ALLOWED_COMMANDS.has(command)) {
    throw new Error(`Command is not allowlisted: ${command}`);
  }
  const argRules = ALLOWED_ARGS.get(command) ?? [];
  for (const arg of args) {
    if (arg.startsWith("-") && !argRules.some((rule) => rule.test(arg))) {
      throw new Error(`Command argument is not allowlisted: ${arg}`);
    }
  }

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, shell: false, windowsHide: true });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve(stdout.trim());
      else reject(new Error(stderr.trim() || `${command} exited with ${code}`));
    });
  });
}
