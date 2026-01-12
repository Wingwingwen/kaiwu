"use server"

import { generateDynamicPromptsNoHistory, generateDynamicPromptsWithHistory, GeneratedTopic } from "@/lib/ai/question-generators";
import { db } from "@/drizzle/db";
import { journalEntries } from "@/drizzle/schema";
import { desc, eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";

export async function getDynamicPrompts(hasHistory: boolean = false): Promise<GeneratedTopic[]> {
  try {
    if (!hasHistory) {
      const result = await generateDynamicPromptsNoHistory();
      if (result.length > 0) return result;
    }

    // Fetch recent journal entries for history analysis
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // Fallback to no-history if user not authenticated
      const result = await generateDynamicPromptsNoHistory();
      return result.length > 0 ? result : getFallbackTopics();
    }

    const recentEntries = await db.query.journalEntries.findMany({
      where: eq(journalEntries.userId, user.id),
      orderBy: [desc(journalEntries.createdAt)],
      limit: 5, // Reduce context to 5 for faster processing
    });

    if (recentEntries.length === 0) {
      // Fallback if no entries exist
      const result = await generateDynamicPromptsNoHistory();
      return result.length > 0 ? result : getFallbackTopics();
    }

    const result = await generateDynamicPromptsWithHistory(recentEntries);
    return result.length > 0 ? result : getFallbackTopics();
  } catch (error) {
    console.error("AI题目生成失败，使用备用题目:", error);
    return getFallbackTopics();
  }
}

// 备用静态题目库
function getFallbackTopics(): GeneratedTopic[] {
  const fallbackTopics = [
    "今天有什么微小的事情让你感到温暖？",
    "如果可以感谢今天遇到的一个人，你会感谢谁？为什么？",
    "今天有没有什么'不便'后来变成了祝福？",
    "今天你的身体为你做了什么值得感谢的事情？",
    "今天有什么声音、气味或画面让你会心一笑？"
  ];
  
  return fallbackTopics.map((text, index) => ({
    id: `fallback-${Date.now()}-${index}`,
    text,
    category: 'fallback',
    icon: '💡'
  }));
}
