import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";
import { Tool } from "../query.js";

const execAsync = promisify(exec);

export const bashTool: Tool = {
  name: "bash",
  description: async () => {
    return `Executes shell commands in a bash environment.

IMPORTANT usage notes:
- Default timeout is 120 seconds (120000ms), max is 600 seconds
- Commands run in the current working directory
- Use '&&' to chain dependent commands (e.g., "cd dir && ls")
- Use ';' to run independent commands sequentially
- Quote file paths with spaces using double quotes

Best practices:
- Prefer specialized tools (read, write, edit) over bash equivalents (cat, echo, sed)
- Use bash for: git, npm, docker, build tools, system commands
- Avoid bash for: file reading (use read), file writing (use write), search (use grep)

Security:
- Dangerous commands are blocked (rm -rf /, mkfs, dd, etc.)
- Commands execute with current user permissions`;
  },
  inputSchema: z.object({
    command: z.string().describe("The shell command to execute"),
    timeout: z
      .number()
      .optional()
      .default(120000)
      .describe("Timeout in milliseconds (max 600000ms / 10 minutes)"),
  }),
  isReadOnly: () => false,
  execute: async (input: { command: string; timeout?: number }) => {
    const timeout = Math.min(input.timeout || 120000, 600000);

    const dangerousPatterns = [
      /rm\s+(-rf?|--recursive)\s+\/\s*$/,
      /mkfs/,
      /dd\s+if=/,
      /:\(\)\{.*\};\s*:/,
      /wget.*\|.*sh/,
      /curl.*\|.*sh/,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(input.command)) {
        throw new Error(
          "Command blocked for security reasons. Dangerous command pattern detected."
        );
      }
    }

    try {
      const { stdout, stderr } = await execAsync(input.command, {
        timeout,
        maxBuffer: 10 * 1024 * 1024,
        cwd: process.cwd(),
        shell: "/bin/bash",
      });

      let output = "";
      if (stdout.trim()) {
        output += stdout.trim();
      }
      if (stderr.trim()) {
        if (output) output += "\n";
        output += `[stderr]\n${stderr.trim()}`;
      }

      return output || "(command completed with no output)";
    } catch (error: any) {
      let errorMsg = "";

      if (error.killed) {
        errorMsg = `Command timed out after ${timeout}ms`;
      } else if (error.code !== undefined) {
        errorMsg = `Command exited with code ${error.code}`;
      } else {
        errorMsg = `Command failed: ${error.message}`;
      }

      if (error.stdout?.trim()) {
        errorMsg += `\n\n[stdout]\n${error.stdout.trim()}`;
      }
      if (error.stderr?.trim()) {
        errorMsg += `\n\n[stderr]\n${error.stderr.trim()}`;
      }

      throw new Error(errorMsg);
    }
  },
};
