import React from "react";
import { Box, Text } from "ink";
import { Message } from "../../query.js";

interface MessageLogProps {
  messages: Message[];
}

export const MessageLog: React.FC<MessageLogProps> = ({ messages }) => {
  return (
    <Box flexDirection="column">
      {messages.map((message, idx) => {
        if (message.type === "assistant") {
          return (
            <Box key={idx} flexDirection="column" marginTop={1}>
              <Text color="cyan" bold>
                💭 Assistant:
              </Text>
              <Box marginLeft={2}>
                <Text>{message.content}</Text>
              </Box>
              {message.toolCalls && message.toolCalls.length > 0 && (
                <Box marginLeft={2} marginTop={1}>
                  <Text color="magenta">
                    🔧 Calling tools: {message.toolCalls.map((t) => t.name).join(", ")}
                  </Text>
                </Box>
              )}
            </Box>
          );
        } else if (message.type === "tool") {
          const preview =
            message.content.length > 200
              ? message.content.substring(0, 200) + "..."
              : message.content;
          return (
            <Box key={idx} marginLeft={2} marginTop={1}>
              <Text color="gray">📦 Tool result: {preview}</Text>
            </Box>
          );
        } else if (message.type === "user") {
          return (
            <Box key={idx} flexDirection="column" marginBottom={1}>
              <Text color="green" bold>
                👤 User:
              </Text>
              <Box marginLeft={2}>
                <Text>{message.content}</Text>
              </Box>
            </Box>
          );
        }
        return null;
      })}
    </Box>
  );
};
