import { openai, MODEL, MODEL_PRIORITIES } from "@/lib/ai/client";
import { JournalEntry } from "@/drizzle/schema";

export type GeneratedTopic = {
  id: string;
  text: string;
  category: string;
  icon: string;
};

export type GeneratedTopicsResponse = {
  topics: GeneratedTopic[];
};

const SYSTEM_ROLE = `You are a creative writing coach who helps users discover deeper gratitude through personalized, thought-provoking questions.`;

// 智能模型切换函数
async function tryModelWithFallback(
  messages: any[],
  response_format?: any,
  temperature: number = 0.8,
  currentModelIndex: number = 0
): Promise<any> {
  const model = MODEL_PRIORITIES[currentModelIndex];
  
  try {
    console.log(`题目生成器尝试模型 ${model} (优先级 ${currentModelIndex + 1}/${MODEL_PRIORITIES.length})`);
    
    const completion = await openai.chat.completions.create({
      model,
      messages,
      response_format,
      temperature,
    });
    
    console.log(`题目生成器模型 ${model} 调用成功`);
    return completion;
    
  } catch (error: any) {
    console.error(`题目生成器模型 ${model} 失败:`, error.message);
    
    // 如果是限流错误且还有备用模型，尝试下一个
    if (error.status === 429 && currentModelIndex < MODEL_PRIORITIES.length - 1) {
      console.log(`题目生成器切换到备用模型 ${MODEL_PRIORITIES[currentModelIndex + 1]}`);
      // 等待1.5秒后重试，避免过快切换
      await new Promise(resolve => setTimeout(resolve, 1500));
      return tryModelWithFallback(messages, response_format, temperature, currentModelIndex + 1);
    }
    
    throw error;
  }
}

export async function generateDynamicPromptsNoHistory(): Promise<GeneratedTopic[]> {
  const prompt = `生成5个独特、有深度的感恩日记题目:

【核心要求】
1. 新颖有趣 - 不是普通的"你感恩什么"
2. 具体而非抽象 - 能唤起画面感
3. 情感共鸣 - 触动内心
4. 引发深思 - 鼓励更深的反思
5. 每个题目20-35字

【创意方向】
- 感官类: "今天什么声音让你会心一笑?"
- 假设类: "如果能重温这周的一个瞬间,你会选哪个?"
- 意外类: "有什么'不便'后来变成了祝福?"
- 关系类: "今天谁让你感到被看见了?"
- 成长类: "最近什么错误教会了你什么?"

请以JSON格式返回:
{
  "topics": [
    {"id": "1", "text": "题目内容", "category": "creative", "icon": "emoji"}
  ]
}`;

  try {
    const messages = [
      { role: "system", content: SYSTEM_ROLE },
      { role: "user", content: prompt },
    ];
    
    const completion = await tryModelWithFallback(messages, { type: "json_object" }, 0.8);
    const content = completion.choices[0].message.content;
    if (!content) return [];
    
    const result = JSON.parse(content) as GeneratedTopicsResponse;
    return result.topics;
  } catch (error) {
    console.error("Error generating dynamic prompts (no history):", error);
    // Return empty array to trigger fallback
    return [];
  }
}

export async function generateDynamicPromptsWithHistory(entries: JournalEntry[]): Promise<GeneratedTopic[]> {
  const entriesSummary = entries.map(e => e.content).join("\n\n");
  
  const prompt = `动态题库【有历史记录版本】:
根据用户最近的感恩日记内容,为他们生成5个个性化的、有深度的题目。

用户最近的日记:
${entriesSummary}

【核心要求】
1. 深度个性化 - 基于用户提到过的主题、人物、事物
2. 引发深思 - 引导更深层的反思,而非表面
3. 具体而非抽象 - 不要泛泛的问题
4. 情感共鸣 - 触动内心,激发写作欲望
5. 每个题目20-35字

【题目方向参考】
- 追问提到的人: "你提到了[某人],有没有和TA之间从未说出口的感谢?"
- 深挖提到的主题: "你经常写到[某主题],它对你的意义到底是什么?"
- 探索新角度: "除了[提到的事物],你生活中还有什么值得更多感恩?"
- 连接过去与现在: "你和[提到的人/事]的关系这些年有什么变化?"

请以JSON格式返回:
{
  "topics": [
    {"id": "1", "text": "题目内容", "category": "personalized", "icon": "emoji"}
  ]
}`;

  try {
    const messages = [
      { role: "system", content: SYSTEM_ROLE },
      { role: "user", content: prompt },
    ];
    
    const completion = await tryModelWithFallback(messages, { type: "json_object" }, 0.8);
    const content = completion.choices[0].message.content;
    if (!content) return [];
    
    const result = JSON.parse(content) as GeneratedTopicsResponse;
    return result.topics;
  } catch (error) {
    console.error("Error generating dynamic prompts (with history):", error);
    // Return empty array to trigger fallback
    return [];
  }
}
