import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Journal entries table - stores user's gratitude journal entries
 */
export const journalEntries = mysqlTable("journal_entries", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  /** The prompt/topic used for this entry, null if free writing */
  promptId: int("promptId"),
  /** Journal content */
  content: text("content").notNull(),
  /** Category: gratitude or philosophical */
  category: mysqlEnum("category", ["gratitude", "philosophical"]).notNull(),
  /** Whether this is a free writing entry */
  isFreeWrite: boolean("isFreeWrite").default(false).notNull(),
  /** Sage insights received for this entry (JSON array) */
  sageInsights: text("sageInsights"),
  /** Draft status */
  isDraft: boolean("isDraft").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type JournalEntry = typeof journalEntries.$inferSelect;
export type InsertJournalEntry = typeof journalEntries.$inferInsert;

/**
 * Writing prompts table - stores predefined topics for journaling
 */
export const writingPrompts = mysqlTable("writing_prompts", {
  id: int("id").autoincrement().primaryKey(),
  /** Prompt text */
  text: text("text").notNull(),
  /** Category: gratitude or philosophical */
  category: mysqlEnum("category", ["gratitude", "philosophical"]).notNull(),
  /** Display order */
  sortOrder: int("sortOrder").default(0).notNull(),
  /** Whether this prompt is active */
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WritingPrompt = typeof writingPrompts.$inferSelect;
export type InsertWritingPrompt = typeof writingPrompts.$inferInsert;


/**
 * Favorite insights table - stores user's favorite sage insights
 */
export const favoriteInsights = mysqlTable("favorite_insights", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  /** The sage who gave this insight */
  sage: mysqlEnum("sage", ["confucius", "laozi", "buddha", "plato"]).notNull(),
  /** The insight content */
  content: text("content").notNull(),
  /** The original journal content that prompted this insight */
  originalContent: text("originalContent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FavoriteInsight = typeof favoriteInsights.$inferSelect;
export type InsertFavoriteInsight = typeof favoriteInsights.$inferInsert;
