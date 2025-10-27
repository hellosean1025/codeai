import { z } from "zod";
import { readFile, writeFile } from "fs/promises";
import { Tool } from "../query.js";

export const editTool: Tool = {
  name: "edit",
  description: "Perform exact string replacement in a file. The old_string must match exactly (including whitespace).",
  inputSchema: z.object({
    file_path: z.string().describe("The absolute path to the file to edit"),
    old_string: z.string().describe("The exact text to replace (must be unique in the file)"),
    new_string: z.string().describe("The text to replace it with"),
    replace_all: z.boolean().optional().default(false).describe("Replace all occurrences (default: false, requires uniqueness)"),
  }),
  isReadOnly: () => false,
  execute: async (input: {
    file_path: string;
    old_string: string;
    new_string: string;
    replace_all?: boolean;
  }) => {
    try {
      const content = await readFile(input.file_path, "utf-8");

      if (!content.includes(input.old_string)) {
        throw new Error(`String not found in file: "${input.old_string.substring(0, 100)}..."`);
      }

      if (!input.replace_all) {
        const occurrences = content.split(input.old_string).length - 1;
        if (occurrences > 1) {
          throw new Error(
            `String appears ${occurrences} times in file. Use replace_all: true or provide more context to make it unique.`
          );
        }
      }

      const newContent = input.replace_all
        ? content.split(input.old_string).join(input.new_string)
        : content.replace(input.old_string, input.new_string);

      await writeFile(input.file_path, newContent, "utf-8");

      const replacementCount = input.replace_all
        ? content.split(input.old_string).length - 1
        : 1;

      return `Successfully replaced ${replacementCount} occurrence(s) in ${input.file_path}`;
    } catch (error) {
      throw new Error(
        `Failed to edit file ${input.file_path}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  },
};
