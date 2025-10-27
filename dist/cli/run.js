import { getSystemPrompt } from "../prompt.js";
import { query } from "../query.js";
import { allTools } from "../tools/index.js";
export async function* runQuery(input, options) {
    const messages = typeof input === "string"
        ? [
            {
                type: "user",
                content: input,
                timestamp: Date.now(),
            },
        ]
        : input;
    const opts = {
        systemPrompt: getSystemPrompt(),
        tools: allTools,
        maxIterations: options?.maxIterations,
        verbose: options?.verbose ?? false,
    };
    yield* query(messages, opts);
}
//# sourceMappingURL=run.js.map