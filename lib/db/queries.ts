import { db } from "@/drizzle/db"
import { journalEntries, writingPrompts, favoriteInsights } from "@/drizzle/schema"
import { eq, asc, desc, and, gte, lte, count } from "drizzle-orm"

export async function getTodayEntryCount(userId: string) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const result = await db
    .select({ count: count() })
    .from(journalEntries)
    .where(
      and(
        eq(journalEntries.userId, userId),
        gte(journalEntries.createdAt, startOfDay),
        lte(journalEntries.createdAt, endOfDay),
        eq(journalEntries.isDraft, false)
      )
    );
    
  return result[0].count;
}

export async function getUserJournalEntries(userId: string) {
  return await db.query.journalEntries.findMany({
    where: and(
      eq(journalEntries.userId, userId),
      eq(journalEntries.isDraft, false)
    ),
    orderBy: [desc(journalEntries.createdAt)],
  });
}

export async function getUserJournalEntriesCount(userId: string) {
  const result = await db
    .select({ count: count() })
    .from(journalEntries)
    .where(
      and(
        eq(journalEntries.userId, userId),
        eq(journalEntries.isDraft, false)
      )
    )

  return result[0]?.count ?? 0
}

export async function getUserJournalEntriesPage(userId: string, limit: number, offset: number) {
  return await db.query.journalEntries.findMany({
    where: and(
      eq(journalEntries.userId, userId),
      eq(journalEntries.isDraft, false)
    ),
    orderBy: [desc(journalEntries.createdAt)],
    limit,
    offset,
    columns: {
      id: true,
      userId: true,
      createdAt: true,
      category: true,
      promptText: true,
      content: true,
      sageInsights: true,
    }
  })
}

export async function getUserJournalEntriesList(userId: string, limit: number, offset: number) {
  return await db.query.journalEntries.findMany({
    where: and(
      eq(journalEntries.userId, userId),
      eq(journalEntries.isDraft, false)
    ),
    orderBy: [desc(journalEntries.createdAt)],
    limit,
    offset,
    columns: {
      id: true,
      createdAt: true,
      category: true,
      promptText: true,
      content: true,
      sageInsights: true,
    }
  })
}

export async function getUserJournalEntry(userId: string, entryId: number) {
  return await db.query.journalEntries.findFirst({
    where: and(
      eq(journalEntries.userId, userId),
      eq(journalEntries.id, entryId),
      eq(journalEntries.isDraft, false)
    )
  })
}

export async function getUserFavoriteInsights(userId: string) {
  return await db.query.favoriteInsights.findMany({
    where: eq(favoriteInsights.userId, userId),
    orderBy: [desc(favoriteInsights.createdAt)],
  });
}

export async function getActivePrompts() {
  const prompts = await db.query.writingPrompts.findMany({
    where: eq(writingPrompts.isActive, true),
    orderBy: [asc(writingPrompts.sortOrder)],
  })

  if (prompts.length === 0) {
    await seedInitialPrompts()
    return await db.query.writingPrompts.findMany({
      where: eq(writingPrompts.isActive, true),
      orderBy: [asc(writingPrompts.sortOrder)],
    })
  }

  return prompts
}

export async function seedInitialPrompts() {
  const STATIC_PROMPTS = {
    gratitude: [
      "🫂 今天有谁主动关心你了？你当时是什么感受？",
      "☀️ 今天最让你感到温暖的一个瞬间是什么？",
      "🌱 最近哪个小习惯让你感觉生活变好了？",
      "💝 你最感恩的人是谁？想对TA说什么？",
      "🎁 今天收到的最意外的善意是什么？",
      "🏠 家里有什么东西是你每天都在用，但很少感谢的？",
      "👋 今天有谁对你微笑了？",
      "🍵 今天吃到的最好吃的东西是什么？",
      "🌸 今天看到的最美的风景是什么？",
      "💪 你的身体今天为你做了什么？"
    ],
    philosophical: [
      "🤔 如果今天是你生命的最后一天，你会做什么不同的选择？",
      "🌊 痛苦和快乐，哪个对你的成长更重要？",
      "🔮 十年后的你会感谢现在的你什么？",
      "🪞 你最想改变自己的什么？为什么还没改？",
      "⚖️ 自由和安全，你更看重哪个？",
      "🌙 你害怕什么？这个恐惧教会了你什么？",
      "🎭 真实的你和别人眼中的你，有什么不同？",
      "💫 什么事情让你感到活着的意义？",
      "🌿 如果可以重来，你会改变什么决定？",
      "🦋 你相信命运还是选择？"
    ]
  }

  const promptsToInsert = [
    ...STATIC_PROMPTS.gratitude.map((text, i) => ({
      text,
      category: "gratitude" as const,
      sortOrder: i,
      isActive: true
    })),
    ...STATIC_PROMPTS.philosophical.map((text, i) => ({
      text,
      category: "philosophical" as const,
      sortOrder: i,
      isActive: true
    }))
  ]

  // Check if any prompts exist
  const existing = await db.query.writingPrompts.findFirst()
  if (!existing) {
    console.log("Seeding initial prompts...")
    await db.insert(writingPrompts).values(promptsToInsert)
  }
}
