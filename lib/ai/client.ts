import OpenAI from "openai";

// Create an OpenAI client configured for OpenRouter
export const openai = new OpenAI({
  baseURL: process.env.OPENROUTER_API_URL || "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  dangerouslyAllowBrowser: true, // Allow client-side usage if needed (though we prefer server-side)
});

// 模型降级策略 - 按优先级排序
export const MODEL_PRIORITIES = [
  "google/gemini-2.5-pro",               // 主要模型: Gemini 2.5 Pro (User preference)
  "google/gemini-2.0-flash-exp:free",    // 备用1: Gemini 2.0 Flash (Free)
  "x-ai/grok-4.1-fast",                  // 备用2: Grok 4.1 Fast
  "openai/gpt-4o-mini:free",             // 备用3: OpenAI免费模型
  "anthropic/claude-3-haiku:free",       // 备用4: Claude免费模型
  "meta-llama/llama-3.1-8b-instruct:free" // 备用5: Llama免费模型
] as const;

export const MODEL = process.env.OPENROUTER_MODEL || MODEL_PRIORITIES[0];
