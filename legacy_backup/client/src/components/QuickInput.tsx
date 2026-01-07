import { useState, useRef, useEffect } from "react";
import { Mic, Check, Loader2, ChevronDown, Sparkles, Heart, RefreshCw, Edit3, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

type SageInsight = {
  key: string;
  sage: string;
  emoji: string;
  insight: string;
};

interface QuickInputProps {
  onComplete?: () => void;
}

export function QuickInput({ onComplete }: QuickInputProps) {
  const { isAuthenticated } = useAuth();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showInsightsModal, setShowInsightsModal] = useState(false);
  const [sageInsights, setSageInsights] = useState<SageInsight[]>([]);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [savedContent, setSavedContent] = useState("");
  const [editableContent, setEditableContent] = useState("");
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [favoriteStates, setFavoriteStates] = useState<Record<string, boolean>>({});
  const [summary, setSummary] = useState("");
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);
  
  const createEntryMutation = trpc.journal.create.useMutation();
  const getSageInsightsMutation = trpc.sage.getBlessings.useMutation();
  const getSummaryMutation = trpc.sage.getSummary.useMutation();
  const addFavoriteMutation = trpc.sage.favoriteInsight.useMutation();
  const utils = trpc.useUtils();

  // Focus textarea when expanded
  useEffect(() => {
    if (isExpanded && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isExpanded]);

  // Focus edit textarea when editing
  useEffect(() => {
    if (isEditingContent && editTextareaRef.current) {
      editTextareaRef.current.focus();
    }
  }, [isEditingContent]);

  // Get summary after insights are loaded
  useEffect(() => {
    if (showInsightsModal && sageInsights.length > 0 && !summary && !isLoadingSummary) {
      fetchSummary();
    }
  }, [showInsightsModal, sageInsights]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showInsightsModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showInsightsModal]);

  const fetchSummary = async () => {
    if (sageInsights.length === 0) return;
    
    setIsLoadingSummary(true);
    try {
      const result = await getSummaryMutation.mutateAsync({
        content: savedContent,
        insights: sageInsights.map(s => ({
          sage: s.sage,
          insight: s.insight,
        })),
      });
      setSummary(result.summary);
    } catch (error) {
      console.error("Failed to get summary:", error);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  // Submit with sage insights - save + get insight
  const handleSubmit = async () => {
    if (!content.trim() || !isAuthenticated) return;
    
    // If in collapsed mode, expand first and then process
    if (!isExpanded) {
      setIsExpanded(true);
    }
    
    setIsSubmitting(true);
    setIsLoadingInsights(true);
    setSavedContent(content.trim());
    setEditableContent(content.trim());
    setSummary("");
    setShowInsightsModal(true);
    
    try {
      // Save the entry first
      await createEntryMutation.mutateAsync({
        content: content.trim(),
        category: "gratitude",
        isFreeWrite: true,
      });
      
      utils.journal.list.invalidate();
      
      // Get sage insights
      try {
        const insights = await getSageInsightsMutation.mutateAsync({
          content: content.trim(),
        });
        setSageInsights(insights.map(b => ({
          key: b.key,
          sage: b.sage,
          emoji: b.emoji,
          insight: b.blessing,
        })));
      } catch (error) {
        // Even if insights fail, the entry is saved
        toast.success("记录已保存");
        handleCloseModal();
      }
    } catch (error) {
      toast.error("保存失败，请重试");
      setShowInsightsModal(false);
    } finally {
      setIsSubmitting(false);
      setIsLoadingInsights(false);
    }
  };

  // Get sage insights - save + get insight
  const handleGetInsights = async () => {
    if (!content.trim() || !isAuthenticated) return;
    
    setIsSubmitting(true);
    setIsLoadingInsights(true);
    setSavedContent(content.trim());
    setEditableContent(content.trim());
    setSummary("");
    setShowInsightsModal(true);
    
    try {
      // Save the entry first
      await createEntryMutation.mutateAsync({
        content: content.trim(),
        category: "gratitude",
        isFreeWrite: true,
      });
      
      utils.journal.list.invalidate();
      
      // Get sage insights
      try {
        const insights = await getSageInsightsMutation.mutateAsync({
          content: content.trim(),
        });
        setSageInsights(insights.map(b => ({
          key: b.key,
          sage: b.sage,
          emoji: b.emoji,
          insight: b.blessing,
        })));
      } catch (error) {
        // Even if insights fail, the entry is saved
        toast.success("记录已保存，但获取启示失败");
        handleCloseModal();
      }
    } catch (error) {
      toast.error("保存失败，请重试");
      setShowInsightsModal(false);
    } finally {
      setIsSubmitting(false);
      setIsLoadingInsights(false);
    }
  };

  // Refresh insights with edited content
  const handleRefreshInsights = async () => {
    if (!editableContent.trim()) return;
    
    setIsLoadingInsights(true);
    setSummary("");
    
    try {
      const insights = await getSageInsightsMutation.mutateAsync({
        content: editableContent.trim(),
      });
      setSageInsights(insights.map(b => ({
        key: b.key,
        sage: b.sage,
        emoji: b.emoji,
        insight: b.blessing,
      })));
      setSavedContent(editableContent.trim());
      setIsEditingContent(false);
    } catch (error) {
      toast.error("获取启示失败");
    } finally {
      setIsLoadingInsights(false);
    }
  };

  const handleCloseModal = () => {
    setShowInsightsModal(false);
    setContent("");
    setSavedContent("");
    setEditableContent("");
    setIsExpanded(false);
    setSageInsights([]);
    setFavoriteStates({});
    setSummary("");
    setIsEditingContent(false);
    onComplete?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !isExpanded) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleExpand = () => {
    setIsExpanded(true);
  };

  const handleCollapse = () => {
    if (!content.trim()) {
      setIsExpanded(false);
    }
  };

  // Voice recording placeholder
  const handleVoice = () => {
    setIsRecording(!isRecording);
    toast.info("语音功能开发中");
  };

  // Toggle favorite for a sage insight
  const handleToggleFavorite = async (sageKey: string, sageName: string, content: string) => {
    if (favoriteStates[sageKey]) {
      return;
    }
    
    try {
      await addFavoriteMutation.mutateAsync({
        sage: sageKey as "confucius" | "laozi" | "buddha" | "plato",
        content,
        originalContent: savedContent,
      });
      setFavoriteStates(prev => ({ ...prev, [sageKey]: true }));
      toast.success("已收藏");
    } catch (error) {
      toast.error("收藏失败");
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Full-screen Insights Modal */}
      {showInsightsModal && (
        <div className="fixed inset-0 z-50 bg-background">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/30">
            <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
              <h2 className="text-lg font-medium flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                智者寄语
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCloseModal}
                className="rounded-full"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="h-[calc(100vh-140px)] overflow-y-auto">
            <div className="max-w-3xl mx-auto px-4 py-6">
              {isLoadingInsights ? (
                // Loading state
                <div className="flex flex-col items-center justify-center h-64">
                  <div className="w-16 h-16 border-2 border-primary border-t-transparent rounded-full animate-spin mb-6" />
                  <p className="text-muted-foreground text-lg">智者们正在沉思...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* User's editable content */}
                  <div className="p-5 rounded-2xl bg-muted/30 border border-border/20">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm text-muted-foreground font-medium">我的记录</p>
                      {!isEditingContent && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsEditingContent(true)}
                          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <Edit3 className="w-3 h-3 mr-1" />
                          编辑
                        </Button>
                      )}
                    </div>
                    {isEditingContent ? (
                      <div className="space-y-3">
                        <textarea
                          ref={editTextareaRef}
                          value={editableContent}
                          onChange={(e) => setEditableContent(e.target.value)}
                          className="w-full min-h-[100px] p-4 rounded-xl bg-background/50 border border-border/30 text-base leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditableContent(savedContent);
                              setIsEditingContent(false);
                            }}
                          >
                            取消
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleRefreshInsights}
                            disabled={!editableContent.trim() || editableContent === savedContent}
                            className="gap-1"
                          >
                            <RefreshCw className="w-3 h-3" />
                            重新获取启示
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-base leading-relaxed">{savedContent}</p>
                    )}
                  </div>
                  
                  {/* All 4 Sage insights in one view */}
                  <div className="space-y-6">
                    {sageInsights.map((sage) => (
                      <div 
                        key={sage.key}
                        className="p-5 rounded-2xl bg-card border border-border/30"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{sage.emoji}</span>
                            <h3 className="text-lg font-medium">{sage.sage}</h3>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleFavorite(sage.key, sage.sage, sage.insight)}
                            className={`rounded-full h-9 w-9 ${favoriteStates[sage.key] ? 'text-red-500' : 'text-muted-foreground hover:text-red-400'}`}
                          >
                            <Heart className={`w-5 h-5 ${favoriteStates[sage.key] ? 'fill-current' : ''}`} />
                          </Button>
                        </div>
                        <p className="text-base leading-relaxed text-foreground/90 whitespace-pre-wrap">
                          {sage.insight}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Summary section */}
                  {(summary || isLoadingSummary) && (
                    <div className="p-5 rounded-2xl bg-primary/5 border border-primary/20">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-medium text-primary">智者总结</h3>
                      </div>
                      {isLoadingSummary ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>正在总结...</span>
                        </div>
                      ) : (
                        <p className="text-lg leading-relaxed text-foreground/90 italic">
                          {summary}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Bottom action */}
          <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border/30 safe-area-bottom">
            <div className="max-w-3xl mx-auto px-4 py-4">
              <Button
                onClick={handleCloseModal}
                className="w-full rounded-full h-12 text-base"
                disabled={isLoadingInsights}
              >
                继续
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Expanded input panel */}
      {isExpanded && !showInsightsModal && (
        <div className="fixed inset-x-0 bottom-0 z-40">
          {/* Semi-transparent overlay */}
          <div 
            className="fixed inset-0 bg-background/60 backdrop-blur-[1px]" 
            onClick={() => !content.trim() && handleCollapse()}
            style={{ bottom: '50vh' }}
          />
          
          {/* Main panel */}
          <div className="w-full flex flex-col bg-card border-t border-border/50 shadow-xl"
               style={{ height: '50vh', minHeight: '320px', maxHeight: '450px' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-border/30 shrink-0">
              <h3 className="font-medium">自由记录</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCollapse}
                className="rounded-full h-8 w-8"
              >
                <ChevronDown className="w-5 h-5" />
              </Button>
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-y-auto">
              <div className="h-full flex justify-center">
                <div className="w-full max-w-2xl p-4 h-full">
                  <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="写下此刻的想法..."
                    className="w-full h-full resize-none bg-transparent text-base leading-relaxed placeholder:text-muted-foreground focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Bottom actions */}
            <div className="px-6 py-3 border-t border-border/30 shrink-0 bg-card">
              <div className="max-w-2xl mx-auto flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleVoice}
                  className={`rounded-full px-3 ${isRecording ? "text-red-500 animate-pulse" : ""}`}
                >
                  <Mic className="w-4 h-4 mr-1" />
                  语音
                </Button>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGetInsights}
                    disabled={!content.trim() || isSubmitting}
                    className={`rounded-full gap-1.5 transition-all ${
                      content.trim() 
                        ? 'border-primary/50 text-primary hover:bg-primary/10 hover:border-primary' 
                        : ''
                    }`}
                  >
                    <Sparkles className={`w-4 h-4 ${content.trim() ? 'text-primary' : ''}`} />
                    哲人启示
                  </Button>
                  
                  <Button
                    onClick={handleSubmit}
                    disabled={!content.trim() || isSubmitting}
                    className="rounded-full gap-2"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    完成
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Collapsed mode - bottom bar */}
      {!isExpanded && !showInsightsModal && (
        <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border/50 z-30 safe-area-bottom">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onFocus={handleExpand}
                  onKeyDown={handleKeyDown}
                  placeholder="写点什么..."
                  className="w-full px-4 py-3 bg-muted/30 border border-border/30 rounded-full text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all cursor-text"
                />
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={handleVoice}
                className={`rounded-full shrink-0 ${isRecording ? "text-red-500 animate-pulse" : ""}`}
              >
                <Mic className="w-5 h-5" />
              </Button>
              
              <Button
                size="icon"
                onClick={handleSubmit}
                disabled={!content.trim() || isSubmitting}
                className="rounded-full shrink-0 bg-primary hover:bg-primary/90"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Check className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
