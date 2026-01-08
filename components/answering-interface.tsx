'use client'

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { RefreshCw, Send, Sparkles, ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, PenLine } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"

import { getSageInsight, getAllSageInsights, SageInsightResponse } from "@/app/actions/ai"
import { SAGES } from "@/lib/ai/prompts"
import { getDynamicPrompts } from "@/app/actions/prompts"
import { createEntryWithInsights } from "@/app/actions/entry"
import { STATIC_PROMPTS } from "@/lib/data/static-prompts"

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
  const [inspirationInsight, setInspirationInsight] = useState<SageInsightResponse | null>(null)
  const [isGettingInspiration, setIsGettingInspiration] = useState(false)
  const [currentSageIndex, setCurrentSageIndex] = useState(0)

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
  }

  const handleBack = () => {
    if (view === 'answering' && content.length > 0) {
      if (!confirm("确定要放弃当前的写作吗？")) return
    }
    setView('selection')
    setContent("")
    setInsights([])
    setInspirationInsight(null)
  }

  const handleGetInspiration = async () => {
    if (!content.trim()) {
      toast.error("请先写一些内容再获取灵感...")
      return
    }

    setIsGettingInspiration(true)
    try {
      const sageKeys = ["confucius", "laozi", "buddha", "plato"] as const
      const selectedSage = sageKeys[currentSageIndex]
      
      const insight = await getSageInsight(content, selectedSage, theme)
      setInspirationInsight(insight)
      toast.success("获得灵感洞察 ✨")
    } catch (error) {
      console.error("获取灵感失败:", error)
      toast.error("获取灵感失败，请稍后重试")
    } finally {
      setIsGettingInspiration(false)
    }
  }

  const handleSwitchSage = () => {
    const sageKeys = ["confucius", "laozi", "buddha", "plato"] as const
    const nextIndex = (currentSageIndex + 1) % sageKeys.length
    setCurrentSageIndex(nextIndex)
    
    // 清空当前灵感，鼓励用户重新获取
    setInspirationInsight(null)
    toast.info(`已切换至${SAGES[sageKeys[nextIndex]].name}`)
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
    <div className="min-h-screen bg-[#FDFCF8] text-gray-900 flex flex-col pb-20">
      {/* Header */}
      <header className="py-6 px-6 sticky top-0 bg-[#FDFCF8]/80 backdrop-blur-md z-10 border-b border-gray-100">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-serif font-bold text-[#5F7368]">今日觉察</h1>
              <p className="text-xs text-gray-500">
                {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="text-right">
              <span className="text-sm font-medium text-[#5F7368]">
                今日完成: {completedCount}/3
              </span>
            </div>
          </div>
          <Progress value={Math.min((completedCount / 3) * 100, 100)} className="h-2" />
        </div>
      </header>

      <main className="flex-1 px-4 py-8 flex flex-col items-center w-full">
        <div className="w-full max-w-2xl">
          
          {view === 'selection' && (
            <div className="space-y-8 flex flex-col items-center">
              
              {/* Theme Toggle Capsule */}
              <div className="bg-stone-100 p-1 rounded-full flex relative w-48 shadow-inner">
                <motion.div 
                  className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-full shadow-sm z-0"
                  animate={{ left: theme === 'gratitude' ? '4px' : 'calc(50%)' }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
                <button 
                  onClick={() => handleThemeChange('gratitude')}
                  className={cn(
                    "flex-1 relative z-10 text-sm font-medium py-2 rounded-full transition-colors",
                    theme === 'gratitude' ? "text-[#5F7368]" : "text-gray-500"
                  )}
                >
                  感恩
                </button>
                <button 
                  onClick={() => handleThemeChange('philosophical')}
                  className={cn(
                    "flex-1 relative z-10 text-sm font-medium py-2 rounded-full transition-colors",
                    theme === 'philosophical' ? "text-[#5F7368]" : "text-gray-500"
                  )}
                >
                  哲思
                </button>
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
                        "h-full flex flex-col justify-center items-center p-8 cursor-pointer hover:shadow-xl transition-shadow border-stone-200 bg-white relative overflow-hidden group",
                        batchType === 'ai' && "border-indigo-100 bg-indigo-50/30"
                      )}>
                        {/* Decorative Quote Icon */}
                        <div className="absolute top-6 left-6 text-6xl text-stone-100 font-serif opacity-50 group-hover:text-stone-200 transition-colors">“</div>
                        
                        {/* AI Badge */}
                        {batchType === 'ai' && (
                          <div className="absolute top-4 right-4 bg-indigo-100 text-indigo-600 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            <span>AI 灵感</span>
                          </div>
                        )}

                        <CardContent className="text-center z-10 max-w-lg">
                          {isLoading ? (
                            <div className="flex flex-col items-center gap-4">
                              <RefreshCw className="w-8 h-8 animate-spin text-[#5F7368]" />
                              <p className="text-gray-400">正在寻找灵感...</p>
                            </div>
                          ) : (
                            <h3 className="text-2xl md:text-3xl font-serif font-medium text-gray-800 leading-relaxed">
                              {prompts[currentIndex]?.text}
                            </h3>
                          )}
                        </CardContent>
                        
                        <div className="absolute bottom-8 text-sm text-gray-400 font-medium">
                          点击卡片开始书写
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
                  className="rounded-full hover:bg-stone-100"
                >
                  <ChevronLeft className="w-6 h-6 text-gray-600" />
                </Button>
                
                <span className="text-sm font-medium text-gray-400 font-mono">
                  {currentIndex + 1} / {prompts.length}
                </span>

                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleNext}
                  disabled={isLoading}
                  className="rounded-full hover:bg-stone-100"
                >
                  <ChevronRight className="w-6 h-6 text-gray-600" />
                </Button>
              </div>

            </div>
          )}

          {(view === 'answering' || view === 'insights') && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {mode !== 'free' && (
                <Button variant="ghost" onClick={handleBack} className="mb-4 pl-0 hover:pl-2 transition-all">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  返回选题
                </Button>
              )}

              <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="px-0">
                  <h2 className="text-2xl font-serif font-bold text-gray-800 leading-relaxed">
                    {selectedPrompt}
                  </h2>
                </CardHeader>
                <CardContent className="px-0 space-y-4">
                  {view === 'answering' ? (
                    <>
                      <Textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="在此写下你的思考..."
                        className="min-h-[300px] p-6 text-lg leading-relaxed resize-none border-stone-200 focus:border-[#5F7368] focus:ring-[#5F7368] bg-white shadow-sm rounded-xl"
                      />
                      {inspirationInsight && (
                        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-100 shadow-sm">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-2xl">{inspirationInsight.emoji}</span>
                                <CardTitle className="text-base font-bold text-orange-800">
                                  {inspirationInsight.sage} · 灵感洞察
                                </CardTitle>
                              </div>
                              <Button
                                onClick={handleSwitchSage}
                                variant="ghost"
                                size="sm"
                                className="text-orange-600 hover:text-orange-700 hover:bg-orange-100 px-2 h-7"
                                title="切换智者"
                              >
                                <RefreshCw className="w-3 h-3" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-orange-700 leading-relaxed">
                              {inspirationInsight.insight}
                            </p>
                          </CardContent>
                        </Card>
                      )}

                      <div className="space-y-3">
                        {/* 智者指示器 */}
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center gap-2">
                            <span className="text-orange-500">{SAGES[Object.keys(SAGES)[currentSageIndex] as keyof typeof SAGES].emoji}</span>
                            <span>当前智者: {SAGES[Object.keys(SAGES)[currentSageIndex] as keyof typeof SAGES].name}</span>
                          </div>
                          <Button
                            onClick={handleSwitchSage}
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-orange-600 hover:bg-orange-50 px-2 h-6 text-xs"
                          >
                            <RefreshCw className="w-3 h-3 mr-1" />
                            切换
                          </Button>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <Button 
                            onClick={handleGetInspiration}
                            disabled={isGettingInspiration || !content.trim()}
                            variant="outline"
                            className="border-orange-200 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
                          >
                            {isGettingInspiration ? (
                              <>
                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                获取中...
                              </>
                            ) : (
                              <>
                                <Sparkles className="mr-2 h-4 w-4" />
                                灵感洞察
                              </>
                            )}
                          </Button>
                          
                          <Button 
                            onClick={handleSubmit} 
                            disabled={isSubmitting || !content.trim()}
                            className="bg-[#5F7368] hover:bg-[#4E6056] text-white px-8 py-6 text-lg rounded-full transition-all hover:scale-105"
                          >
                            {isSubmitting ? (
                              <>
                                <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                                记录中...
                              </>
                            ) : (
                              <>
                                完成记录
                                <Send className="ml-2 h-5 w-5" />
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                  </>
                ) : (
                    <div className="space-y-8">
                      <div className="bg-white p-6 rounded-xl border border-stone-100 shadow-sm">
                        <p className="text-lg text-gray-700 leading-relaxed whitespace-pre-wrap">{content}</p>
                      </div>
                      
                      <div className="space-y-6">
                        <div className="flex items-center gap-2 text-[#5F7368]">
                          <Sparkles className="w-5 h-5" />
                          <h3 className="font-semibold text-lg">智者启示</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {insights.map((insight, idx) => (
                            <Card key={idx} className="bg-[#FDFCF8] border-stone-200 hover:shadow-md transition-all">
                              <CardHeader className="pb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-2xl">{insight.emoji}</span>
                                  <CardTitle className="text-base font-bold text-gray-800">{insight.sage}</CardTitle>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                  {insight.insight}
                                </p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>

                        <div className="flex justify-center pt-8">
                          <Button onClick={handleNextQuestion} variant="outline" className="border-[#5F7368] text-[#5F7368] hover:bg-[#E8F3E8]">
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            完成并开始下一题
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
