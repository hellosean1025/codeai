import React, { useEffect, useState } from "react";
import { Box, Text } from "ink";
import { getTodoList, addTodoListener } from "../../tools/todo.js";
export const TodoList = () => {
    const [todos, setTodos] = useState([]);
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
    return (React.createElement(Box, { flexDirection: "column", marginTop: 1, marginBottom: 1 },
        React.createElement(Text, { bold: true, underline: true }, "Todos:"),
        todos.map((todo, idx) => {
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
            return (React.createElement(Box, { key: idx, marginLeft: 2 },
                React.createElement(Text, { color: statusColor },
                    statusSymbol,
                    " ",
                    todo.status === "in_progress" ? todo.activeForm : todo.content)));
        })));
};
//# sourceMappingURL=TodoList.js.map