import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeSelector } from "@/components/ThemeSelector";
import { getLoginUrl } from "@/const";
import { useTheme } from "@/contexts/ThemeContext";
import { trpc } from "@/lib/trpc";
import { 
  ArrowLeft, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Edit3,
  Loader2, 
  Mic, 
  MicOff, 
  Moon, 
  RefreshCw,
  Save, 
  Sparkles, 
  Sun,
  X
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams, useSearch } from "wouter";
import { toast } from "sonner";
import { storagePut } from "@/lib/storage";

type SageInsight = {
  key: string;
  sage: string;
  emoji: string;
  style: string;
  insight: string;
};

export default function Write() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [, setLocation] = useLocation();
  const params = useParams<{ id?: string }>();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  
  const promptId = searchParams.get("promptId");
  const categoryParam = searchParams.get("category") as "gratitude" | "philosophical" | null;
  const isFreeMode = searchParams.get("mode") === "free";

  const [content, setContent] = useState("");
  const [category, setCategory] = useState<"gratitude" | "philosophical">(categoryParam || "gratitude");
  const [selectedPromptId, setSelectedPromptId] = useState<number | null>(promptId ? parseInt(promptId) : null);
  const [showPromptSelector, setShowPromptSelector] = useState(!isFreeMode && !promptId);
  const [showSagePanel, setShowSagePanel] = useState(false);
  const [sageInsights, setSageInsights] = useState<SageInsight[]>([]);
  // selectedSage 已移除 - 现在直接展示所有智者启示
  const [isDraft, setIsDraft] = useState(true);
  const [entryId, setEntryId] = useState<number | null>(params.id ? parseInt(params.id) : null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { data: prompts } = trpc.prompts.list.useQuery({});
  const { data: existingEntry } = trpc.journal.get.useQuery(
    { id: entryId! },
    { enabled: !!entryId && isAuthenticated }
  );

  const createMutation = trpc.journal.create.useMutation({
    onSuccess: (data) => {
      setEntryId(data.id);
      toast.success("草稿已保存");
    },
    onError: () => toast.error("保存失败，请重试"),
  });

  const updateMutation = trpc.journal.update.useMutation({
    onSuccess: () => toast.success(isDraft ? "草稿已保存" : "日记已保存"),
    onError: () => toast.error("保存失败，请重试"),
  });

  const getAllInsightsMutation = trpc.sage.getAllInsights.useMutation({
    onSuccess: (data) => {
      setSageInsights(data);
      setShowSagePanel(true);
    },
    onError: () => toast.error("获取启示失败，请重试"),
  });

  const transcribeMutation = trpc.voice.transcribe.useMutation({
    onSuccess: (data) => {
      setContent(prev => prev + (prev ? "\n" : "") + data.text);
      toast.success("语音已转换为文字");
    },
    onError: () => toast.error("语音转换失败，请重试"),
  });

  // Load existing entry
  useEffect(() => {
    if (existingEntry) {
      setContent(existingEntry.content);
      setCategory(existingEntry.category);
      setSelectedPromptId(existingEntry.promptId);
      setIsDraft(existingEntry.isDraft);
      if (existingEntry.sageInsights) {
        try {
          setSageInsights(JSON.parse(existingEntry.sageInsights));
        } catch (e) {
          console.error("Failed to parse sage insights:", e);
        }
      }
    }
  }, [existingEntry]);

  // Auto-save draft
  useEffect(() => {
    if (!isAuthenticated || !content.trim()) return;

    const timer = setTimeout(() => {
      if (entryId) {
        updateMutation.mutate({ id: entryId, content, isDraft: true });
      } else {
        createMutation.mutate({
          content,
          category,
          promptId: selectedPromptId ?? undefined,
          isFreeWrite: isFreeMode || !selectedPromptId,
          isDraft: true,
        });
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [content, isAuthenticated]);

  const selectedPrompt = prompts?.find(p => p.id === selectedPromptId);
  const gratitudePrompts = prompts?.filter(p => p.category === "gratitude") || [];
  const philosophicalPrompts = prompts?.filter(p => p.category === "philosophical") || [];

  const handleGetInsights = () => {
    if (!content.trim()) {
      toast.error("请先写一些内容");
      return;
    }
    getAllInsightsMutation.mutate({ content, category });
  };

  const [showFinalInsights, setShowFinalInsights] = useState(false);
  const [isLoadingFinalInsights, setIsLoadingFinalInsights] = useState(false);
  const [savedEntryId, setSavedEntryId] = useState<number | null>(null);
  const [editableContent, setEditableContent] = useState("");
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [summary, setSummary] = useState("");
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  const getSummaryMutation = trpc.sage.getSummary.useMutation({
    onSuccess: (data) => setSummary(data.summary),
    onError: () => console.error("Failed to get summary"),
  });

  const handleSave = async (asDraft: boolean) => {
    if (!content.trim()) {
      toast.error("请先写一些内容");
      return;
    }

    // If saving as draft, just save without insights
    if (asDraft) {
      const insightsJson = sageInsights.length > 0 ? JSON.stringify(sageInsights) : undefined;
      if (entryId) {
        await updateMutation.mutateAsync({ 
          id: entryId, 
          content, 
          isDraft: true,
          sageInsights: insightsJson,
        });
      } else {
        const entry = await createMutation.mutateAsync({
          content,
          category,
          promptId: selectedPromptId ?? undefined,
          isFreeWrite: isFreeMode || !selectedPromptId,
          isDraft: true,
        });
        setEntryId(entry.id);
        if (insightsJson) {
          await updateMutation.mutateAsync({ id: entry.id, sageInsights: insightsJson });
        }
      }
      setIsDraft(true);
      return;
    }

    // If completing (not draft), save and show sage insights
    setIsLoadingFinalInsights(true);
    setShowFinalInsights(true);

    try {
      // Save the entry first
      let savedId = entryId;
      if (entryId) {
        await updateMutation.mutateAsync({ 
          id: entryId, 
          content, 
          isDraft: false,
        });
      } else {
        const entry = await createMutation.mutateAsync({
          content,
          category,
          promptId: selectedPromptId ?? undefined,
          isFreeWrite: isFreeMode || !selectedPromptId,
          isDraft: false,
        });
        savedId = entry.id;
        setEntryId(entry.id);
      }
      setSavedEntryId(savedId);
      setIsDraft(false);

      // Get sage insights if not already loaded
      setEditableContent(content);
      setSummary("");
      if (sageInsights.length === 0) {
        try {
          const insights = await getAllInsightsMutation.mutateAsync({ content, category });
          setSageInsights(insights);
          // Save insights to entry
          if (savedId) {
            await updateMutation.mutateAsync({ 
              id: savedId, 
              sageInsights: JSON.stringify(insights),
            });
          }
          // Get summary
          getSummaryMutation.mutate({
            content,
            insights: insights.map(i => ({ sage: i.sage, insight: i.insight })),
          });
        } catch (error) {
          // Even if insights fail, entry is saved
          console.error("Failed to get insights:", error);
        }
      } else {
        // Save existing insights
        if (savedId) {
          await updateMutation.mutateAsync({ 
            id: savedId, 
            sageInsights: JSON.stringify(sageInsights),
          });
        }
        // Get summary for existing insights
        getSummaryMutation.mutate({
          content,
          insights: sageInsights.map(i => ({ sage: i.sage, insight: i.insight })),
        });
      }
    } catch (error) {
      toast.error("保存失败，请重试");
      setShowFinalInsights(false);
    } finally {
      setIsLoadingFinalInsights(false);
    }
  };

  const handleContinueAfterInsights = () => {
    setShowFinalInsights(false);
    toast.success("日记已完成保存！");
    setLocation("/history");
  };

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach(track => track.stop());
        
        // Upload to storage and transcribe
        try {
          const { url } = await storagePut(
            `voice/${Date.now()}.webm`,
            audioBlob,
            "audio/webm"
          );
          transcribeMutation.mutate({ audioUrl: url });
        } catch (error) {
          toast.error("上传音频失败");
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      toast.error("无法访问麦克风");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Require auth
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-2xl font-serif font-semibold mb-4">请先登录</h2>
          <p className="text-muted-foreground mb-6">登录后即可开始你的感恩写作之旅</p>
          <Button asChild>
            <a href={getLoginUrl()}>登录</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative ambient-bg">

      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" className="rounded-full icon-glow">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="font-serif font-semibold">
                {isFreeMode ? "自由笔记" : selectedPrompt ? "感恩写作" : "选择题目"}
              </h1>
              <p className="text-xs text-muted-foreground">
                {category === "gratitude" ? "感恩类" : "哲思类"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeSelector />
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full icon-glow">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            
            {isDraft && (
              <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded-full">
                草稿
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-4xl mx-auto px-4 py-6">
        {/* Prompt selector */}
        {showPromptSelector && !isFreeMode && (
          <div className="mb-6">
            <Tabs value={category} onValueChange={(v) => setCategory(v as "gratitude" | "philosophical")}>
              <TabsList className="w-full mb-4">
                <TabsTrigger value="gratitude" className="flex-1">感恩类</TabsTrigger>
                <TabsTrigger value="philosophical" className="flex-1">哲思类</TabsTrigger>
              </TabsList>

              <TabsContent value="gratitude">
                <ScrollArea className="h-[300px]">
                  <div className="grid gap-3 pr-4">
                    {gratitudePrompts.map((prompt) => (
                      <div
                        key={prompt.id}
                        className={`prompt-card cursor-pointer ${selectedPromptId === prompt.id ? "border-primary" : ""}`}
                        onClick={() => {
                          setSelectedPromptId(prompt.id);
                          setShowPromptSelector(false);
                        }}
                      >
                        <p className="text-sm leading-relaxed">{prompt.text}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="philosophical">
                <ScrollArea className="h-[300px]">
                  <div className="grid gap-3 pr-4">
                    {philosophicalPrompts.map((prompt) => (
                      <div
                        key={prompt.id}
                        className={`prompt-card cursor-pointer ${selectedPromptId === prompt.id ? "border-primary" : ""}`}
                        onClick={() => {
                          setSelectedPromptId(prompt.id);
                          setShowPromptSelector(false);
                        }}
                      >
                        <p className="text-sm leading-relaxed">{prompt.text}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>

            <div className="mt-4 text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowPromptSelector(false);
                  setSelectedPromptId(null);
                }}
              >
                或者开始自由写作
              </Button>
            </div>
          </div>
        )}

        {/* Writing area */}
        {(!showPromptSelector || isFreeMode) && (
          <div className="space-y-4">
            {/* Selected prompt display */}
            {selectedPrompt && (
              <div 
                className="writing-area p-4 cursor-pointer"
                onClick={() => setShowPromptSelector(true)}
              >
                <div className="flex items-start justify-between gap-4">
                  <p className="font-serif text-lg leading-relaxed">{selectedPrompt.text}</p>
                  <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                </div>
              </div>
            )}

            {/* Textarea */}
            <div className="writing-area p-6">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={isFreeMode ? "在这里自由书写你的感恩与思考..." : "开始写下你的感恩..."}
                className="writing-textarea"
                autoFocus
              />

              {/* Voice recording indicator */}
              {isRecording && (
                <div className="flex items-center gap-2 mt-4 p-3 bg-destructive/10 rounded-lg">
                  <div className="w-3 h-3 bg-destructive rounded-full animate-pulse" />
                  <span className="text-sm">录音中 {formatTime(recordingTime)}</span>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/50">
                <div className="flex items-center gap-2">
                  {/* Voice input */}
                  <Button
                    variant={isRecording ? "destructive" : "outline"}
                    size="sm"
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={transcribeMutation.isPending}
                    className="gap-2"
                  >
                    {transcribeMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isRecording ? (
                      <MicOff className="w-4 h-4" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                    {isRecording ? "停止" : "语音"}
                  </Button>

                  {/* Get insights - 用户输入时高亮发光 */}
                  <Button
                    variant={content.trim() ? "default" : "outline"}
                    size="sm"
                    onClick={handleGetInsights}
                    disabled={getAllInsightsMutation.isPending || !content.trim()}
                    className={`gap-2 transition-all duration-300 ${
                      content.trim() 
                        ? "bg-gradient-to-r from-terracotta to-ochre text-white shadow-lg shadow-terracotta/30 animate-pulse-soft hover:shadow-terracotta/50" 
                        : ""
                    }`}
                  >
                    {getAllInsightsMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className={`w-4 h-4 ${content.trim() ? "animate-pulse" : ""}`} />
                    )}
                    获取灵感
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSave(true)}
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="gap-2"
                  >
                    <Save className="w-4 h-4" />
                    保存草稿
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleSave(false)}
                    disabled={createMutation.isPending || updateMutation.isPending || !content.trim()}
                    className="gap-2"
                  >
                    <Check className="w-4 h-4" />
                    完成
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Sage insights panel - 全屏弹窗展示所有智者启示 */}
      {showSagePanel && sageInsights.length > 0 && (
        <div className="fixed inset-0 z-50 bg-background">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/30">
            <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
              <h2 className="text-lg font-medium flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                四位智者的启示
              </h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleGetInsights}
                  disabled={getAllInsightsMutation.isPending}
                  className="rounded-full"
                  title="刷新启示"
                >
                  <RefreshCw className={`w-5 h-5 ${getAllInsightsMutation.isPending ? 'animate-spin' : ''}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSagePanel(false)}
                  className="rounded-full"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="h-[calc(100vh-140px)] overflow-y-auto">
            <div className="max-w-3xl mx-auto px-4 py-6">
              {getAllInsightsMutation.isPending && sageInsights.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64">
                  <div className="w-16 h-16 border-2 border-primary border-t-transparent rounded-full animate-spin mb-6" />
                  <p className="text-muted-foreground text-lg">智者们正在沉思...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* User's content */}
                  <div className="p-5 rounded-2xl bg-muted/30 border border-border/20">
                    <p className="text-sm text-muted-foreground font-medium mb-3">我的记录</p>
                    <p className="text-base leading-relaxed">{content}</p>
                  </div>
                  
                  {/* All 4 Sage insights */}
                  <div className="space-y-6">
                    {sageInsights.map((sage) => (
                      <div 
                        key={sage.key}
                        className="p-5 rounded-2xl bg-card border border-border/30"
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <span className="text-2xl">{sage.emoji}</span>
                          <h3 className="text-lg font-medium">{sage.sage}</h3>
                        </div>
                        <p className="text-base leading-relaxed text-foreground/90 whitespace-pre-wrap">
                          {sage.insight}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom action */}
          <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border/30 safe-area-bottom">
            <div className="max-w-3xl mx-auto px-4 py-4">
              <Button
                onClick={() => setShowSagePanel(false)}
                className="w-full rounded-full h-12 text-base"
              >
                继续写作
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle sage panel button */}
      {sageInsights.length > 0 && !showSagePanel && !showFinalInsights && (
        <Button
          className="fixed bottom-6 right-6 z-30 rounded-full shadow-lg gap-2"
          onClick={() => setShowSagePanel(true)}
        >
          <Sparkles className="w-4 h-4" />
          查看启示
          <ChevronUp className="w-4 h-4" />
        </Button>
      )}

      {/* Final insights panel - shown after clicking "完成" - Full screen modal */}
      {showFinalInsights && (
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
                onClick={handleContinueAfterInsights}
                className="rounded-full"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="h-[calc(100vh-140px)] overflow-y-auto">
            <div className="max-w-3xl mx-auto px-4 py-6">
              {isLoadingFinalInsights ? (
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
                              setEditableContent(content);
                              setIsEditingContent(false);
                            }}
                          >
                            取消
                          </Button>
                          <Button
                            size="sm"
                            onClick={async () => {
                              if (!editableContent.trim()) return;
                              setIsLoadingFinalInsights(true);
                              setSummary("");
                              try {
                                const insights = await getAllInsightsMutation.mutateAsync({ content: editableContent, category });
                                setSageInsights(insights);
                                setContent(editableContent);
                                setIsEditingContent(false);
                                // Get new summary
                                getSummaryMutation.mutate({
                                  content: editableContent,
                                  insights: insights.map(i => ({ sage: i.sage, insight: i.insight })),
                                });
                              } catch (error) {
                                toast.error("获取启示失败");
                              } finally {
                                setIsLoadingFinalInsights(false);
                              }
                            }}
                            disabled={!editableContent.trim() || editableContent === content}
                            className="gap-1"
                          >
                            <RefreshCw className="w-3 h-3" />
                            重新获取启示
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-base leading-relaxed">{content}</p>
                    )}
                  </div>
                  
                  {/* All 4 Sage insights in one view */}
                  <div className="space-y-6">
                    {sageInsights.map((sage) => (
                      <div 
                        key={sage.key}
                        className="p-5 rounded-2xl bg-card border border-border/30"
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <span className="text-2xl">{sage.emoji}</span>
                          <h3 className="text-lg font-medium">{sage.sage}</h3>
                        </div>
                        <p className="text-base leading-relaxed text-foreground/90 whitespace-pre-wrap">
                          {sage.insight}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Summary section */}
                  {(summary || getSummaryMutation.isPending) && (
                    <div className="p-5 rounded-2xl bg-primary/5 border border-primary/20">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-medium text-primary">智者总结</h3>
                      </div>
                      {getSummaryMutation.isPending ? (
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
                onClick={handleContinueAfterInsights}
                className="w-full rounded-full h-12 text-base"
                disabled={isLoadingFinalInsights}
              >
                继续
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
