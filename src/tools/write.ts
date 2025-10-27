import { z } from "zod";
import { writeFile, mkdir } from "fs/promises";
import { dirname, resolve } from "path";
import { Tool } from "../query.js";

export const writeTool: Tool = {
  name: "write",
  description: "Write a file to the local filesystem, creating it if it doesn't exist or overwriting if it does",
  inputSchema: z.object({
    file_path: z.string().describe("The path to the file to write"),
    content: z.string().describe("The content to write to the file"),
  }),
  isReadOnly: () => false,
  execute: async (input: { file_path: string; content: string }) => {
    // 如果是相对路径，请使用 process.cwd join
    const absolutePath = resolve(input.file_path);
    try {
      const allowedBasePaths = new Set([
        process.cwd(),
        '/tmp',
        '/var/tmp'
      ]);
      // 检查是否在安全目录
      const isInAllowedPath = Array.from(allowedBasePaths).some(basePath => 
        absolutePath.startsWith(basePath)
      );
      
      if (!isInAllowedPath) {
        throw new Error(
          `File writing paths only allowed in: ${Array.from(allowedBasePaths).join(', ')}`
        );
      }
      const dir = dirname(absolutePath);
      await mkdir(dir, { recursive: true });

      await writeFile(absolutePath, input.content, "utf-8");

      const lines = input.content.split("\n").length;
      return `Successfully wrote ${lines} lines to ${absolutePath}`;
    } catch (error) {
      throw new Error(
        `Failed to write file ${absolutePath}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  },
};
