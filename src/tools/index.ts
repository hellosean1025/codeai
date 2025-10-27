export { readTool } from "./read.js";
export { writeTool } from "./write.js";
export { editTool } from "./edit.js";
export { grepTool } from "./grep.js";
export { todoTool, getTodoList, resetTodoList } from "./todo.js";
export { taskTool } from "./task.js";
export { bashTool } from "./bash.js";
export { globTool } from "./glob.js";
export { lsTool } from "./ls.js";

import { Tool } from "../query.js";
import { readTool } from "./read.js";
import { writeTool } from "./write.js";
import { editTool } from "./edit.js";
import { grepTool } from "./grep.js";  
import { todoTool } from "./todo.js";
import { taskTool } from "./task.js";
import { bashTool } from "./bash.js";
import { globTool } from "./glob.js";
import { lsTool } from "./ls.js";

export const allTools: Tool[] = [
  readTool,
  writeTool,
  editTool,
  grepTool,
  todoTool,
  taskTool,
  bashTool,
  globTool,
  lsTool,
];

export const readOnlyTools: Tool[] = [
  readTool,
  grepTool,
  todoTool,
  globTool,
  lsTool,
];

export const writeTools: Tool[] = [
  writeTool,
  editTool,
  bashTool,
];

export const fileTools: Tool[] = [
  readTool,
  writeTool,
  editTool,
  grepTool,
  globTool,
  lsTool,
];

export const systemTools: Tool[] = [
  bashTool,
];

export const getToolsByName = (names: string[]): Tool[] => {
  return allTools.filter(tool => names.includes(tool.name));
};
