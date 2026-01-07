'use server'

import { openai, MODEL } from "@/lib/ai/client";
import { SAGES, SageKey } from "@/lib/ai/prompts";

export interface SageInsightResponse {
  sage: string;
  emoji: string;
  style: string;
  insight: string;
}

export async function getSageInsight(
  content: string,
  sageKey: SageKey,
  category: "gratitude" | "philosophical"
): Promise<SageInsightResponse> {
  const sageConfig = SAGES[sageKey];
  
  const categoryContext = category === "gratitude" 
    ? "用户正在进行感恩写作练习" 
    : "用户正在进行哲思写作练习";

  // Debugging log
  console.log(`Getting insight from ${sageKey} using model ${MODEL}. API Key present: ${!!process.env.OPENROUTER_API_KEY}`);

  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { 
          role: "system", 
          content: `${sageConfig.systemPrompt}\n\n${categoryContext}。请根据用户的写作内容，提供简短而有深度的引导（100-150字），帮助他们深化思考和感恩体验。` 
        },
        { 
          role: "user", 
          content: `我的写作内容：\n\n${content}` 
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const insight = completion.choices[0]?.message?.content || "请继续你的思考...";

    return {
      sage: sageConfig.name,
      emoji: sageConfig.emoji,
      style: sageConfig.style,
      insight,
    };
  } catch (error) {
    console.error(`SDK error for ${sageConfig.name}:`, error);

    // Fallback: Try using native fetch if SDK fails
    try {
      console.log("SDK failed, trying native fetch...");
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://awaken-entries.com", // Optional, for OpenRouter rankings
          "X-Title": "Awaken Entries", // Optional, for OpenRouter rankings
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { 
              role: "system", 
              content: `${sageConfig.systemPrompt}\n\n${categoryContext}。请根据用户的写作内容，提供简短而有深度的引导（100-150字），帮助他们深化思考和感恩体验。` 
            },
            { 
              role: "user", 
              content: `我的写作内容：\n\n${content}` 
            },
          ],
          temperature: 0.7,
          max_tokens: 500,
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Native fetch failed with status ${response.status}:`, errorText);
        throw new Error(`OpenRouter API error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      const insight = data.choices[0]?.message?.content || "请继续你的思考...";

      return {
        sage: sageConfig.name,
        emoji: sageConfig.emoji,
        style: sageConfig.style,
        insight,
      };

    } catch (fetchError) {
      console.error(`Both SDK and fetch failed for ${sageConfig.name}:`, fetchError);
      throw new Error("无法获取智者启示");
    }
  }
}

export async function getAllSageInsights(
  content: string,
  category: "gratitude" | "philosophical"
): Promise<SageInsightResponse[]> {
  const sageKeys: SageKey[] = ["confucius", "laozi", "buddha", "plato"];
  
  // Parallel execution for better performance
  const results = await Promise.allSettled(
    sageKeys.map(key => getSageInsight(content, key, category))
  );

  return results
    .filter((result): result is PromiseFulfilledResult<SageInsightResponse> => result.status === "fulfilled")
    .map(result => result.value);
}
