import React from "react";
import { Box, Text } from "ink";
export const MessageLog = ({ messages }) => {
    return (React.createElement(Box, { flexDirection: "column" }, messages.map((message, idx) => {
        if (message.type === "assistant") {
            return (React.createElement(Box, { key: idx, flexDirection: "column", marginTop: 1 },
                React.createElement(Text, { color: "cyan", bold: true }, "\uD83D\uDCAD Assistant:"),
                React.createElement(Box, { marginLeft: 2 },
                    React.createElement(Text, null, message.content)),
                message.toolCalls && message.toolCalls.length > 0 && (React.createElement(Box, { marginLeft: 2, marginTop: 1 },
                    React.createElement(Text, { color: "magenta" },
                        "\uD83D\uDD27 Calling tools: ",
                        message.toolCalls.map((t) => t.name).join(", "))))));
        }
        else if (message.type === "tool") {
            const preview = message.content.length > 200
                ? message.content.substring(0, 200) + "..."
                : message.content;
            return (React.createElement(Box, { key: idx, marginLeft: 2, marginTop: 1 },
                React.createElement(Text, { color: "gray" },
                    "\uD83D\uDCE6 Tool result: ",
                    preview)));
        }
        else if (message.type === "user") {
            return (React.createElement(Box, { key: idx, flexDirection: "column", marginBottom: 1 },
                React.createElement(Text, { color: "green", bold: true }, "\uD83D\uDC64 User:"),
                React.createElement(Box, { marginLeft: 2 },
                    React.createElement(Text, null, message.content))));
        }
        return null;
    })));
};
//# sourceMappingURL=MessageLog.js.map