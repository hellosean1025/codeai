import { createOpenAI } from '@ai-sdk/openai';
// import { createAnthropic } from '@ai-sdk/anthropic';


export const getModel = ()=>{
  if(!process.env.CODEAI_BASE_URL){
    throw new Error('Missing CODEAI_BASE_URL, please set it in your environment variables')
  }
  if(!process.env.CODEAI_AUTH_TOKEN){
    throw new Error('Missing CODEAI_AUTH_TOKEN, please set it in your environment variables')
  }

  // const provider = process.env.AI_PROVIDER || 'openai';
  // if (provider === 'anthropic') {
  //   const anthropic = createAnthropic({
  //     baseURL: process.env.CODEAI_BASE_URL,
  //     apiKey: process.env.CODEAI_AUTH_TOKEN,
  //   });
  //   return anthropic( process.env.CODEAI_MODEL_ID||'claude-sonnet-4-20250514');
  // }

  const openai = createOpenAI({
    baseURL: process.env.CODEAI_BASE_URL,
    apiKey: process.env.CODEAI_AUTH_TOKEN,
  });
  return openai.chat(process.env.CODEAI_MODEL_ID)
}

export const agentModel = getModel();