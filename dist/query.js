import { agentModel } from "./llm.js";
import { generateText } from "ai";
async function convertToVercelAITools(tools, options) {
    const result = {};
    for (const t of tools) {
        let desc;
        if (t.prompt) {
            desc = await t.prompt(options);
        }
        else if (typeof t.description === 'function') {
            desc = await t.description();
        }
        else {
            desc = t.description;
        }
        result[t.name] = {
            description: desc,
            parameters: t.inputSchema,
        };
    }
    return result;
}
const sleep = (time = 1000) => {
    return new Promise((resolve => {
        setTimeout(() => {
            resolve(true);
        }, time);
    }));
};
function convertToVercelMessages(messages) {
    const result = [];
    for (const msg of messages) {
        if (msg.type === 'user') {
            result.push({
                role: 'user',
                content: msg.content,
            });
        }
        else if (msg.type === 'assistant') {
            if (msg.toolCalls && msg.toolCalls.length > 0) {
                result.push({
                    role: 'assistant',
                    content: [
                        { type: 'text', text: msg.content },
                        ...msg.toolCalls.map(tc => ({
                            type: 'tool-call',
                            toolCallId: tc.id,
                            toolName: tc.name,
                            args: tc.args,
                        }))
                    ],
                });
            }
            else {
                result.push({
                    role: 'assistant',
                    content: msg.content,
                });
            }
        }
        else if (msg.type === 'tool') {
            result.push({
                role: 'tool',
                content: [
                    {
                        type: 'tool-result',
                        toolCallId: msg.toolCallId,
                        toolName: '',
                        result: msg.content,
                    }
                ],
            });
        }
    }
    return result;
}
async function executeTool(toolUse, tools, verbose) {
    const tool = tools.find(t => t.name === toolUse.name);
    if (!tool) {
        return {
            id: toolUse.id,
            result: `Error: Tool '${toolUse.name}' not found`,
            error: true,
        };
    }
    try {
        if (verbose) {
            console.log(`[Tool] Executing ${toolUse.name} with input:`, toolUse.input);
        }
        const validationResult = tool.inputSchema.safeParse(toolUse.input);
        if (!validationResult.success) {
            return {
                id: toolUse.id,
                result: `Error: Invalid input for tool '${toolUse.name}': ${JSON.stringify(validationResult.error.issues)}`,
                error: true,
            };
        }
        const result = await tool.execute(validationResult.data);
        if (verbose) {
            console.log(`[Tool] ${toolUse.name} result:`, result);
        }
        return { id: toolUse.id, result };
    }
    catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        if (verbose) {
            console.error(`[Tool] ${toolUse.name} failed:`, errorMsg);
        }
        return {
            id: toolUse.id,
            result: `Error executing ${toolUse.name}: ${errorMsg}`,
            error: true,
        };
    }
}
async function executeTools(toolUses, tools, verbose) {
    const allReadOnly = toolUses.every(tu => {
        const tool = tools.find(t => t.name === tu.name);
        return tool?.isReadOnly() ?? false;
    });
    if (allReadOnly && toolUses.length > 1) {
        if (verbose) {
            console.log('[Tools] Executing in parallel (all read-only)');
        }
        return Promise.all(toolUses.map(tu => executeTool(tu, tools, verbose)));
    }
    else {
        if (verbose) {
            console.log('[Tools] Executing serially (contains write operations)');
        }
        const results = [];
        for (const tu of toolUses) {
            results.push(await executeTool(tu, tools, verbose));
        }
        return results;
    }
}
async function* queryInternal(messages, systemPrompt, tools, context) {
    const { iteration, maxIterations, verbose } = context;
    if (maxIterations && iteration > maxIterations) {
        if (verbose) {
            console.log('[Query] Max iterations reached');
        }
        return;
    }
    if (verbose) {
        if (maxIterations) {
            console.log(`\n[Iteration ${iteration}/${maxIterations}]`);
        }
        else {
            console.log(`\n[Iteration ${iteration}]`);
        }
    }
    const vercelMessages = convertToVercelMessages(messages);
    const vercelTools = await convertToVercelAITools(tools, {
        safeMode: false,
    });
    if (verbose) {
        console.log('[LLM] Sending request with', vercelMessages.length, 'messages');
    }
    let result;
    try {
        result = await generateText({
            model: agentModel,
            messages: vercelMessages,
            tools: vercelTools,
            system: systemPrompt
        });
    }
    catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        if (verbose) {
            console.error('[LLM] Request failed:', errorMsg);
        }
        const errorMessage = {
            type: 'assistant',
            content: ` Failed to get response from LLM: ${errorMsg}`,
        };
        yield errorMessage;
        sleep(1000); //给用户查看错误时间，避免快速死循环
        yield* queryInternal([...messages, {
                type: 'user',
                content: `Execution failed, Please analyze the error and try a different approach fixed: \n --- \n ${errorMsg}\n`,
            }], systemPrompt, tools, {
            iteration: iteration + 1,
            maxIterations,
            verbose,
        });
        return;
    }
    const content = result.text;
    if (verbose) {
        console.log('[LLM] Response:', content.substring(0, 200) + (content.length > 200 ? '...' : ''));
    }
    const toolCalls = result.toolCalls || [];
    const toolUses = [];
    for (const tc of toolCalls) {
        try {
            if (!tc.toolCallId || !tc.toolName) {
                if (verbose) {
                    console.warn('[LLM] Skipping malformed tool call:', tc);
                }
                continue;
            }
            toolUses.push({
                id: tc.toolCallId,
                name: tc.toolName,
                input: tc.args || {},
            });
        }
        catch (error) {
            if (verbose) {
                console.error('[LLM] Failed to parse tool call:', tc, error);
            }
        }
    }
    if (verbose && toolUses.length > 0) {
        console.log('[LLM] Tool calls:', toolUses.map(t => t.name));
    }
    if (toolCalls.length > 0 && toolUses.length === 0) {
        const errorMessage = {
            type: 'assistant',
            content: `Error: Failed to parse any tool calls from LLM response. Please try rephrasing your request.`,
        };
        yield errorMessage;
        return;
    }
    const assistantMessage = {
        type: 'assistant',
        content,
        toolCalls: toolUses.length > 0 ? toolUses.map(tu => ({
            id: tu.id,
            name: tu.name,
            args: tu.input,
        })) : undefined,
    };
    yield assistantMessage;
    if (toolUses.length === 0) {
        if (verbose) {
            console.log('[Query] No tool calls, terminating');
        }
        return;
    }
    const results = await executeTools(toolUses, tools, verbose);
    const toolResultMessages = results.map(result => ({
        type: 'tool',
        content: result.error ? `Tool execution failed, you must analyze the error and try a different approach fixed: \n \n ${result.result} \n`
            : result.result,
        toolCallId: result.id,
    }));
    for (const toolResultMessage of toolResultMessages) {
        yield toolResultMessage;
    }
    yield* queryInternal([...messages, assistantMessage, ...toolResultMessages], systemPrompt, tools, {
        ...context,
        iteration: iteration + 1,
    });
}
export async function* query(messages, options) {
    const { systemPrompt, tools, maxIterations, verbose = false, } = options;
    if (verbose) {
        console.log('[Query] Initialized with', tools.length, 'tools');
    }
    yield* queryInternal(messages, systemPrompt, tools, {
        iteration: 1,
        maxIterations,
        verbose,
    });
}
//# sourceMappingURL=query.js.map