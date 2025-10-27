#!/usr/bin/env node
import React, { useState, useEffect } from "react";
import { render, Box, Text, useApp, useInput } from "ink";
import TextInput from "ink-text-input";
import { runQuery } from "./run.js";
import { TodoList } from "./components/TodoList.js";
import { MessageLog } from "./components/MessageLog.js";
import { Message } from "../query.js";
import { resetTodoList } from "../tools/todo.js";
import { Input } from "./components/Input.js";

interface AppProps {
  initialInput?: string;
}

const App: React.FC<AppProps> = ({ initialInput }) => {
  const { exit } = useApp();
  const [messages, setMessages] = useState<Message[]>(
    initialInput
      ? [
          {
            type: "user",
            content: initialInput,
            timestamp: Date.now(),
          },
        ]
      : []
  );
  const [isRunning, setIsRunning] = useState(!!initialInput);
  const [error, setError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isInputMode, setIsInputMode] = useState(!initialInput);

  useInput((input, key) => {
    if (key.escape) {
      exit();
    }
  });

  const handleSubmit = async (value: string) => {
    if (!value.trim()) return;

    const userMessage: Message = {
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
        if(message.type === 'assistant'){
          setMessages((prev) => [...prev, message]);
        }else{
          console.log(message.type, message.content)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsRunning(false);
      setIsInputMode(true);
    }
  };

  useEffect(() => {
    if (!initialInput) return;

    const executeQuery = async () => {
      try {
        for await (const message of runQuery(messages, { verbose: false })) {
          setMessages((prev) => [...prev, message]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setIsRunning(false);
        setIsInputMode(true);
      }
    };

    executeQuery();
  }, []);

  return (
    <Box flexDirection="column" height="100%">
      <Box flexDirection="column" padding={1} flexGrow={1}>
        <Text bold color="blue">
          ═══════════════════════════════════════════════════
        </Text>
        <Text bold color="blue">
          CodeAI
        </Text>
        <Text bold color="blue">
          ═══════════════════════════════════════════════════
        </Text>

        <MessageLog messages={messages} />

        {error && (
          <Box marginTop={1}>
            <Text color="red" bold>
              ❌ Error: {error}
            </Text>
          </Box>
        )}

        {isRunning && (
          <Box marginTop={1}>
            <Text color="yellow" bold>
              ⏳ Running...
            </Text>
          </Box>
        )}
      </Box>

      <Box flexDirection="column" paddingX={1}>
        <TodoList />
      </Box>

      {isInputMode && !isRunning && (
        <Box flexDirection="column" paddingX={1} paddingY={2} borderStyle="double" borderColor="cyan">
          <Box>
            <Text color="green" bold>
              💬 {" "}
            </Text>
            <Input
              handleSubmit={handleSubmit}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
};

async function main() {
  const args = process.argv.slice(2);
  const initialInput = args.length > 0 ? args.join(" ") : undefined;

  resetTodoList();

  render(<App initialInput={initialInput} />);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
