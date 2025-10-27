import { z } from "zod";
import { glob as globLib } from "glob";
import { relative, isAbsolute, resolve } from "path";
export const globTool = {
    name: "glob",
    description: async () => {
        return `Fast file pattern matching tool for finding files by name patterns.

Usage:
- Supports glob patterns like "**/*.js", "src/**/*.ts", "*.{json,yaml}"
- Returns matching file paths sorted by modification time (newest first)
- Results are relative to the search path

Glob pattern syntax:
- * - Matches any characters except /
- ** - Matches any characters including /
- ? - Matches a single character
- [abc] - Matches any character in the set
- {a,b} - Matches either pattern

Examples:
- "**/*.ts" - All TypeScript files recursively
- "src/**/*.test.js" - All test files in src/
- "*.{json,yaml,yml}" - All JSON and YAML files in current dir
- "components/**/index.tsx" - All index.tsx in components/

Performance notes:
- Limit is 100 files by default
- For large codebases, use more specific patterns
- Use 'path' parameter to narrow search scope`;
    },
    inputSchema: z.object({
        pattern: z.string().describe("The glob pattern to match files against (e.g., '**/*.ts')"),
        path: z
            .string()
            .optional()
            .describe("Directory to search in (defaults to current working directory)"),
    }),
    isReadOnly: () => true,
    execute: async (input) => {
        try {
            const searchPath = input.path || process.cwd();
            const absolutePath = isAbsolute(searchPath)
                ? searchPath
                : resolve(process.cwd(), searchPath);
            const files = await globLib(input.pattern, {
                cwd: absolutePath,
                nodir: true,
                stat: true,
                withFileTypes: true,
                ignore: [
                    "**/node_modules/**",
                    "**/.git/**",
                    "**/dist/**",
                    "**/build/**",
                    "**/.next/**",
                    "**/coverage/**",
                ],
            });
            const sortedFiles = files
                .sort((a, b) => {
                const aMtime = a.mtimeMs || 0;
                const bMtime = b.mtimeMs || 0;
                return bMtime - aMtime;
            })
                .slice(0, 100);
            if (sortedFiles.length === 0) {
                return `No files found matching pattern: ${input.pattern}`;
            }
            const relativePaths = sortedFiles.map((file) => relative(process.cwd(), file.fullpath()));
            const truncated = files.length > 100;
            let result = relativePaths.join("\n");
            if (truncated) {
                result += `\n\n(Results truncated at 100 files. Found ${files.length} total. Use more specific pattern.)`;
            }
            return result;
        }
        catch (error) {
            throw new Error(`Glob search failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    },
};
//# sourceMappingURL=glob.js.map