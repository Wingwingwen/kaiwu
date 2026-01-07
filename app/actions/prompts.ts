"use server"

import { generateDynamicPromptsNoHistory, generateDynamicPromptsWithHistory, GeneratedTopic } from "@/lib/ai/question-generators";
import { db } from "@/drizzle/db";
import { journalEntries } from "@/drizzle/schema";
import { desc, eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";

export async function getDynamicPrompts(hasHistory: boolean = false): Promise<GeneratedTopic[]> {
  if (!hasHistory) {
    return await generateDynamicPromptsNoHistory();
  }

  // Fetch recent journal entries for history analysis
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Fallback to no-history if user not authenticated
    return await generateDynamicPromptsNoHistory();
  }

  const recentEntries = await db.query.journalEntries.findMany({
    where: eq(journalEntries.userId, user.id),
    orderBy: [desc(journalEntries.createdAt)],
    limit: 10, // Analyze last 10 entries
  });

  if (recentEntries.length === 0) {
    // Fallback if no entries exist
    return await generateDynamicPromptsNoHistory();
  }

  return await generateDynamicPromptsWithHistory(recentEntries);
}
