import { z } from "zod";
import { readdir, readFile, stat } from "fs/promises";
import { join, relative } from "path";
export const grepTool = {
    name: "grep",
    description: "Search for patterns in files using regular expressions",
    inputSchema: z.object({
        pattern: z.string().describe("The regex pattern to search for"),
        path: z.string().optional().describe("The directory or file to search in (defaults to current directory)"),
        file_pattern: z.string().optional().describe("Glob pattern to filter files (e.g., '*.ts', '*.{js,ts}')"),
        case_insensitive: z.boolean().optional().default(false).describe("Case insensitive search"),
        show_line_numbers: z.boolean().optional().default(true).describe("Show line numbers in output"),
        max_results: z.number().optional().default(100).describe("Maximum number of matches to return"),
    }),
    isReadOnly: () => true,
    execute: async (input) => {
        try {
            const searchPath = input.path || process.cwd();
            const flags = input.case_insensitive ? "gi" : "g";
            const regex = new RegExp(input.pattern, flags);
            const results = [];
            let matchCount = 0;
            const matchesFilePattern = (filename) => {
                if (!input.file_pattern)
                    return true;
                const pattern = input.file_pattern
                    .replace(/\*/g, ".*")
                    .replace(/\?/g, ".")
                    .replace(/\{([^}]+)\}/g, (_, group) => `(${group.replace(/,/g, "|")})`);
                return new RegExp(`^${pattern}$`).test(filename);
            };
            const searchFile = async (filePath) => {
                try {
                    const stats = await stat(filePath);
                    if (stats.isDirectory()) {
                        const entries = await readdir(filePath);
                        for (const entry of entries) {
                            if (entry.startsWith(".") || entry === "node_modules")
                                continue;
                            await searchFile(join(filePath, entry));
                            if (matchCount >= (input.max_results || 100))
                                break;
                        }
                    }
                    else if (stats.isFile()) {
                        const filename = filePath.split("/").pop() || "";
                        if (!matchesFilePattern(filename))
                            return;
                        const content = await readFile(filePath, "utf-8");
                        const lines = content.split("\n");
                        const relativePath = relative(process.cwd(), filePath);
                        for (let i = 0; i < lines.length; i++) {
                            if (matchCount >= (input.max_results || 100))
                                break;
                            const line = lines[i];
                            if (regex.test(line)) {
                                matchCount++;
                                const lineNum = input.show_line_numbers ? `${i + 1}:` : "";
                                results.push(`${relativePath}:${lineNum}${line}`);
                            }
                        }
                    }
                }
                catch (error) {
                }
            };
            await searchFile(searchPath);
            if (results.length === 0) {
                return `No matches found for pattern: ${input.pattern}`;
            }
            const truncated = matchCount >= (input.max_results || 100)
                ? `\n... (truncated at ${input.max_results} matches)`
                : "";
            return results.join("\n") + truncated;
        }
        catch (error) {
            throw new Error(`Grep failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    },
};
//# sourceMappingURL=grep.js.map