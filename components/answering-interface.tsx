'use client'

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { RefreshCw, Send, Sparkles, ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, PenLine, Repeat } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"

import { getSageInsight, getAllSageInsights, SageInsightResponse } from "@/app/actions/ai"
import { SAGES } from "@/lib/ai/prompts"
import { getDynamicPrompts } from "@/app/actions/prompts"
import { createEntryWithInsights } from "@/app/actions/entry"
import { STATIC_PROMPTS } from "@/lib/data/static-prompts"

// 智者头像映射函数
const getSageAvatar = (sageName: string): string => {
  const sageKeyMap: Record<string, string> = {
    '孔子': 'confucius',
    '老子': 'laozi', 
    '释迦牟尼': 'buddha',
    '柏拉图': 'plato'
  }
  
  const key = sageKeyMap[sageName]
  return key ? `/sagens/${key}-avatar.png` : ''
}

interface AnsweringInterfaceProps {
  userEmail?: string
  completedCount?: number
  initialPrompts?: any[] // Keep for compatibility but we use local logic
  mode?: 'daily' | 'free'
}

type ViewState = 'selection' | 'answering' | 'insights'
type Theme = 'gratitude' | 'philosophical'
type BatchType = 'normal' | 'ai'

export function AnsweringInterface({ userEmail, completedCount = 0, mode = 'daily' }: AnsweringInterfaceProps) {
  // UI State
  const [view, setView] = useState<ViewState>(mode === 'free' ? 'answering' : 'selection')
  
  // Logic State
  const [theme, setTheme] = useState<Theme>('gratitude')
  const [batchType, setBatchType] = useState<BatchType>('normal')
  const [prompts, setPrompts] = useState<{id: string, text: string, type: string}[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [skipCount, setSkipCount] = useState(0)
  
  // Loading State
  const [isLoading, setIsLoading] = useState(false)

  // Answering State
  const [selectedPrompt, setSelectedPrompt] = useState<string>(mode === 'free' ? "自由书写" : "")
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [insights, setInsights] = useState<SageInsightResponse[]>([])
  const [inspirationInsights, setInspirationInsights] = useState<SageInsightResponse[]>([])
  const [isGettingInspiration, setIsGettingInspiration] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  // Helper: Get random prompts from static list
  const getRandomStaticPrompts = useCallback((theme: Theme, count: number = 5) => {
    const source = STATIC_PROMPTS[theme]
    const shuffled = [...source].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, count).map((text, i) => ({
      id: `static-${Date.now()}-${i}`,
      text,
      type: 'static'
    }))
  }, [])

  // Helper: Load prompts based on current state
  const loadPrompts = useCallback(async (targetTheme: Theme, targetBatchType: BatchType) => {
    setIsLoading(true)
    try {
      if (targetBatchType === 'normal') {
        const newPrompts = getRandomStaticPrompts(targetTheme)
        setPrompts(newPrompts)
      } else {
        // AI Prompts
        // Check if we have history (simulate check or assume yes for personalized)
        // User rule: "Based on recent 10 journal entries" -> getDynamicPrompts(true)
        const dynamicPrompts = await getDynamicPrompts(true)
        setPrompts(dynamicPrompts.map(p => ({ ...p, type: 'ai' })))
        toast.success("AI 为你生成了专属题目")
      }
      setCurrentIndex(0)
    } catch (error) {
      console.error("Failed to load prompts:", error)
      toast.error("加载题目失败，已切换回普通题目")
      // Fallback to static
      setPrompts(getRandomStaticPrompts(targetTheme))
      setBatchType('normal')
    } finally {
      setIsLoading(false)
    }
  }, [getRandomStaticPrompts])

  // Initialize
  useEffect(() => {
    loadPrompts(theme, 'normal')
  }, []) // Run once on mount

  // 2. Theme Toggle Logic
  const handleThemeChange = (newTheme: Theme) => {
    if (newTheme === theme) return
    setTheme(newTheme)
    setBatchType('normal') // Reset to normal
    setSkipCount(0) // Reset skips
    loadPrompts(newTheme, 'normal')
  }

  // 3. & 4. Swipe/Skip Logic
  const handleNext = () => {
    const isLast = currentIndex >= prompts.length - 1
    
    // Increment skip count (since user didn't select this one)
    const newSkipCount = skipCount + 1
    setSkipCount(newSkipCount)

    if (isLast) {
      // Handle Batch Complete
      handleBatchComplete(newSkipCount)
    } else {
      setCurrentIndex(prev => prev + 1)
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
      // Decrement skip count? Maybe not needed, simple logic implies forward skips count.
      // User rule says "Continuous skip 5 times". Going back might break continuity? 
      // Let's keep it simple: only forward actions count towards the trigger threshold.
    }
  }

  const handleBatchComplete = (currentSkipCount: number) => {
    let nextBatchType: BatchType = 'normal'

    if (batchType === 'ai') {
      // Rule: Last was AI -> Back to Normal
      nextBatchType = 'normal'
    } else {
      // Rule: Last was Normal
      if (currentSkipCount >= 5) {
        // Rule: Continuous skip 5 times -> Trigger AI
        nextBatchType = 'ai'
        setSkipCount(0) // Reset after triggering
      } else {
        // Else -> Normal (Refresh)
        nextBatchType = 'normal'
      }
    }

    setBatchType(nextBatchType)
    loadPrompts(theme, nextBatchType)
  }

  const handleSelectPrompt = () => {
    if (!userEmail) {
      router.push('/login')
      return
    }
    if (!prompts[currentIndex]) return
    setSelectedPrompt(prompts[currentIndex].text)
    setSkipCount(0) // Reset skip count on selection
    setView('answering')
    setContent("")
    setInsights([])
    setInspirationInsights([])
  }

  const handleFreeWrite = () => {
    if (!userEmail) {
      router.push('/login')
      return
    }
    setSelectedPrompt("自由书写")
    setSkipCount(0)
    setView('answering')
    setContent("")
    setInsights([])
    setInspirationInsights([])
  }

  const handleBack = () => {
    if (view === 'answering' && content.length > 0) {
      if (!confirm("确定要放弃当前的写作吗？")) return
    }
    setView('selection')
    setContent("")
    setInsights([])
    setInspirationInsights([])
  }

  const handleGetInspiration = async () => {
    if (!content.trim()) {
      toast.error("请先写一些内容再获取灵感...")
      return
    }

    setIsGettingInspiration(true)
    try {
      const insights = await getAllSageInsights(content, theme)
      setInspirationInsights(insights)
      toast.success("获得灵感洞察 ✨")
    } catch (error) {
      console.error("获取灵感失败:", error)
      toast.error("获取灵感失败，请稍后重试")
    } finally {
      setIsGettingInspiration(false)
    }
  }

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error("请写下你的想法...")
      return
    }

    setIsSubmitting(true)
    
    try {
      const sageInsights = await getAllSageInsights(content, theme) // Use current theme as category
      setInsights(sageInsights)
      
      await createEntryWithInsights(content, theme, selectedPrompt, sageInsights)
      
      toast.success("记录已保存", {
        description: "智者们正在回应你的思考...",
      })
      
      setView('insights')
      router.refresh()
    } catch (error) {
      toast.error("获取点评失败，请稍后重试")
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNextQuestion = () => {
    setView('selection')
    setContent("")
    setInsights([])
    setInspirationInsights([])
    setSelectedPrompt("")
    
    // Advance to next question
    if (currentIndex >= prompts.length - 1) {
      // End of batch. Since we completed one, we reset to normal flow
      setBatchType('normal')
      loadPrompts(theme, 'normal')
    } else {
      setCurrentIndex(prev => prev + 1)
    }
  }

  return (
    <div className="min-h-screen bg-[#FDFCF8] dark:bg-background text-gray-900 dark:text-foreground flex flex-col pb-20 transition-colors duration-300">
      {/* Header */}
      <header className="py-6 px-6 sticky top-0 bg-[#FDFCF8]/80 dark:bg-background/80 backdrop-blur-md z-10 border-b border-gray-100 dark:border-border transition-colors duration-300">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-serif font-bold text-[#5F7368] dark:text-primary transition-colors">今日觉察</h1>
              <p className="text-xs text-gray-500 dark:text-muted-foreground">
                {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="text-right">
              <span className="text-sm font-medium text-[#5F7368] dark:text-primary transition-colors">
                今日完成: {completedCount}/3
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={cn(
                  "h-2 flex-1 rounded-full transition-colors duration-300",
                  step <= completedCount 
                    ? "bg-[#5F7368] dark:bg-primary" 
                    : "bg-stone-200 dark:bg-secondary"
                )}
              />
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 md:py-6 flex flex-col items-center w-full overflow-hidden">
        <div className={cn(
          "w-full transition-all duration-500 h-full flex flex-col",
          view === 'selection' ? "max-w-2xl" : "max-w-7xl"
        )}>
          
          {view === 'selection' && (
            <div className="space-y-4 flex flex-col items-center">
              
              {/* Theme Toggle Ghost Button */}
              <div className="w-full flex justify-end px-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleThemeChange(theme === 'gratitude' ? 'philosophical' : 'gratitude')}
                  className="text-gray-400 hover:text-gray-600 dark:text-muted-foreground dark:hover:text-primary hover:bg-stone-100 dark:hover:bg-secondary/50 transition-all group"
                >
                   <Repeat className="w-3.5 h-3.5 mr-2 group-hover:rotate-180 transition-transform duration-500" />
                   {theme === 'gratitude' ? '切换为哲思' : '切换为感恩'}
                </Button>
              </div>

              {/* Main Card Carousel */}
              <div className="w-full relative h-[400px] perspective-1000">
                <AnimatePresence mode="wait">
                  {prompts.length > 0 && (
                    <motion.div
                      key={prompts[currentIndex]?.id || 'loading'}
                      initial={{ opacity: 0, x: 50, rotateY: -10 }}
                      animate={{ opacity: 1, x: 0, rotateY: 0 }}
                      exit={{ opacity: 0, x: -50, rotateY: 10 }}
                      transition={{ duration: 0.3 }}
                      className="w-full h-full"
                      onClick={handleSelectPrompt}
                    >
                      <Card className={cn(
                        "h-full flex flex-col justify-center items-center p-8 cursor-pointer hover:shadow-xl transition-shadow border-stone-200 dark:border-border bg-white dark:bg-card relative overflow-hidden group",
                        batchType === 'ai' && "border-indigo-100 dark:border-indigo-900 bg-indigo-50/30 dark:bg-indigo-900/30"
                      )}>
                        {/* Decorative Quote Icon */}
                        <div className="absolute top-6 left-6 text-6xl text-stone-100 dark:text-muted font-serif opacity-50 group-hover:text-stone-200 dark:group-hover:text-muted-foreground transition-colors">“</div>
                        
                        {/* AI Badge */}
                        {batchType === 'ai' && (
                          <div className="absolute top-4 right-4 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-200 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            <span>AI 灵感</span>
                          </div>
                        )}

                        <CardContent className="text-center z-10 max-w-lg pb-24">
                          {isLoading ? (
                            <div className="flex flex-col items-center gap-4">
                              <RefreshCw className="w-8 h-8 animate-spin text-[#5F7368] dark:text-primary" />
                              <p className="text-gray-400 dark:text-muted-foreground">正在寻找灵感...</p>
                            </div>
                          ) : (
                            <h3 className="text-2xl md:text-3xl font-serif font-medium text-gray-800 dark:text-foreground leading-relaxed transition-colors">
                              {prompts[currentIndex]?.text}
                            </h3>
                          )}
                        </CardContent>
                        
                        {/* Drama CTA Button */}
                        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 transition-all duration-500 group-hover:scale-110 group-hover:-translate-y-2">
                          <div className="relative">
                            {/* Main Button Circle */}
                            <div className="relative w-14 h-14 bg-[#5F7368] dark:bg-primary rounded-full flex items-center justify-center shadow-lg shadow-[#5F7368]/30 transition-transform duration-300 group-hover:rotate-12">
                              <PenLine className="w-6 h-6 text-white dark:text-stone-900" />
                            </div>
                          </div>
                          <span className="text-sm font-bold tracking-widest uppercase text-[#5F7368] dark:text-primary opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                            开始书写
                          </span>
                        </div>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center justify-between w-full px-8 max-w-lg">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handlePrev} 
                  disabled={currentIndex === 0 || isLoading}
                  className="rounded-full hover:bg-stone-100 dark:hover:bg-secondary transition-colors"
                >
                  <ChevronLeft className="w-6 h-6 text-gray-600 dark:text-muted-foreground transition-colors" />
                </Button>
                
                <span className="text-sm font-medium text-gray-400 dark:text-muted-foreground font-mono transition-colors">
                  {currentIndex + 1} / {prompts.length}
                </span>

                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleNext}
                  disabled={isLoading}
                  className="rounded-full hover:bg-stone-100 dark:hover:bg-secondary transition-colors"
                >
                  <ChevronRight className="w-6 h-6 text-gray-600 dark:text-muted-foreground transition-colors" />
                </Button>
              </div>

            </div>
          )}

          {(view === 'answering' || view === 'insights') && (
            <div className="flex-1 flex flex-col h-full animate-in fade-in zoom-in-95 duration-500">
              <div className="flex items-center gap-4 mb-4 shrink-0">
                {mode !== 'free' && (
                  <Button variant="ghost" onClick={handleBack} className="pl-0 hover:pl-2 transition-all text-gray-500 hover:text-gray-900 dark:text-muted-foreground dark:hover:text-foreground">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    返回选题
                  </Button>
                )}
                <h2 className="text-xl font-serif font-bold text-gray-800 dark:text-foreground line-clamp-1">
                  {selectedPrompt}
                </h2>
              </div>

              {view === 'answering' ? (
                <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden min-h-0 pb-4">
                  {/* Left Column: Editor */}
                  <Card className="flex-[2] flex flex-col overflow-hidden bg-white dark:bg-card border-stone-200 dark:border-border shadow-sm rounded-xl max-h-[70vh]">
                    <Textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="在此写下你的思考..."
                      className="flex-1 resize-none border-none focus-visible:ring-0 p-8 text-lg leading-relaxed bg-transparent"
                    />
                    <div className="p-4 border-t border-stone-100 dark:border-border bg-stone-50/50 dark:bg-secondary/20 flex justify-end">
                      <Button 
                        onClick={handleSubmit} 
                        disabled={isSubmitting || !content.trim()}
                        className="bg-[#5F7368] dark:bg-primary hover:bg-[#4E6056] dark:hover:bg-primary/90 text-white dark:text-primary-foreground px-8 rounded-full transition-all hover:scale-105 shadow-md shadow-[#5F7368]/20"
                      >
                        {isSubmitting ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            记录中...
                          </>
                        ) : (
                          <>
                            完成记录
                            <Send className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </Card>

                  {/* Right Column: AI Assistant */}
                  <div className="flex-1 lg:max-w-md flex flex-col bg-white/60 dark:bg-card/40 backdrop-blur-md border border-stone-200 dark:border-border rounded-xl overflow-hidden shadow-sm max-h-[70vh]">
                    <div className="p-4 border-b border-stone-100 dark:border-border bg-white/80 dark:bg-card/80 flex items-center justify-between min-h-[60px]">
                      <div className="flex items-center gap-2 text-[#5F7368] dark:text-primary">
                        <Sparkles className="w-5 h-5" />
                        <h3 className="font-semibold">AI 智者洞察</h3>
                      </div>
                      {inspirationInsights.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleGetInspiration}
                          disabled={isGettingInspiration}
                          className="text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/50 h-8 px-3"
                        >
                          {isGettingInspiration ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <RefreshCw className="w-4 h-4 mr-1.5" />
                              再次请教
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                      {inspirationInsights.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 dark:text-muted-foreground p-8 space-y-4">
                          <div className="w-16 h-16 rounded-full bg-stone-100 dark:bg-secondary flex items-center justify-center mb-2">
                            <Sparkles className="w-8 h-8 opacity-50" />
                          </div>
                          <p className="text-sm leading-relaxed">
                            当你感到卡顿时，<br/>
                            点击下方按钮，<br/>
                            智者将为你提供灵感指引。
                          </p>
                        </div>
                      ) : (
                        inspirationInsights.map((insight, idx) => (
                          <div key={idx} className="animate-in slide-in-from-right-4 fade-in duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                            <Card className="bg-white dark:bg-card border-orange-100 dark:border-orange-900/50 shadow-sm overflow-hidden group hover:shadow-md transition-all">
                              <CardHeader className="pb-2 px-4 pt-4 bg-gradient-to-r from-orange-50/50 to-transparent dark:from-orange-950/20">
                                <div className="flex items-center gap-2">
                                  {getSageAvatar(insight.sage) ? (
                                    <div className="relative w-6 h-6 rounded-full overflow-hidden ring-1 ring-orange-200 dark:ring-orange-800">
                                      <Image
                                        src={getSageAvatar(insight.sage)}
                                        alt={insight.sage}
                                        fill
                                        sizes="24px"
                                        className="object-cover"
                                      />
                                    </div>
                                  ) : (
                                    <span className="text-lg">{insight.emoji}</span>
                                  )}
                                  <CardTitle className="text-sm font-bold text-orange-800 dark:text-orange-200">
                                    {insight.sage}
                                  </CardTitle>
                                </div>
                              </CardHeader>
                              <CardContent className="px-4 pb-4 pt-2">
                                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                  {insight.insight}
                                </p>
                              </CardContent>
                            </Card>
                          </div>
                        ))
                      )}
                    </div>

                    {inspirationInsights.length === 0 && (
                      <div className="p-4 border-t border-stone-100 dark:border-border bg-white/80 dark:bg-card/80">
                        <Button 
                          onClick={handleGetInspiration}
                          disabled={isGettingInspiration || !content.trim()}
                          variant="outline"
                          className="w-full border-orange-200 dark:border-orange-900 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950 hover:text-orange-700 dark:hover:text-orange-300 transition-colors h-11"
                        >
                          {isGettingInspiration ? (
                            <>
                              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                              正在连接智者...
                            </>
                          ) : (
                            <>
                              <Sparkles className="mr-2 h-4 w-4" />
                              获取灵感洞察
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="max-w-2xl mx-auto w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
                   <div className="bg-white dark:bg-card p-8 rounded-xl border border-stone-100 dark:border-border shadow-sm transition-colors mb-8">
                      <h3 className="text-sm font-medium text-gray-400 dark:text-muted-foreground mb-4 uppercase tracking-wider">你的思考</h3>
                      <p className="text-lg text-gray-800 dark:text-foreground leading-relaxed whitespace-pre-wrap font-serif">{content}</p>
                   </div>
                   
                   <div className="space-y-6">
                     <div className="flex items-center justify-center gap-2 text-[#5F7368] dark:text-primary transition-colors mb-4">
                       <Sparkles className="w-5 h-5" />
                       <h3 className="font-semibold text-lg">智者回应</h3>
                     </div>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {insights.map((insight, idx) => (
                         <Card key={idx} className="bg-[#FDFCF8] dark:bg-card border-stone-200 dark:border-border hover:shadow-md transition-all group">
                           <CardHeader className="pb-2">
                             <div className="flex items-center gap-2">
                               {getSageAvatar(insight.sage) ? (
                                 <div className="relative w-8 h-8 rounded-full overflow-hidden border border-stone-200 dark:border-border group-hover:scale-110 transition-transform">
                                   <Image
                                     src={getSageAvatar(insight.sage)}
                                     alt={insight.sage}
                                     fill
                                     sizes="32px"
                                     className="object-cover"
                                   />
                                 </div>
                               ) : (
                                 <span className="text-2xl">{insight.emoji}</span>
                               )}
                               <CardTitle className="text-base font-bold text-gray-800 dark:text-foreground transition-colors">{insight.sage}</CardTitle>
                             </div>
                           </CardHeader>
                           <CardContent>
                             <p className="text-sm text-gray-600 dark:text-muted-foreground leading-relaxed transition-colors">
                               {insight.insight}
                             </p>
                           </CardContent>
                         </Card>
                       ))}
                     </div>

                     <div className="flex justify-center pt-8">
                       <Button onClick={handleNextQuestion} variant="outline" className="border-[#5F7368] dark:border-primary text-[#5F7368] dark:text-primary hover:bg-[#E8F3E8] dark:hover:bg-primary/20 transition-colors px-8 py-6 rounded-full text-lg">
                         <CheckCircle2 className="mr-2 h-5 w-5" />
                         完成并开始下一题
                       </Button>
                     </div>
                   </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
