import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  journalEntries, 
  InsertJournalEntry, 
  JournalEntry,
  writingPrompts,
  InsertWritingPrompt,
  WritingPrompt
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ User Functions ============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ Journal Entry Functions ============

export async function createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(journalEntries).values(entry);
  const insertId = result[0].insertId;
  
  const [created] = await db.select().from(journalEntries).where(eq(journalEntries.id, insertId));
  return created;
}

export async function updateJournalEntry(
  id: number, 
  userId: number, 
  updates: Partial<Pick<JournalEntry, 'content' | 'sageInsights' | 'isDraft'>>
): Promise<JournalEntry | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(journalEntries)
    .set(updates)
    .where(and(eq(journalEntries.id, id), eq(journalEntries.userId, userId)));

  const [updated] = await db.select().from(journalEntries)
    .where(and(eq(journalEntries.id, id), eq(journalEntries.userId, userId)));
  
  return updated || null;
}

export async function getJournalEntriesByUser(userId: number): Promise<JournalEntry[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(journalEntries)
    .where(eq(journalEntries.userId, userId))
    .orderBy(desc(journalEntries.createdAt));
}

export async function getJournalEntryById(id: number, userId: number): Promise<JournalEntry | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [entry] = await db.select().from(journalEntries)
    .where(and(eq(journalEntries.id, id), eq(journalEntries.userId, userId)));
  
  return entry || null;
}

export async function deleteJournalEntry(id: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.delete(journalEntries)
    .where(and(eq(journalEntries.id, id), eq(journalEntries.userId, userId)));
  
  return result[0].affectedRows > 0;
}

// ============ Writing Prompt Functions ============

export async function getWritingPrompts(category?: 'gratitude' | 'philosophical'): Promise<WritingPrompt[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (category) {
    return db.select().from(writingPrompts)
      .where(and(eq(writingPrompts.category, category), eq(writingPrompts.isActive, true)))
      .orderBy(writingPrompts.sortOrder);
  }

  return db.select().from(writingPrompts)
    .where(eq(writingPrompts.isActive, true))
    .orderBy(writingPrompts.sortOrder);
}

export async function createWritingPrompt(prompt: InsertWritingPrompt): Promise<WritingPrompt> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(writingPrompts).values(prompt);
  const insertId = result[0].insertId;
  
  const [created] = await db.select().from(writingPrompts).where(eq(writingPrompts.id, insertId));
  return created;
}

export async function seedDefaultPrompts(): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if prompts already exist
  const existing = await db.select().from(writingPrompts).limit(1);
  if (existing.length > 0) return;

  const defaultPrompts: InsertWritingPrompt[] = [
    // Gratitude prompts
    { text: "今天有什么让你感到温暖的小事？", category: "gratitude", sortOrder: 1 },
    { text: "你最近收到了谁的帮助？这让你有什么感受？", category: "gratitude", sortOrder: 2 },
    { text: "你的身体今天为你做了什么？", category: "gratitude", sortOrder: 3 },
    { text: "今天的天气或自然环境给你带来了什么？", category: "gratitude", sortOrder: 4 },
    { text: "有什么你平时忽略但其实很珍贵的东西？", category: "gratitude", sortOrder: 5 },
    { text: "今天你学到了什么新东西？", category: "gratitude", sortOrder: 6 },
    { text: "谁是你生命中一直支持你的人？", category: "gratitude", sortOrder: 7 },
    { text: "你最近完成了什么让自己骄傲的事？", category: "gratitude", sortOrder: 8 },
    // Philosophical prompts
    { text: "什么是真正的幸福？", category: "philosophical", sortOrder: 1 },
    { text: "如果时间可以倒流，你会改变什么？为什么？", category: "philosophical", sortOrder: 2 },
    { text: "你认为人生的意义是什么？", category: "philosophical", sortOrder: 3 },
    { text: "什么样的生活才是值得过的？", category: "philosophical", sortOrder: 4 },
    { text: "你如何定义成功？", category: "philosophical", sortOrder: 5 },
    { text: "在困难面前，什么给你力量？", category: "philosophical", sortOrder: 6 },
    { text: "你希望被人记住什么？", category: "philosophical", sortOrder: 7 },
    { text: "什么是你无法放下的执念？它教会了你什么？", category: "philosophical", sortOrder: 8 },
  ];

  await db.insert(writingPrompts).values(defaultPrompts);
}


// ============ Favorite Insight Functions ============

import { favoriteInsights, InsertFavoriteInsight, FavoriteInsight } from "../drizzle/schema";

export async function createFavoriteInsight(insight: InsertFavoriteInsight): Promise<FavoriteInsight> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(favoriteInsights).values(insight);
  const insertId = result[0].insertId;
  
  const [created] = await db.select().from(favoriteInsights).where(eq(favoriteInsights.id, insertId));
  return created;
}

export async function getFavoriteInsightsByUser(userId: number): Promise<FavoriteInsight[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(favoriteInsights)
    .where(eq(favoriteInsights.userId, userId))
    .orderBy(desc(favoriteInsights.createdAt));
}

export async function deleteFavoriteInsight(id: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.delete(favoriteInsights)
    .where(and(eq(favoriteInsights.id, id), eq(favoriteInsights.userId, userId)));
  
  return result[0].affectedRows > 0;
}
