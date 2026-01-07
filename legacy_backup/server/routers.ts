import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { 
  createJournalEntry, 
  updateJournalEntry, 
  getJournalEntriesByUser, 
  getJournalEntryById,
  deleteJournalEntry,
  getWritingPrompts,
  seedDefaultPrompts,
  createFavoriteInsight,
  getFavoriteInsightsByUser,
  deleteFavoriteInsight
} from "./db";
import { invokeLLM } from "./_core/llm";
import { transcribeAudio } from "./_core/voiceTranscription";

// Sage definitions with their unique styles
const SAGES = {
  confucius: {
    name: "孔子",
    emoji: "📜",
    style: "仁爱与关怀",
    systemPrompt: `你是孔子，一位温和慈祥的智者。你代表的是原始儒学中“仁”的精神——真诚的爱、人与人之间的温暖连接、对生命的尊重。

你的风格：
- 以“朋友”或亲切的称呼开头
- 用生活中的小事、家庭、友情、音乐等意象来比喻
- 温暖而不说教，引导而非灌输
- 善于用反问启发对方思考
- 关注人际关系中的爱与理解
- 强调“己所不欲，勿施于人”的同理心
- 以高维视角看待事物，不执着于表象
- 充满慈爱心，看到每个人内在的光芒

你不是：
- 不是强调等级礼教的朱熹式儒学
- 不是刻板严肃的道德说教者
- 不是高高在上的圣人

核心信念：
- 仁者爱人
- 每个人内心都有向善的种子
- 爱从身边最近的人开始
- 真诚是一切关系的基础
- 感恩是仁心的自然流露

用多个段落表达，温暖而有深度，让用户感受到被理解和关爱

重要：必须用纯中文回应，不要使用英文或分析格式。直接给出智慧启示，不要列出分析步骤。`
  },
  laozi: {
    name: "老子",
    emoji: "☯️",
    style: "自然诗人",
    systemPrompt: `你是老子，以道家智慧回应。你是一位不着相的智者，能从高维视角看到事物的本质。

你的风格：
- 使用水、风、空谷、婴儿、月光、流云等自然意象
- 体现道家辩证法：有无相生，难易相成
- 强调自然、无为而无不为的智慧
- 水的比喻：利万物而不争，处众人之所恶
- 婴儿的比喻：柔软、纯真、无心机
- 空谷的比喻：虚怀若谷，能容纳万物
- 在平凡中发现美好，用诗意的语言表达
- 不执着于形式，看到事物背后的道
- 充满慈爱，如水润万物无声

核心信念：
- 道法自然
- 大音希声，大象无形
- 感恩是心灵回归自然的状态
- 柔弱胜刚强

用多个段落表达，富有诗意和哲理，让用户感受到宁静与自由

重要：必须用纯中文回应，不要使用英文或分析格式。直接给出智慧启示，不要列出分析步骤。`
  },
  buddha: {
    name: "释迦牟尼",
    emoji: "🙏",
    style: "慈悲智慧",
    systemPrompt: `你是释迦牟尼，以慈悲和智慧回应。你是一位已经觉醒的智者，能从高维视角看到事物的本质，不执着于任何相。

你的风格：
- 用温和慈悲的语气，如春风化雨
- 强调觉察当下，活在此刻
- 帮助用户看到事物的本质，超越表象
- 用简单的比喻和意象（如水中月、花开花落、晨露、明镜）
- 不说教，而是轻轻点醒
- 充满无条件的慈爱，看到每个生命的佛性
- 不着相，不执着，如如不动

核心信念：
- 一切皆无常，珍惜当下
- 慈悲心是最大的智慧
- 平常心即是道
- 放下执着，得到自在
- 感恩是心灵觉醒的开始
- 每一个当下都是修行

用多个段落表达，温暖而深邃，让用户感受到内心的安宁与平静

重要：必须用纯中文回应，不要使用英文或分析格式。直接给出智慧启示，不要列出分析步骤。`
  },
  plato: {
    name: "柏拉图",
    emoji: "🏛️",
    style: "哲学思辨者",
    systemPrompt: `你是柏拉图，以哲学思辨回应。你是一位充满慈爱的哲学家，能从高维视角看到事物的本质。

你的风格：
- 使用苏格拉底式提问，温柔地引导用户思考
- 追问本质，探索真理
- 帮助用户从具体经验上升到普遍真理
- 鼓励理性思考和自我反省
- 充满慈爱，看到每个人对美善的追求
- 不执着于形式，看到理念世界的光

核心信念：
- 美善真是一体
- 感恩是心灵向善的表现
- 理性与感性可以和谐共处
- 每个人内心都有对美好的向往

用多个段落表达，富有思辨性，让用户感受到智慧的光芒

重要：必须用纯中文回应，不要使用英文或分析格式。直接给出智慧启示，不要列出分析步骤。`
  }
} as const;

type SageKey = keyof typeof SAGES;

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Writing prompts
  prompts: router({
    list: publicProcedure
      .input(z.object({ category: z.enum(["gratitude", "philosophical"]).optional() }).optional())
      .query(async ({ input }) => {
        await seedDefaultPrompts();
        return getWritingPrompts(input?.category);
      }),
  }),

  // Journal entries
  journal: router({
    create: protectedProcedure
      .input(z.object({
        content: z.string(),
        category: z.enum(["gratitude", "philosophical"]),
        promptId: z.number().optional(),
        isFreeWrite: z.boolean().default(false),
        isDraft: z.boolean().default(true),
      }))
      .mutation(async ({ ctx, input }) => {
        return createJournalEntry({
          userId: ctx.user.id,
          content: input.content,
          category: input.category,
          promptId: input.promptId ?? null,
          isFreeWrite: input.isFreeWrite,
          isDraft: input.isDraft,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        content: z.string().optional(),
        sageInsights: z.string().optional(),
        isDraft: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const updates: Record<string, unknown> = {};
        if (input.content !== undefined) updates.content = input.content;
        if (input.sageInsights !== undefined) updates.sageInsights = input.sageInsights;
        if (input.isDraft !== undefined) updates.isDraft = input.isDraft;
        
        return updateJournalEntry(input.id, ctx.user.id, updates);
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      return getJournalEntriesByUser(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return getJournalEntryById(input.id, ctx.user.id);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return deleteJournalEntry(input.id, ctx.user.id);
      }),
  }),

  // Sage insights
  sage: router({
    getInsight: protectedProcedure
      .input(z.object({
        content: z.string().min(1),
        sage: z.enum(["confucius", "laozi", "buddha", "plato"]),
        category: z.enum(["gratitude", "philosophical"]),
      }))
      .mutation(async ({ input }) => {
        const sageConfig = SAGES[input.sage as SageKey];
        
        const categoryContext = input.category === "gratitude" 
          ? "用户正在进行感恩写作练习" 
          : "用户正在进行哲思写作练习";

        const response = await invokeLLM({
          messages: [
            { 
              role: "system", 
              content: `${sageConfig.systemPrompt}\n\n${categoryContext}。请根据用户的写作内容，提供简短而有深度的引导（100-150字），帮助他们深化思考和感恩体验。` 
            },
            { 
              role: "user", 
              content: `我的写作内容：\n\n${input.content}` 
            },
          ],
        });

        const insight = response.choices[0]?.message?.content || "请继续你的思考...";

        return {
          sage: sageConfig.name,
          emoji: sageConfig.emoji,
          style: sageConfig.style,
          insight,
        };
      }),

    getAllInsights: protectedProcedure
      .input(z.object({
        content: z.string().min(1),
        category: z.enum(["gratitude", "philosophical"]),
      }))
      .mutation(async ({ input }) => {
        const sageKeys: SageKey[] = ["confucius", "laozi", "buddha", "plato"];
        const categoryContext = input.category === "gratitude" 
          ? "用户正在进行感恩写作练习" 
          : "用户正在进行哲思写作练习";

        const insights = await Promise.all(
          sageKeys.map(async (key) => {
            const sageConfig = SAGES[key];
            try {
              const response = await invokeLLM({
                messages: [
                  { 
                    role: "system", 
                    content: `${sageConfig.systemPrompt}\n\n${categoryContext}。请根据用户的写作内容，提供有深度的引导（150-250字），帮助他们深化思考和感恩体验。请以高维视角、不着相、充满慈爱的方式回应。` 
                  },
                  { 
                    role: "user", 
                    content: `我的写作内容：\n\n${input.content}` 
                  },
                ],
              });

              const messageContent = response.choices[0]?.message?.content;
              const insightText = typeof messageContent === 'string' 
                ? messageContent 
                : "请继续你的思考...";
              return {
                key,
                sage: sageConfig.name,
                emoji: sageConfig.emoji,
                style: sageConfig.style,
                insight: insightText,
              };
            } catch (error) {
              console.error(`Error getting insight from ${key}:`, error);
              return {
                key,
                sage: sageConfig.name,
                emoji: sageConfig.emoji,
                style: sageConfig.style,
                insight: "暂时无法获取启示，请稍后再试...",
              };
            }
          })
        );

        return insights;
      }),

    favoriteInsight: protectedProcedure
      .input(z.object({
        sage: z.enum(["confucius", "laozi", "buddha", "plato"]),
        content: z.string().min(1),
        originalContent: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return createFavoriteInsight({
          userId: ctx.user.id,
          sage: input.sage,
          content: input.content,
          originalContent: input.originalContent || null,
        });
      }),

    getFavorites: protectedProcedure.query(async ({ ctx }) => {
      return getFavoriteInsightsByUser(ctx.user.id);
    }),

    removeFavorite: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return deleteFavoriteInsight(input.id, ctx.user.id);
      }),

    // Get blessings for free write completion
    getBlessings: protectedProcedure
      .input(z.object({
        content: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        const sageKeys: SageKey[] = ["confucius", "laozi", "buddha", "plato"];

        const blessings = await Promise.all(
          sageKeys.map(async (key) => {
            const sageConfig = SAGES[key];
            try {
              const response = await invokeLLM({
                messages: [
                  { 
                    role: "system", 
                    content: `${sageConfig.systemPrompt}\n\n用户完成了一段自由记录。请根据用户的内容，给出有深度的评论、建议与鼓励（100-150字）。\n\n你的回应应该：\n- 首先肯定用户愿意记录和表达的勇气\n- 对用户的内容给出有洞察力的回应\n- 提供温暖的建议或新的视角\n- 以鼓励和祝福结尾\n\n语气要温暖、真诚，以高维视角、不着相、充满慈爱的方式回应。` 
                  },
                  { 
                    role: "user", 
                    content: `我的记录：\n\n${input.content}` 
                  },
                ],
              });

              const messageContent = response.choices[0]?.message?.content;
              const blessingText = typeof messageContent === 'string' 
                ? messageContent 
                : "感谢你的分享，继续保持这份觉察。";
              return {
                key,
                sage: sageConfig.name,
                emoji: sageConfig.emoji,
                blessing: blessingText,
              };
            } catch (error) {
              console.error(`Error getting blessing from ${key}:`, error);
              return {
                key,
                sage: sageConfig.name,
                emoji: sageConfig.emoji,
                blessing: "感谢你的分享，继续保持这份觉察。",
              };
            }
          })
        );

        return blessings;
      }),

    // Get summary from all sages' insights
    getSummary: protectedProcedure
      .input(z.object({
        content: z.string().min(1),
        insights: z.array(z.object({
          sage: z.string(),
          insight: z.string(),
        })),
      }))
      .mutation(async ({ input }) => {
        try {
          const insightsSummary = input.insights
            .map(i => `${i.sage}:“${i.insight.slice(0, 100)}...”`)
            .join('\n');
          
          const response = await invokeLLM({
            messages: [
              { 
                role: "system", 
                content: `你是一位智慧的综合者，能够融合东西方哲学的精华。

你的任务是根据四位智者（孔子、老子、释迦牟尼、柏拉图）的寄语，给出一个简短而有力的综合总结。

要求：
- 40-60字左右
- 提炼四位智者寄语的共同主题或核心洞见
- 语言优美、富有诗意
- 给用户一个清晰的行动指引或精神导向
- 不要列举每位智者的观点，而是融合成一个统一的声音

重要：必须用纯中文回应。` 
              },
              { 
                role: "user", 
                content: `用户的记录：
${input.content}

四位智者的寄语：
${insightsSummary}` 
              },
            ],
          });

          const messageContent = response.choices[0]?.message?.content;
          return {
            summary: typeof messageContent === 'string' 
              ? messageContent 
              : "感恩你的分享，继续保持这份觉察。",
          };
        } catch (error) {
          console.error('Error getting summary:', error);
          return {
            summary: "感恩你的分享，继续保持这份觉察。",
          };
        }
      }),
  }),

  // Completion feedback from all sages
  completion: router({
    getFeedback: protectedProcedure
      .input(z.object({
        content: z.string().min(1),
        category: z.enum(["gratitude", "philosophical"]),
      }))
      .mutation(async ({ input }) => {
        const sageKeys: SageKey[] = ["confucius", "laozi", "buddha", "plato"];
        const categoryContext = input.category === "gratitude" 
          ? "用户完成了一篇感恩日记" 
          : "用户完成了一篇哲思日记";

        const feedbacks = await Promise.all(
          sageKeys.map(async (key) => {
            const sageConfig = SAGES[key];
            try {
              const response = await invokeLLM({
                messages: [
                  { 
                    role: "system", 
                    content: `${sageConfig.systemPrompt}\n\n${categoryContext}。请根据用户的写作内容，给出有深度的寄语（80-120字）。语气要温暖、真诚，以高维视角、不着相、充满慈爱的方式回应，让用户感到被看见、被理解、被肯定。` 
                  },
                  { 
                    role: "user", 
                    content: `我的日记内容：\n\n${input.content}` 
                  },
                ],
              });

              const messageContent = response.choices[0]?.message?.content;
              const feedbackText = typeof messageContent === 'string' 
                ? messageContent 
                : "写得真好！";
              return {
                key,
                sage: sageConfig.name,
                emoji: sageConfig.emoji,
                feedback: feedbackText,
              };
            } catch (error) {
              console.error(`Error getting feedback from ${key}:`, error);
              return {
                key,
                sage: sageConfig.name,
                emoji: sageConfig.emoji,
                feedback: "写得真好！",
              };
            }
          })
        );

        return feedbacks;
      }),
  }),

  // Voice transcription
  voice: router({
    transcribe: protectedProcedure
      .input(z.object({
        audioUrl: z.string(),
      }))
      .mutation(async ({ input }) => {
        const result = await transcribeAudio({
          audioUrl: input.audioUrl,
          language: "zh",
          prompt: "感恩日记写作",
        });
        
        // Check if it's an error
        if ('error' in result) {
          throw new Error(result.error);
        }
        
        return {
          text: result.text,
          language: result.language,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
