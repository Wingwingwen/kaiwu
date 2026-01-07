import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database functions
vi.mock("./db", () => ({
  createJournalEntry: vi.fn(),
  updateJournalEntry: vi.fn(),
  getJournalEntriesByUser: vi.fn(),
  getJournalEntryById: vi.fn(),
  deleteJournalEntry: vi.fn(),
  getWritingPrompts: vi.fn(),
  seedDefaultPrompts: vi.fn(),
}));

// Mock the LLM function
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: "这是一条测试启示内容" } }],
  }),
}));

import {
  createJournalEntry,
  updateJournalEntry,
  getJournalEntriesByUser,
  getJournalEntryById,
  deleteJournalEntry,
  getWritingPrompts,
  seedDefaultPrompts,
} from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-123",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("Journal Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("journal.create", () => {
    it("creates a new journal entry for authenticated user", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const mockEntry = {
        id: 1,
        userId: 1,
        content: "今天我很感恩阳光",
        category: "gratitude" as const,
        promptId: null,
        isFreeWrite: true,
        isDraft: true,
        sageInsights: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(createJournalEntry).mockResolvedValue(mockEntry);

      const result = await caller.journal.create({
        content: "今天我很感恩阳光",
        category: "gratitude",
        isFreeWrite: true,
        isDraft: true,
      });

      expect(createJournalEntry).toHaveBeenCalledWith({
        userId: 1,
        content: "今天我很感恩阳光",
        category: "gratitude",
        promptId: null,
        isFreeWrite: true,
        isDraft: true,
      });
      expect(result.id).toBe(1);
      expect(result.content).toBe("今天我很感恩阳光");
    });

    it("throws error for unauthenticated user", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.journal.create({
          content: "测试内容",
          category: "gratitude",
        })
      ).rejects.toThrow();
    });
  });

  describe("journal.update", () => {
    it("updates an existing journal entry", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const mockUpdatedEntry = {
        id: 1,
        userId: 1,
        content: "更新后的内容",
        category: "gratitude" as const,
        promptId: null,
        isFreeWrite: true,
        isDraft: false,
        sageInsights: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(updateJournalEntry).mockResolvedValue(mockUpdatedEntry);

      const result = await caller.journal.update({
        id: 1,
        content: "更新后的内容",
        isDraft: false,
      });

      expect(updateJournalEntry).toHaveBeenCalledWith(1, 1, {
        content: "更新后的内容",
        isDraft: false,
      });
      expect(result?.content).toBe("更新后的内容");
      expect(result?.isDraft).toBe(false);
    });
  });

  describe("journal.list", () => {
    it("returns all journal entries for authenticated user", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const mockEntries = [
        {
          id: 1,
          userId: 1,
          content: "第一篇日记",
          category: "gratitude" as const,
          promptId: null,
          isFreeWrite: true,
          isDraft: false,
          sageInsights: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          userId: 1,
          content: "第二篇日记",
          category: "philosophical" as const,
          promptId: 1,
          isFreeWrite: false,
          isDraft: true,
          sageInsights: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(getJournalEntriesByUser).mockResolvedValue(mockEntries);

      const result = await caller.journal.list();

      expect(getJournalEntriesByUser).toHaveBeenCalledWith(1);
      expect(result).toHaveLength(2);
      expect(result[0].content).toBe("第一篇日记");
    });
  });

  describe("journal.get", () => {
    it("returns a specific journal entry", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const mockEntry = {
        id: 1,
        userId: 1,
        content: "测试日记",
        category: "gratitude" as const,
        promptId: null,
        isFreeWrite: true,
        isDraft: false,
        sageInsights: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(getJournalEntryById).mockResolvedValue(mockEntry);

      const result = await caller.journal.get({ id: 1 });

      expect(getJournalEntryById).toHaveBeenCalledWith(1, 1);
      expect(result?.content).toBe("测试日记");
    });
  });

  describe("journal.delete", () => {
    it("deletes a journal entry", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      vi.mocked(deleteJournalEntry).mockResolvedValue(true);

      const result = await caller.journal.delete({ id: 1 });

      expect(deleteJournalEntry).toHaveBeenCalledWith(1, 1);
      expect(result).toBe(true);
    });
  });
});

describe("Prompts Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("prompts.list", () => {
    it("returns writing prompts", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const mockPrompts = [
        {
          id: 1,
          text: "今天有什么让你感到温暖的小事？",
          category: "gratitude" as const,
          sortOrder: 1,
          isActive: true,
          createdAt: new Date(),
        },
        {
          id: 2,
          text: "什么是真正的幸福？",
          category: "philosophical" as const,
          sortOrder: 1,
          isActive: true,
          createdAt: new Date(),
        },
      ];

      vi.mocked(getWritingPrompts).mockResolvedValue(mockPrompts);
      vi.mocked(seedDefaultPrompts).mockResolvedValue();

      const result = await caller.prompts.list({});

      expect(seedDefaultPrompts).toHaveBeenCalled();
      expect(getWritingPrompts).toHaveBeenCalledWith(undefined);
      expect(result).toHaveLength(2);
    });

    it("filters prompts by category", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const mockPrompts = [
        {
          id: 1,
          text: "今天有什么让你感到温暖的小事？",
          category: "gratitude" as const,
          sortOrder: 1,
          isActive: true,
          createdAt: new Date(),
        },
      ];

      vi.mocked(getWritingPrompts).mockResolvedValue(mockPrompts);
      vi.mocked(seedDefaultPrompts).mockResolvedValue();

      const result = await caller.prompts.list({ category: "gratitude" });

      expect(getWritingPrompts).toHaveBeenCalledWith("gratitude");
      expect(result).toHaveLength(1);
      expect(result[0].category).toBe("gratitude");
    });
  });
});

describe("Sage Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("sage.getInsight", () => {
    it("returns insight from a specific sage", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.sage.getInsight({
        content: "今天我很感恩家人的陪伴",
        sage: "confucius",
        category: "gratitude",
      });

      expect(result.sage).toBe("孔子");
      expect(result.emoji).toBe("📜");
      expect(result.insight).toBeDefined();
    });
  });

  describe("sage.getAllInsights", () => {
    it("returns insights from all four sages", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.sage.getAllInsights({
        content: "今天我很感恩家人的陪伴",
        category: "gratitude",
      });

      expect(result).toHaveLength(4);
      expect(result.map((s) => s.key)).toEqual(["confucius", "laozi", "buddha", "plato"]);
      expect(result[0].sage).toBe("孔子");
      expect(result[1].sage).toBe("老子");
      expect(result[2].sage).toBe("释迦牟尼");
      expect(result[3].sage).toBe("柏拉图");
    });
  });
});
