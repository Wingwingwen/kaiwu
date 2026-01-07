# Enlightenment Journal (Awaken Entries) API Documentation

## 项目概览

**Enlightenment Journal** 是一个结合 AI 智慧的日记应用，旨在通过四位智者（孔子、老子、释迦牟尼、柏拉图）的视角，为用户的写作提供深度洞察和引导。

- **前端框架**: React, Vite
- **后端框架**: Express, tRPC
- **数据库**: Drizzle ORM
- **API 通信**: tRPC (TypeScript-first schema validation with Zod)

## 接口列表 (tRPC Routers

### 1. System Router (`system`)
系统级接口，用于健康检查和管理员通知。

| 方法名 | 类型 | 输入参数 | 返回值 | 描述 |
| :--- | :--- | :--- | :--- | :--- |
| `health` | Query | `{ timestamp: number }` | `{ ok: boolean }` | 检查系统健康状态 |
| `notifyOwner` | Mutation | `{ title: string, content: string }` | `{ success: boolean }` | 发送通知给管理员 (仅限管理员) |

### 2. Auth Router (`auth`)
用户认证相关接口。

| 方法名 | 类型 | 输入参数 | 返回值 | 描述 |
| :--- | :--- | :--- | :--- | :--- |
| `me` | Query | - | `User` 对象 | 获取当前登录用户信息 |
| `logout` | Mutation | - | `{ success: boolean }` | 登出当前用户 |

### 3. Prompts Router (`prompts`)
写作提示相关接口。

| 方法名 | 类型 | 输入参数 | 返回值 | 描述 |
| :--- | :--- | :--- | :--- | :--- |
| `list` | Query | `{ category?: "gratitude" \| "philosophical" }` (可选) | `Prompt[]` | 获取写作提示列表，支持按分类筛选 |

### 4. Journal Router (`journal`)
日记条目管理接口。

| 方法名 | 类型 | 输入参数 | 返回值 | 描述 |
| :--- | :--- | :--- | :--- | :--- |
| `create` | Mutation | `{ content: string, category: enum, promptId?: number, isFreeWrite?: boolean, isDraft?: boolean }` | `JournalEntry` | 创建新的日记条目 |
| `update` | Mutation | `{ id: number, content?: string, sageInsights?: string, isDraft?: boolean }` | `JournalEntry` | 更新日记条目 |
| `list` | Query | - | `JournalEntry[]` | 获取当前用户的所有日记条目 |
| `get` | Query | `{ id: number }` | `JournalEntry` | 获取指定的日记条目 |
| `delete` | Mutation | `{ id: number }` | `JournalEntry` | 删除指定的日记条目 |

### 5. Sage Router (`sage`)
智者洞察与互动接口。

| 方法名 | 类型 | 输入参数 | 返回值 | 描述 |
| :--- | :--- | :--- | :--- | :--- |
| `getInsight` | Mutation | `{ content: string, sage: enum, category: enum }` | `{ sage, emoji, style, insight }` | 获取指定智者对内容的洞察 |
| `getAllInsights` | Mutation | `{ content: string, category: enum }` | `Insight[]` | 获取所有四位智者的洞察 |
| `favoriteInsight` | Mutation | `{ sage: enum, content: string, originalContent?: string }` | `FavoriteInsight` | 收藏智者的洞察 |
| `getFavorites` | Query | - | `FavoriteInsight[]` | 获取用户的收藏列表 |
| `removeFavorite` | Mutation | `{ id: number }` | `FavoriteInsight` | 删除收藏 |
| `getBlessings` | Mutation | `{ content: string }` | `Blessing[]` | 获取自由写作完成后的祝福/反馈 |
| `getSummary` | Mutation | `{ content: string, insights: Insight[] }` | `{ summary: string }` | 根据智者洞察生成综合总结 |

### 6. Completion Router (`completion`)
日记完成时的反馈接口。

| 方法名 | 类型 | 输入参数 | 返回值 | 描述 |
| :--- | :--- | :--- | :--- | :--- |
| `getFeedback` | Mutation | `{ content: string, category: enum }` | `Feedback[]` | 获取所有智者对完成日记的反馈 |

### 7. Voice Router (`voice`)
语音处理接口。

| 方法名 | 类型 | 输入参数 | 返回值 | 描述 |
| :--- | :--- | :--- | :--- | :--- |
| `transcribe` | Mutation | `{ audioUrl: string }` | `{ text: string, language: string }` | 将音频 URL 转录为文本 |

## Express Routes

### OAuth
| 方法名 | 路径 | 描述 |
| :--- | :--- | :--- |
| `GET` | `/api/oauth/callback` | OAuth 回调接口，处理登录凭证交换和 Session 创建。需要 query 参数 `code` 和 `state`。 |

## 智者定义 (Sages)

系统内置了四位智者，每位都有独特的风格和系统提示词：

1.  **孔子 (Confucius)**
    -   **风格**: 仁爱与关怀
    -   **核心**: 温暖连接，同理心，人际关系。
2.  **老子 (Laozi)**
    -   **风格**: 自然诗人
    -   **核心**: 道法自然，无为，自然意象。
3.  **释迦牟尼 (Buddha)**
    -   **风格**: 慈悲智慧
    -   **核心**: 觉察当下，无常，慈悲。
4.  **柏拉图 (Plato)**
    -   **风格**: 哲学思辨者
    -   **核心**: 理性思考，追求真理与美善。
