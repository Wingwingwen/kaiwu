"use server"

import { createClient } from "@/lib/supabase/server"
import { db } from "@/drizzle/db"
import { journalEntries, users } from "@/drizzle/schema"
import { eq } from "drizzle-orm"
import { SageInsightResponse } from "./ai"

export async function createEntryWithInsights(
  content: string,
  category: "gratitude" | "philosophical",
  promptText: string,
  insights: SageInsightResponse[]
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !user.email) {
    throw new Error("Unauthorized")
  }

  // 1. Ensure user exists in public.users
  const existingUser = await db.query.users.findFirst({
    where: eq(users.id, user.id)
  })

  if (!existingUser) {
    await db.insert(users).values({
      id: user.id,
      email: user.email,
      name: user.user_metadata.full_name || user.email.split("@")[0],
      role: "user",
    })
  }

  // 2. Create Journal Entry
  const [entry] = await db.insert(journalEntries).values({
    userId: user.id,
    content,
    category,
    promptText, // Added column
    sageInsights: insights, // Store as JSONB
    isDraft: false, // It's published
  }).returning()

  return entry
}
