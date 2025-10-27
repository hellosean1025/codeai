import { getSystemPrompt } from "../prompt.js";
import { query, Message } from "../query.js";
import { allTools } from "../tools/index.js";



export async function* runQuery(
  input: string | Message[],
  options?: {
    maxIterations?: number;
    verbose?: boolean;
  }
): AsyncGenerator<Message, void, unknown> {
  const messages: Message[] = typeof input === "string"
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
  }
  yield * query(messages, opts);
}
