'use server'

import { openai, MODEL, MODEL_PRIORITIES } from "@/lib/ai/client";
import { SAGES, SageKey } from "@/lib/ai/prompts";

export interface SageInsightResponse {
  sage: string;
  emoji: string;
  style: string;
  insight: string;
}

// Analysis Types
export type InsightType = 'relationships' | 'consciousness' | 'growth' | 'mindfulness' | 'inner-conflict';

export interface RelationshipData {
  summary: string;
  people: {
    name: string;
    emoji: string;
    count: number;
    gratitude: string;
  }[];
  insight: string;
}

export interface ConsciousnessData {
  overallLevel: number;
  levelName: string;
  distribution: { low: number; mid: number; high: number };
  levelBreakdown: {
    low: { phrase: string; level: number; levelName: string }[];
    mid: { phrase: string; level: number; levelName: string }[];
    high: { phrase: string; level: number; levelName: string }[];
  };
  progressSummary: string;
  encouragement: string;
}

export interface GrowthData {
  currentLevel: string;
  shifts: {
    date: string;
    from: string;
    to: string;
    description: string;
  }[];
  journeyDescription: string;
  encouragement: string;
}

export interface MindfulnessData {
  intro: string;
  reminders: {
    emoji: string;
    title: string;
    coreInsight: string;
    detail: string;
  }[];
  blessing: string;
}

export interface ConflictData {
  intro: string;
  conflicts: {
    title: string;
    tension: string;
    integration: string;
  }[];
  wisdom: string;
}

export type AnalysisResult = 
  | { type: 'relationships'; data: RelationshipData }
  | { type: 'consciousness'; data: ConsciousnessData }
  | { type: 'growth'; data: GrowthData }
  | { type: 'mindfulness'; data: MindfulnessData }
  | { type: 'inner-conflict'; data: ConflictData };

const ANALYSIS_PROMPTS = {
  relationships: `
你是一个社会网络分析专家。请分析用户的日记，提取人物关系网络。
请返回如下 JSON 格式：
{
  "summary": "开篇段落，关于用户的人物关系概览（50字左右）",
  "people": [
    {
      "name": "人物名称",
      "emoji": "代表该人物的Emoji",
      "count": 提及次数（估算）,
      "gratitude": "用户感恩他们的具体点或与他们的互动模式（20字以内）"
    }
  ],
  "insight": "一个充满爱的深度洞察（80字左右）"
}
提取前 3-5 位重要人物。`,

  consciousness: `
你是一个基于 David Hawkins 意识地图的分析师。请分析用户的日记，评估其意识层级。
请返回如下 JSON 格式：
{
  "overallLevel": 整体估算层级数值 (0-1000),
  "levelName": "对应的层级名称（如：勇气、接纳、爱等）",
  "distribution": { "low": 低维占比%, "mid": 中维占比%, "high": 高维占比% },
  "levelBreakdown": {
    "low": [{"phrase": "体现低维意识的日记原句片段", "level": 数值, "levelName": "层级名"}],
    "mid": [{"phrase": "体现中维意识的日记原句片段", "level": 数值, "levelName": "层级名"}],
    "high": [{"phrase": "体现高维意识的日记原句片段", "level": 数值, "levelName": "层级名"}]
  },
  "progressSummary": "用户意识进化的总结（50字左右）",
  "encouragement": "来自高维视角的鼓励（50字左右）"
}
注意：低维(0-175, 羞愧-骄傲)，中维(200-499, 勇气-理性)，高维(500+, 爱-开悟)。每个维度提取 1-2 个例句。`,

  growth: `
你是一个灵性成长导师。请分析用户的日记，梳理其成长轨迹。
请返回如下 JSON 格式：
{
  "currentLevel": "当前主要所处的灵性阶段",
  "shifts": [
    {
      "date": "大致时间或阶段",
      "from": "旧的状态/信念",
      "to": "新的状态/洞见",
      "description": "转变的具体描述"
    }
  ],
  "journeyDescription": "一段关于用户成长旅程的描述（80字左右）",
  "encouragement": "温暖的手写风格鼓励语（30字左右）"
}
提取 2-3 个关键转变。`,

  mindfulness: `
你是一个正念觉察导师。请分析用户的日记，提供当下的觉察提醒。
请返回如下 JSON 格式：
{
  "intro": "开篇引导语（30字左右）",
  "reminders": [
    {
      "emoji": "💡",
      "title": "提醒标题",
      "coreInsight": "核心洞察（5-10字，将高亮显示）",
      "detail": "具体的行动建议或觉察指引（40字左右）"
    }
  ],
  "blessing": "结尾的祝福语（30字左右）"
}
提供 3 个具体的觉察提醒。`,

  "inner-conflict": `
你是一个荣格心理学专家。请分析用户的日记，帮助梳理内在矛盾。
请返回如下 JSON 格式：
{
  "intro": "关于矛盾作为信使的引入语（40字左右）",
  "conflicts": [
    {
      "title": "矛盾主题",
      "tension": "描述这种内在张力（如：想要自由 vs 渴望安全）",
      "integration": "基于荣格心理学的整合路径建议"
    }
  ],
  "wisdom": "关于整合与完整的深刻洞察（60字左右）"
}
提取 2-3 个主要的内在矛盾。`
};

export async function generateInsightAnalysis(
  entries: { content: string; createdAt: Date }[],
  type: InsightType
): Promise<AnalysisResult> {
  // Debug log to check environment
  console.log(`Starting analysis for ${type}. Model: ${MODEL}, API Key present: ${!!process.env.OPENROUTER_API_KEY}`);

  if (!process.env.OPENROUTER_API_KEY) {
    console.error("Missing OPENROUTER_API_KEY");
    throw new Error("API configuration missing");
  }

  const entriesText = entries
    .slice(0, 20) // Limit to recent 20 entries
    .map(e => `[${e.createdAt.toISOString().split('T')[0]}] ${e.content}`)
    .join('\n\n');

  const systemPrompt = ANALYSIS_PROMPTS[type];
  const messages = [
    { 
      role: "system", 
      content: `${systemPrompt}\n\n请只返回纯 JSON 格式，不要包含 Markdown 标记。` 
    },
    { 
      role: "user", 
      content: `用户的日记内容：\n\n${entriesText}` 
    },
  ];

  try {
    const completion = await tryModelWithFallback(messages, 0.5, 1200);

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("No content generated");

    const data = JSON.parse(content);
    return { type, data } as AnalysisResult;

  } catch (error) {
    console.error(`Analysis failed for ${type}:`, error);
    throw new Error("Failed to generate analysis");
  }
}

// 智能模型切换函数
async function tryModelWithFallback(
  messages: any[],
  temperature: number = 0.7,
  max_tokens: number = 500,
  currentModelIndex: number = 0
): Promise<any> {
  const model = MODEL_PRIORITIES[currentModelIndex];
  
  try {
    console.log(`尝试模型 ${model} (优先级 ${currentModelIndex + 1}/${MODEL_PRIORITIES.length})`);
    
    const completion = await openai.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens,
    });
    
    console.log(`模型 ${model} 调用成功`);
    return completion;
    
  } catch (error: any) {
    console.error(`模型 ${model} 失败:`, error.message);
    
    // 如果是限流错误且还有备用模型，尝试下一个
    if (error.status === 429 && currentModelIndex < MODEL_PRIORITIES.length - 1) {
      console.log(`切换到备用模型 ${MODEL_PRIORITIES[currentModelIndex + 1]}`);
      // 等待2秒后重试，避免过快切换
      await new Promise(resolve => setTimeout(resolve, 2000));
      return tryModelWithFallback(messages, temperature, max_tokens, currentModelIndex + 1);
    }
    
    throw error;
  }
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

  const messages = [
    { 
      role: "system", 
      content: `${sageConfig.systemPrompt}\n\n${categoryContext}。请根据用户的写作内容，提供简短而有深度的引导（100-150字），帮助他们深化思考和感恩体验。` 
    },
    { 
      role: "user", 
      content: `我的写作内容：\n\n${content}` 
    },
  ];

  try {
    const completion = await tryModelWithFallback(messages, 0.7, 500);
    const insight = completion.choices[0]?.message?.content || "请继续你的思考...";

    return {
      sage: sageConfig.name,
      emoji: sageConfig.emoji,
      style: sageConfig.style,
      insight,
    };
  } catch (error) {
    console.error(`所有模型都失败了 for ${sageConfig.name}:`, error);
    
    // 最终降级：返回预设的智慧语录
    const fallbackInsights = {
      confucius: "学而时习之，不亦说乎？继续你的思考和实践。",
      laozi: "道可道，非常道。保持你的觉察和探索。",
      buddha: "一切有为法，如梦幻泡影。观照内心的变化。",
      plato: "未经审视的人生不值得过。你的反思很有价值。"
    };
    
    return {
      sage: sageConfig.name,
      emoji: sageConfig.emoji,
      style: sageConfig.style,
      insight: fallbackInsights[sageKey] || "请继续你的思考...",
    };
  }
}

export async function getAllSageInsights(
  content: string,
  category: "gratitude" | "philosophical"
): Promise<SageInsightResponse[]> {
  const sageKeys: SageKey[] = ["confucius", "laozi", "buddha", "plato"];
  
  // Sequential execution with delays to avoid rate limiting
  const results: SageInsightResponse[] = [];
  
  for (let i = 0; i < sageKeys.length; i++) {
    try {
      const insight = await getSageInsight(content, sageKeys[i], category);
      results.push(insight);
      
      // Add delay between requests to avoid rate limiting (except for the last one)
      if (i < sageKeys.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
      }
    } catch (error) {
      console.error(`Failed to get insight from ${sageKeys[i]}:`, error);
      // Continue with other sages even if one fails
    }
  }

  return results;
}
