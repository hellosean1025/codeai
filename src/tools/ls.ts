import { z } from "zod";
import { readdirSync, statSync } from "fs";
import { join, relative, isAbsolute, resolve, sep, basename } from "path";
import { Tool } from "../query.js";

const MAX_FILES = 1000;

type TreeNode = {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: TreeNode[];
};

export const lsTool: Tool = {
  name: "ls",
  description: async () => {
    return `List directory contents in a tree structure.

Features:
- Recursively lists all files and directories
- Displays results in a tree format
- Skips hidden files (starting with .)
- Skips common build/cache directories (node_modules, __pycache__, etc.)
- Limit of ${MAX_FILES} files to prevent overwhelming output

Output format:
- /absolute/path/
  - file1.txt
  - directory/
    - nested-file.js
    - another-dir/

Best practices:
- Use for understanding directory structure
- For finding specific files, use glob tool instead
- For searching file contents, use grep tool instead`;
  },
  inputSchema: z.object({
    path: z
      .string()
      .describe("The absolute path to the directory to list (must be absolute, not relative)"),
  }),
  isReadOnly: () => true,
  execute: async (input: { path: string }) => {
    try {
      const fullPath = isAbsolute(input.path)
        ? input.path
        : resolve(process.cwd(), input.path);

      const files = listDirectory(fullPath, process.cwd());

      if (files.length === 0) {
        return "Directory is empty";
      }

      const tree = createFileTree(files);
      let result = printTree(tree, fullPath);

      if (files.length >= MAX_FILES) {
        result =
          `⚠️  Results truncated at ${MAX_FILES} files. Use more specific path or glob tool.\n\n` +
          result;
      }

      return result;
    } catch (error) {
      throw new Error(
        `Failed to list directory: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  },
};

function listDirectory(initialPath: string, cwd: string): string[] {
  const results: string[] = [];
  const queue = [initialPath];

  while (queue.length > 0 && results.length < MAX_FILES) {
    const path = queue.shift()!;

    if (shouldSkip(path)) {
      continue;
    }

    if (path !== initialPath) {
      results.push(relative(initialPath, path) + sep);
    }

    try {
      const children = readdirSync(path, { withFileTypes: true });

      for (const child of children) {
        if (results.length >= MAX_FILES) break;

        const childPath = join(path, child.name);

        if (shouldSkip(childPath)) {
          continue;
        }

        if (child.isDirectory()) {
          queue.push(childPath);
        } else {
          results.push(relative(initialPath, childPath));
        }
      }
    } catch (error) {
      continue;
    }
  }

  return results.sort();
}

function createFileTree(sortedPaths: string[]): TreeNode[] {
  const root: TreeNode[] = [];

  for (const path of sortedPaths) {
    const parts = path.split(sep);
    let currentLevel = root;
    let currentPath = "";

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!part) continue;

      currentPath = currentPath ? `${currentPath}${sep}${part}` : part;
      const isLastPart = i === parts.length - 1;

      const existingNode = currentLevel.find((node) => node.name === part);

      if (existingNode) {
        currentLevel = existingNode.children || [];
      } else {
        const newNode: TreeNode = {
          name: part,
          path: currentPath,
          type: isLastPart ? "file" : "directory",
        };

        if (!isLastPart) {
          newNode.children = [];
        }

        currentLevel.push(newNode);
        currentLevel = newNode.children || [];
      }
    }
  }

  return root;
}

function printTree(tree: TreeNode[], rootPath: string, level = 0, prefix = ""): string {
  let result = "";

  if (level === 0) {
    result += `- ${rootPath}${sep}\n`;
    prefix = "  ";
  }

  for (const node of tree) {
    result += `${prefix}- ${node.name}${node.type === "directory" ? sep : ""}\n`;

    if (node.children && node.children.length > 0) {
      result += printTree(node.children, rootPath, level + 1, `${prefix}  `);
    }
  }

  return result;
}

function shouldSkip(path: string): boolean {
  const name = basename(path);

  if (name.startsWith(".") && name !== ".") {
    return true;
  }

  const skipDirs = [
    "node_modules",
    "__pycache__",
    "dist",
    "build",
    ".next",
    "coverage",
    ".nuxt",
    ".output",
    "target",
    "out",
  ];

  if (skipDirs.includes(name)) {
    return true;
  }

  return false;
}
