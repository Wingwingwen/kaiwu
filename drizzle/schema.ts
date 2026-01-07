import { pgTable, serial, text, timestamp, boolean, uuid, pgEnum, integer, jsonb } from "drizzle-orm/pg-core";

// Enums
export const roleEnum = pgEnum("role", ["user", "admin"]);
export const categoryEnum = pgEnum("category", ["gratitude", "philosophical"]);
export const sageEnum = pgEnum("sage", ["confucius", "laozi", "buddha", "plato"]);

// Users table (profiles)
// Note: This table is intended to be linked with Supabase Auth (auth.users)
export const users = pgTable("users", {
  id: uuid("id").primaryKey(), // Matches auth.users.id
  email: text("email"),
  name: text("name"),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  lastSignedIn: timestamp("last_signed_in", { withTimezone: true }).defaultNow().notNull(),
});

// Journal Entries
export const journalEntries = pgTable("journal_entries", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  promptId: integer("prompt_id"),
  promptText: text("prompt_text"),
  content: text("content").notNull(),
  category: categoryEnum("category").notNull(),
  isFreeWrite: boolean("is_free_write").default(false).notNull(),
  // Store insights as JSONB for better querying capabilities in Postgres
  sageInsights: jsonb("sage_insights"), 
  isDraft: boolean("is_draft").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Writing Prompts
export const writingPrompts = pgTable("writing_prompts", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  category: categoryEnum("category").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Favorite Insights
export const favoriteInsights = pgTable("favorite_insights", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  sage: sageEnum("sage").notNull(),
  content: text("content").notNull(),
  originalContent: text("original_content"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type JournalEntry = typeof journalEntries.$inferSelect;
export type InsertJournalEntry = typeof journalEntries.$inferInsert;

export type WritingPrompt = typeof writingPrompts.$inferSelect;
export type InsertWritingPrompt = typeof writingPrompts.$inferInsert;

export type FavoriteInsight = typeof favoriteInsights.$inferSelect;
export type InsertFavoriteInsight = typeof favoriteInsights.$inferInsert;
