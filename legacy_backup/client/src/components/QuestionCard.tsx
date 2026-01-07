import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mic, Sparkles, Check, X, MessageCircle, Heart, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

interface Prompt {
  id: number;
  text: string;
  category: string;
}

// Generate emoji based on prompt content
function getPromptEmoji(text: string, category: string): string {
  // Keywords to emoji mapping
  const keywords: Record<string, string> = {
    // Gratitude related
    "温暖": "✨",
    "帮助": "🤝",
    "感谢": "🙏",
    "幸福": "💝",
    "快乐": "😊",
    "美好": "🌟",
    "爱": "❤️",
    "家人": "🏠",
    "朋友": "👫",
    "健康": "💪",
    "食物": "🍽️",
    "自然": "🌿",
    "阳光": "☀️",
    "学习": "📚",
    "成长": "🌱",
    "努力": "💪",
    "梦想": "🌟",
    "希望": "🌈",
    // Philosophical related
    "意义": "💡",
    "人生": "🎯",
    "思考": "🧠",
    "智慧": "🧬",
    "真理": "🔮",
    "自由": "🕊️",
    "选择": "⚖️",
    "命运": "🎲",
    "时间": "⏳",
    "永恒": "♾️",
    "存在": "🌌",
    "灵魂": "🧘",
    "心灵": "💜",
    "内心": "🌙",
    "平静": "🌾",
    "宁静": "🌺",
  };
  
  // Check for keyword matches
  for (const [keyword, emoji] of Object.entries(keywords)) {
    if (text.includes(keyword)) {
      return emoji;
    }
  }
  
  // Default emoji based on category
  return category === "gratitude" ? "✨" : "💡";
}

interface QuestionCardProps {
  prompt: Prompt;
  isActive: boolean;
  position: "left" | "center" | "right";
  onComplete: () => void;
}

interface SageInsight {
  sage: string;
  symbol: string;
  insight: string;
}

interface SageFeedback {
  sage: string;
  emoji: string;
  feedback: string;
}

export function QuestionCard({ prompt, isActive, position, onComplete }: QuestionCardProps) {
  const [mode, setMode] = useState<"browse" | "answer" | "completed">("browse");
  const [content, setContent] = useState("");
  const [showInsights, setShowInsights] = useState(false);
  const [insights, setInsights] = useState<SageInsight[]>([]);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [completionFeedback, setCompletionFeedback] = useState<SageFeedback[]>([]);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const createEntry = trpc.journal.create.useMutation();
  const getInsights = trpc.sage.getAllInsights.useMutation();
  const favoriteInsight = trpc.sage.favoriteInsight.useMutation();
  const getCompletionFeedback = trpc.completion.getFeedback.useMutation();

  // Reset state when prompt changes
  useEffect(() => {
    setMode("browse");
    setContent("");
    setShowInsights(false);
    setInsights([]);
    setCompletionFeedback([]);
  }, [prompt.id]);

  // Focus textarea when entering answer mode
  useEffect(() => {
    if (mode === "answer" && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [mode]);

  const handleStartAnswer = () => {
    setMode("answer");
  };

  const handleGetInsights = async () => {
    if (!content.trim() || isLoadingInsights) return;
    
    setIsLoadingInsights(true);
    setShowInsights(true);
    setInsights([]);
    
    try {
      const result = await getInsights.mutateAsync({
        content: content,
        category: prompt.category as "gratitude" | "philosophical",
      });
      setInsights(result.map(r => ({ sage: r.sage, symbol: r.emoji, insight: r.insight })));
    } catch (error) {
      console.error("Failed to get insights:", error);
      setShowInsights(false);
    } finally {
      setIsLoadingInsights(false);
    }
  };

  const handleRefreshInsights = async () => {
    if (isLoadingInsights) return;
    setIsLoadingInsights(true);
    setInsights([]);
    
    try {
      const result = await getInsights.mutateAsync({
        content: content,
        category: prompt.category as "gratitude" | "philosophical",
      });
      setInsights(result.map(r => ({ sage: r.sage, symbol: r.emoji, insight: r.insight })));
    } catch (error) {
      console.error("Failed to refresh insights:", error);
    } finally {
      setIsLoadingInsights(false);
    }
  };

  const handleComplete = async () => {
    if (!content.trim()) return;
    
    try {
      // Save the entry
      await createEntry.mutateAsync({
        content: content,
        promptId: prompt.id,
        category: prompt.category as "gratitude" | "philosophical",
      });
      
      // Show completion mode and get feedback
      setMode("completed");
      setShowInsights(false);
      setIsLoadingFeedback(true);
      
      try {
        const feedbacks = await getCompletionFeedback.mutateAsync({
          content: content,
          category: prompt.category as "gratitude" | "philosophical",
        });
        setCompletionFeedback(feedbacks);
      } catch (error) {
        console.error("Failed to get completion feedback:", error);
        // Set default feedback if API fails
        setCompletionFeedback([
          { sage: "孔子", emoji: "📜", feedback: "写得真好！继续保持这份真诚。" },
          { sage: "老子", emoji: "☯️", feedback: "善哉，你已在道中。" },
          { sage: "释迦牟尼", emoji: "🙏", feedback: "觉察当下，你做得很好。" },
          { sage: "柏拉图", emoji: "🏛️", feedback: "思考使人进步，继续探索。" },
        ]);
      } finally {
        setIsLoadingFeedback(false);
      }
    } catch (error) {
      console.error("Failed to save entry:", error);
    }
  };

  const handleContinue = () => {
    setMode("browse");
    setContent("");
    setCompletionFeedback([]);
    onComplete();
  };

  const handleCancel = () => {
    setMode("browse");
    setContent("");
    setShowInsights(false);
  };

  // Map sage name to key for API
  const sageNameToKey: Record<string, "confucius" | "laozi" | "buddha" | "plato"> = {
    "孔子": "confucius",
    "老子": "laozi",
    "释迦牟尼": "buddha",
    "柏拉图": "plato",
  };

  const handleFavoriteInsight = async (insight: SageInsight) => {
    const sageKey = sageNameToKey[insight.sage];
    if (!sageKey) return;
    
    try {
      await favoriteInsight.mutateAsync({
        sage: sageKey,
        content: insight.insight,
        originalContent: content,
      });
      console.log("Insight favorited!");
    } catch (error) {
      console.error("Failed to favorite insight:", error);
    }
  };

  // Card position styles with smooth animation
  const positionStyles = {
    left: "opacity-40 scale-90 -translate-x-4",
    center: "opacity-100 scale-100 z-10",
    right: "opacity-40 scale-90 translate-x-4",
  };

  // Sage colors for visual distinction
  const sageColors: Record<string, { accent: string }> = {
    "孔子": { accent: "text-amber-600" },
    "老子": { accent: "text-slate-400" },
    "释迦牟尼": { accent: "text-yellow-500" },
    "柏拉图": { accent: "text-emerald-500" },
  };

  return (
    <div
      className={cn(
        "transition-all duration-500 ease-out flex-shrink-0",
        "w-[85%] max-w-2xl",
        positionStyles[position]
      )}
    >
      <div className={cn(
        "bg-card rounded-3xl border border-border/50 overflow-hidden",
        "transition-all duration-300",
        mode === "answer" ? "shadow-lg" : "shadow-md",
        isActive && "card-glow"
      )}>
        {/* Browse Mode */}
        {mode === "browse" && (
          <div className="p-8 md:p-12 flex flex-col items-center justify-center min-h-[320px] text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <span className="text-3xl">{getPromptEmoji(prompt.text, prompt.category)}</span>
            </div>
            <h3 className="text-xl md:text-2xl font-serif leading-relaxed mb-8 max-w-lg">
              {prompt.text}
            </h3>
            <Button
              onClick={handleStartAnswer}
              className="rounded-full px-8 py-3 text-base btn-glow"
              disabled={!isActive}
            >
              开始回答
            </Button>
          </div>
        )}

        {/* Answer Mode */}
        {mode === "answer" && (
          <div className="p-6 md:p-8">
            {/* Question */}
            <div className="flex items-start gap-3 mb-4">
              <span className="text-xl flex-shrink-0">{getPromptEmoji(prompt.text, prompt.category)}</span>
              <h3 className="text-base md:text-lg font-serif leading-relaxed">
                {prompt.text}
              </h3>
            </div>

            {/* Textarea */}
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="写下你的想法..."
              className="min-h-[120px] resize-none bg-background/50 border-border/50 rounded-xl text-base leading-relaxed focus:ring-primary/30"
            />

            {/* Insights Panel - Compact Design */}
            {showInsights && (
              <div className="mt-4 rounded-2xl overflow-hidden bg-muted/10">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary/70" />
                    <span className="text-sm font-medium text-foreground/80">智者启示</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleRefreshInsights}
                      disabled={isLoadingInsights}
                      className="flex items-center gap-1 px-2 py-1 rounded-full hover:bg-muted/50 transition-colors text-xs text-muted-foreground"
                      title="再次请教"
                    >
                      <MessageCircle className={cn("w-3.5 h-3.5", isLoadingInsights && "animate-pulse")} />
                      <span>再次请教</span>
                    </button>
                    <button
                      onClick={() => setShowInsights(false)}
                      className="p-1.5 rounded-full hover:bg-muted/50 transition-colors"
                      title="关闭"
                    >
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>

                {/* Loading State */}
                {isLoadingInsights && insights.length === 0 && (
                  <div className="px-4 pb-4 flex flex-col items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 text-primary/60 animate-spin mb-3" />
                    <p className="text-sm text-muted-foreground">智者们正在思考...</p>
                  </div>
                )}

                {/* Insights Content - Compact vertical layout */}
                {insights.length > 0 && (
                  <div className="px-4 pb-4 space-y-4 max-h-[50vh] overflow-y-auto custom-scrollbar">
                    {insights.map((insight, index) => {
                      const colors = sageColors[insight.sage] || { accent: "text-primary" };
                      return (
                        <div key={index} className="group animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                          {/* Sage Header */}
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-base">{insight.symbol}</span>
                            <h4 className={cn("font-medium text-xs", colors.accent)}>{insight.sage}</h4>
                            {/* Favorite Button */}
                            <button
                              onClick={() => handleFavoriteInsight(insight)}
                              className="ml-auto p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-muted/50 transition-all"
                              title="收藏这条启示"
                            >
                              <Heart className="w-3 h-3 text-muted-foreground hover:text-red-400" />
                            </button>
                          </div>
                          
                          {/* Insight Content - Compact */}
                          <p className="text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap pl-6">
                            {insight.insight}
                          </p>
                          
                          {/* Divider */}
                          {index < insights.length - 1 && (
                            <div className="mt-3 border-b border-border/20" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full gap-1.5 text-muted-foreground hover:text-foreground"
                  disabled
                >
                  <Mic className="w-4 h-4" />
                  <span className="hidden sm:inline">语音</span>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleGetInsights}
                  disabled={!content.trim() || isLoadingInsights}
                  className="rounded-full gap-1.5 text-muted-foreground hover:text-foreground"
                >
                  {isLoadingInsights ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">灵感</span>
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  className="rounded-full text-muted-foreground"
                >
                  取消
                </Button>
                
                <Button
                  size="sm"
                  onClick={handleComplete}
                  disabled={!content.trim() || createEntry.isPending}
                  className="rounded-full gap-1.5 btn-glow"
                >
                  <Check className="w-4 h-4" />
                  完成
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Completed Mode - Sage Feedback */}
        {mode === "completed" && (
          <div className="p-6 md:p-8">
            {/* Success Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                <Check className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-serif text-foreground mb-2">写作完成</h3>
              <p className="text-sm text-muted-foreground">智者寄语</p>
            </div>

            {/* Loading Feedback */}
            {isLoadingFeedback && (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="w-8 h-8 text-primary/60 animate-spin mb-3" />
                <p className="text-sm text-muted-foreground">智者们正在沉思...</p>
              </div>
            )}

            {/* Sage Feedbacks - Vertical scroll layout */}
            {!isLoadingFeedback && completionFeedback.length > 0 && (
              <div className="max-h-[50vh] overflow-y-auto custom-scrollbar space-y-4 mb-6">
                {completionFeedback.map((fb, index) => {
                  const colors = sageColors[fb.sage] || { accent: "text-primary" };
                  return (
                    <div 
                      key={index} 
                      className="animate-fade-in-up"
                      style={{ animationDelay: `${index * 0.15}s` }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{fb.emoji}</span>
                        <span className={cn("text-sm font-medium", colors.accent)}>{fb.sage}</span>
                      </div>
                      <p className="text-sm leading-relaxed text-foreground/80 pl-7">
                        {fb.feedback}
                      </p>
                      {index < completionFeedback.length - 1 && (
                        <div className="mt-4 border-b border-border/20" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Continue Button */}
            <div className="text-center">
              <Button
                onClick={handleContinue}
                className="rounded-full px-8 py-3 text-base btn-glow"
              >
                继续
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
