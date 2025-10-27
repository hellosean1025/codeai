import { z } from "zod";
import { Tool } from "../query.js";

export type TodoItem = {
  content: string;
  status: "pending" | "in_progress" | "completed";
  activeForm: string;
};

let globalTodoList: TodoItem[] = [];

type TodoListener = () => void;
const todoListeners: TodoListener[] = [];

export const addTodoListener = (listener: TodoListener): () => void => {
  todoListeners.push(listener);
  return () => {
    const index = todoListeners.indexOf(listener);
    if (index > -1) {
      todoListeners.splice(index, 1);
    }
  };
};

const notifyTodoListeners = (): void => {
  todoListeners.forEach(listener => {
    try {
      listener();
    } catch (error) {
      console.error('Todo listener error:', error);
    }
  });
};

export const todoTool: Tool = {
  name: "TodoWrite",
  description: "Creates and manages todo items for task tracking and progress management in the current session.",
  inputSchema: z.object({
    action: z.enum(["list", "add", "update", "clear"]).describe("Action to perform on the todo list"),
    todos: z
      .array(
        z.object({
          content: z.string().describe("Task description (imperative form)"),
          status: z.enum(["pending", "in_progress", "completed"]).describe("Task status"),
          activeForm: z.string().describe("Task description in present continuous form"),
        })
      )
      .optional()
      .describe("Complete todo list (for 'update' action)"),
    content: z.string().optional().describe("Task content for 'add' action"),
  }),
  isReadOnly: () => true,
  execute: async (input: {
    action: "list" | "add" | "update" | "clear";
    todos?: TodoItem[];
    content?: string;
  }) => {
    try {
      switch (input.action) {
        case "list":
          if (globalTodoList.length === 0) {
            return "Todo list is empty";
          }
          return globalTodoList
            .map((todo, idx) => {
              const status = {
                pending: "⏸️",
                in_progress: "▶️",
                completed: "✅",
              }[todo.status];
              return `${idx + 1}. ${status} ${todo.content}`;
            })
            .join("\n");

        case "add":
          if (!input.content) {
            throw new Error("Content required for 'add' action");
          }
          globalTodoList.push({
            content: input.content,
            status: "pending",
            activeForm: `${input.content.replace(/^[A-Z]/, (c) => c.toLowerCase())}ing`,
          });
          notifyTodoListeners();
          return `Added todo: ${input.content}`;

        case "update":
          if (!input.todos) {
            throw new Error("Todos array required for 'update' action");
          }
          globalTodoList = input.todos;
          const pending = globalTodoList.filter((t) => t.status === "pending").length;
          const inProgress = globalTodoList.filter((t) => t.status === "in_progress").length;
          const completed = globalTodoList.filter((t) => t.status === "completed").length;
          notifyTodoListeners();
          return `Updated todo list: ${completed} completed, ${inProgress} in progress, ${pending} pending`;

        case "clear":
          const count = globalTodoList.length;
          globalTodoList = [];
          notifyTodoListeners();
          return `Cleared ${count} todos`;

        default:
          throw new Error(`Unknown action: ${input.action}`);
      }
    } catch (error) {
      throw new Error(
        `Todo operation failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  },
};

export const getTodoList = () => globalTodoList;

export const resetTodoList = () => {
  globalTodoList = [];
  notifyTodoListeners();
};

