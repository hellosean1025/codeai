import { z } from "zod";
import { readFile } from "fs/promises";
import { Tool } from "../query.js";

export const readTool: Tool = {
  name: "read",
  description: "Read the contents of a file from the filesystem",
  inputSchema: z.object({
    file_path: z.string().describe("The absolute path to the file to read"),
    offset: z.number().optional().describe("The line number to start reading from (0-based)"),
    limit: z.number().optional().describe("The maximum number of lines to read"),
  }),
  isReadOnly: () => true,
  execute: async (input: { file_path: string; offset?: number; limit?: number }) => {
    try {
      const content = await readFile(input.file_path, "utf-8");
      const lines = content.split("\n");

      const startLine = input.offset ?? 0;
      const endLine = input.limit ? startLine + input.limit : lines.length;
      const selectedLines = lines.slice(startLine, endLine);

      const formatted = selectedLines
        .map((line, idx) => `${startLine + idx + 1}→${line}`)
        .join("\n");

      return formatted || "(empty file)";
    } catch (error) {
      throw new Error(
        `Failed to read file ${input.file_path}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  },
};
