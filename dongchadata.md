# 🧠 洞察回顾系统深度分析文档

## 📊 数据流总览

```
用户日记 → 本地缓存 → AI分析 → 结果缓存 → 前端展示
```

---

## 1. 数据源 (Data Sources)

### 📝 日记内容
- **来源**: `getJournalEntries()` 函数
- **格式**: 最近20条日记内容
- **处理**: 将日记转换为文本格式 `topic: content`
- **示例**:
```typescript
const entriesText = recentEntries.map(e => `${e.topic}: ${e.content}`).join('\n\n');
```

### 🎯 分析类型
- **5种模式**: `relationships` | `consciousness` | `growth` | `attention` | `conflicts`
- **配置**: 每种类型有专门的 `ANALYSIS_CONFIG` 设置

---

## 2. AI调用机制 (AI Invocation)

### 🤖 tRPC接口
- **接口**: `trpc.ai.generateReviewAnalysis`
- **输入**:
```typescript
{
  type: 'relationships' | 'consciousness' | 'growth' | 'attention' | 'conflicts',
  entries: '日记文本内容',
  language: 'zh' | 'en'
}
```

### 🧠 后端AI处理
- **LLM调用**: `invokeLLM()` 函数
- **思考预算**: `8192 tokens` (深度分析)
- **重试机制**: 失败后自动重试2次，指数退避

### 🎨 个性化Prompt设计

| 类型 | 理论基础 | 输出结构 | 特色功能 |
|------|----------|----------|----------|
| **relationships** | 社会网络分析 | people数组 + insight | 人物提及统计 |
| **consciousness** | David Hawkins意识地图 | distribution + levelBreakdown | 三色维度分类 |
| **growth** | 意识层级进化 | shifts数组 + progressSummary | 关键转变识别 |
| **attention** | 正念觉察理论 | reminders数组 + blessing | 核心洞察高亮 |
| **conflicts** | 荣格心理学 | conflicts数组 + wisdom | 矛盾vs整合对比 |

---

## 3. 缓存机制 (Caching)

### ⏰ 缓存策略
- **缓存时间**: 2小时 (7200000ms)
- **存储位置**: AsyncStorage本地存储
- **缓存键**: `review_cache_${type}` (如 `review_cache_consciousness`)

### 🔄 冷却机制
- **检查函数**: `checkCacheCooldown()`
- **限制**: 同一类型2小时内只能生成一次
- **状态**: 显示剩余冷却时间，防止重复请求

### 💾 数据流程
```typescript
// 1. 检查缓存
const cachedData = await getReviewCache(reviewType);
if (cachedData) return cachedData;

// 2. 生成新数据
const newData = await analysisMutation.mutate({ type, entries, language });

// 3. 保存缓存
await saveReviewCache(reviewType, newData);
```

---

## 4. 思考过程 (Thinking Process)

### 🧐 实时反馈
- **步骤**: 4个阶段，每1.5秒更新
- **内容**:
  - 中文: "正在分析你的日记内容..." → "识别核心主题与模式..." → "构建意识层级结构..." → "生成个性化洞察..."
  - 英文: "Analyzing your journal entries..." → "Identifying core themes and patterns..." → "Building consciousness structure..." → "Generating personalized insights..."

### 💡 深度思考
- **预算**: 8192 tokens 用于深度分析
- **提取**: 从AI响应中提取思考内容
- **展示**: 在加载界面显示思考过程

---

## 5. 备用数据 (Fallback Data)

### 🛡️ 降级策略
当AI调用失败时，使用预设的模拟数据：
- **函数**: `getMockData()`
- **内容**: 每种类型都有预设的合理数据结构
- **保证**: 确保用户体验不中断

---

## 6. 数据安全与隐私

### 🔒 本地优先
- **数据存储**: 日记内容完全本地存储
- **AI调用**: 只传输必要的文本内容，不包含个人身份信息
- **缓存**: 分析结果本地缓存，不上传服务器

### ⚡ 性能优化
- **异步处理**: 所有AI调用都是异步的
- **错误处理**: 完整的错误捕获和降级机制
- **重试逻辑**: 智能重试，避免无限循环

---

## 🎯 总结

洞察数据的核心是 **"日记内容 + AI分析 + 本地缓存"** 的三层架构：

1. **数据输入**: 从本地存储获取最近20条日记
2. **智能分析**: 基于不同心理学理论的个性化AI分析
3. **结果缓存**: 2小时本地缓存，避免重复调用
4. **视觉呈现**: 根据分析类型定制化的组件展示

这套机制既保证了分析的深度和准确性，又兼顾了用户体验和成本控制。