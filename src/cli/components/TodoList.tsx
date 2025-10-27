import React, { useEffect, useState } from "react";
import { Box, Text } from "ink";
import { getTodoList, addTodoListener } from "../../tools/todo.js";
import type{ TodoItem } from "../../tools/todo.js";

export const TodoList: React.FC = () => {
  const [todos, setTodos] = useState<TodoItem[]>([]);

  useEffect(() => {
    const updateTodos = () => {
      setTodos([...getTodoList()]);
    };

    const unsubscribe = addTodoListener(updateTodos);
    updateTodos();

    return unsubscribe;
  }, []);

  if (todos.length === 0) {
    return null;
  }

  return (
    <Box flexDirection="column" marginTop={1} marginBottom={1}>
      <Text bold underline>
        Todos:
      </Text>
      {todos.map((todo, idx) => {
        let statusSymbol = "";
        let statusColor = "gray";

        switch (todo.status) {
          case "completed":
            statusSymbol = "☒";
            statusColor = "green";
            break;
          case "in_progress":
            statusSymbol = "*";
            statusColor = "yellow";
            break;
          case "pending":
            statusSymbol = "☐";
            statusColor = "gray";
            break;
        }

        return (
          <Box key={idx} marginLeft={2}>
            <Text color={statusColor}>
              {statusSymbol} {todo.status === "in_progress" ? todo.activeForm : todo.content}
            </Text>
          </Box>
        );
      })}
    </Box>
  );
};
