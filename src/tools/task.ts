import { z } from "zod";
import { query, Message, Tool, QueryOptions } from "../query.js";


export function getEnvInfo(){
  return `Here is useful information about the environment you are running in:
<env>
Working directory: ${process.cwd()}
Today's date: ${new Date().toLocaleDateString()}
</env>`
}

export function getAgentPrompt(description){
  return `
You are a general-purpose agent. Given the user's task, use the tools available to complete it efficiently and thoroughly.

# When to use your capabilities:
- Searching for code, configurations, and patterns across large codebases
- Analyzing multiple files to understand system architecture  
- Investigating complex questions that require exploring many files
- Performing multi-step research tasks

# Guidelines:
- For file searches: Use Grep or Glob when you need to search broadly. Use FileRead when you know the specific file path.
- For analysis: Start broad and narrow down. Use multiple search strategies if the first doesn't yield results.
- Be thorough: Check multiple locations, consider different naming conventions, look for related files.
- Complete tasks directly using your capabilities.

# Task Description:
${description}

# Notes:
1. IMPORTANT: You should be concise, direct, and to the point, since your responses will be displayed on a command line interface. Answer the user's question directly, without elaboration, explanation, or details. One word answers are best. Avoid introductions, conclusions, and explanations. You MUST avoid text before/after your response, such as "The answer is <answer>.", "Here is the content of the file..." or "Based on the information provided, the answer is..." or "Here is what I will do next...".
2. When relevant, share file names and code snippets relevant to the query
3. Any file paths you return in your final response MUST be absolute. DO NOT use relative paths.`,
    `${getEnvInfo()}`
}

export const taskTool: Tool = {
  name: "task",
  description: async () => {
    return `Launch a new task to handle complex, multi-step tasks autonomously.
 
When to use the task tool:
* When you determine that a task is too complex and the context may exceed LLM limits, please break down complex tasks so that individual task contexts remain within the model's limitations
* If the task description mentions that it should be used proactively

Usage notes:
1. Launch multiple tasks concurrently whenever possible, to maximize performance; to do that, use a single message with multiple tool uses
2. When the task is done, it will return a single message back to you. The result returned by the task is not visible to the user. To show the user the result, you should send a text message back to the user with a concise summary of the result.
3. Each task invocation is stateless. You will not be able to send additional messages to the task, nor will the task be able to communicate with you outside of its final report. Therefore, your prompt should contain a highly detailed task description for the task to perform autonomously and you should specify exactly what information the task should return back to you in its final and only message to you.
4. The task's outputs should generally be trusted
5. Clearly tell the task whether you expect it to write code or just to do research (search, file reads, web fetches, etc.), since it is not aware of the user's intent
    `;
  },
  inputSchema: z.object({
    description: z.string().describe("A short (3-5 word) description of the task"),
    prompt: z.string().describe("The task for the agent to perform"),
  }),
  isReadOnly: () => false,
  execute: async (input: {
    description: string;
    prompt: string;
  }) => {
    try {
      const messages: Message[] = [
        {
          type: "user",
          content: input.prompt,
        },
      ];
      const {allTools} = await import('./index.js');
      const subAgentTools: Tool[] = allTools.filter(item=> item.name !== 'task');

      const systemPrompt = getAgentPrompt(input.description);

      const options: QueryOptions = {
        systemPrompt,
        tools: subAgentTools,
        verbose: false,
      };

      const results: Message[] = [];
      for await (const message of query(messages, options)) {
        console.info('Assistant:', message)
        results.push(message);
      }

      const finalAssistantMessage = results
        .filter((m) => m.type === "assistant")
        .pop();

      if (!finalAssistantMessage) {
        return "Task completed but no response was generated";
      }

      return `Task "${input.description}" completed:\n\n${finalAssistantMessage.content}`;
    } catch (error) {
      throw new Error(
        `Task execution failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  },
};
