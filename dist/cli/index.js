#!/usr/bin/env node
import React, { useState, useEffect } from "react";
import { render, Box, Text, useApp, useInput } from "ink";
import { runQuery } from "./run.js";
import { TodoList } from "./components/TodoList.js";
import { MessageLog } from "./components/MessageLog.js";
import { resetTodoList } from "../tools/todo.js";
import { Input } from "./components/Input.js";
const App = ({ initialInput }) => {
    const { exit } = useApp();
    const [messages, setMessages] = useState(initialInput
        ? [
            {
                type: "user",
                content: initialInput,
                timestamp: Date.now(),
            },
        ]
        : []);
    const [isRunning, setIsRunning] = useState(!!initialInput);
    const [error, setError] = useState(null);
    const [inputValue, setInputValue] = useState("");
    const [isInputMode, setIsInputMode] = useState(!initialInput);
    useInput((input, key) => {
        if (key.escape) {
            exit();
        }
    });
    const handleSubmit = async (value) => {
        if (!value.trim())
            return;
        const userMessage = {
            type: "user",
            content: value,
            timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, userMessage]);
        setInputValue("");
        setIsInputMode(false);
        setIsRunning(true);
        setError(null);
        try {
            for await (const message of runQuery(messages.concat(userMessage), {
                verbose: false,
            })) {
                if (message.type === 'assistant') {
                    setMessages((prev) => [...prev, message]);
                }
                else {
                    console.log(message.type, message.content);
                }
            }
        }
        catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        }
        finally {
            setIsRunning(false);
            setIsInputMode(true);
        }
    };
    useEffect(() => {
        if (!initialInput)
            return;
        const executeQuery = async () => {
            try {
                for await (const message of runQuery(messages, { verbose: false })) {
                    setMessages((prev) => [...prev, message]);
                }
            }
            catch (err) {
                setError(err instanceof Error ? err.message : String(err));
            }
            finally {
                setIsRunning(false);
                setIsInputMode(true);
            }
        };
        executeQuery();
    }, []);
    return (React.createElement(Box, { flexDirection: "column", height: "100%" },
        React.createElement(Box, { flexDirection: "column", padding: 1, flexGrow: 1 },
            React.createElement(Text, { bold: true, color: "blue" }, "\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550"),
            React.createElement(Text, { bold: true, color: "blue" }, "CodeAI"),
            React.createElement(Text, { bold: true, color: "blue" }, "\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550"),
            React.createElement(MessageLog, { messages: messages }),
            error && (React.createElement(Box, { marginTop: 1 },
                React.createElement(Text, { color: "red", bold: true },
                    "\u274C Error: ",
                    error))),
            isRunning && (React.createElement(Box, { marginTop: 1 },
                React.createElement(Text, { color: "yellow", bold: true }, "\u23F3 Running...")))),
        React.createElement(Box, { flexDirection: "column", paddingX: 1 },
            React.createElement(TodoList, null)),
        isInputMode && !isRunning && (React.createElement(Box, { flexDirection: "column", paddingX: 1, paddingY: 2, borderStyle: "double", borderColor: "cyan" },
            React.createElement(Box, null,
                React.createElement(Text, { color: "green", bold: true },
                    "\uD83D\uDCAC ",
                    " "),
                React.createElement(Input, { handleSubmit: handleSubmit }))))));
};
async function main() {
    const args = process.argv.slice(2);
    const initialInput = args.length > 0 ? args.join(" ") : undefined;
    resetTodoList();
    render(React.createElement(App, { initialInput: initialInput }));
}
main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map