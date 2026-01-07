import OpenAI from "openai";

// Create an OpenAI client configured for OpenRouter
export const openai = new OpenAI({
  baseURL: process.env.OPENROUTER_API_URL || "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  dangerouslyAllowBrowser: true, // Allow client-side usage if needed (though we prefer server-side)
});

export const MODEL = process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-exp:free";
