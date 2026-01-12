'use client'

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { RefreshCw, Send, Sparkles, ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, PenLine, Repeat, Lightbulb, Heart } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"

import { getSageInsight, getAllSageInsights, generateTitleFromContent, SageInsightResponse } from "@/app/actions/ai"
import { SAGES } from "@/lib/ai/prompts"
import { getDynamicPrompts } from "@/app/actions/prompts"
import { createEntryWithInsights } from "@/app/actions/entry"
import { STATIC_PROMPTS } from "@/lib/data/static-prompts"

// 智者头像映射函数
const getSageAvatar = (sageName: string): string => {
  const sageKeyMap: Record<string, string> = {
    '爱的使者': 'confucius', // Mapping new name to existing avatar file (or we can use emoji if file doesn't match)
    '孔子': 'confucius', // Backward compatibility
    '老子': 'laozi', 
    '释迦牟尼': 'buddha',
    '马可·奥勒留': 'plato', // Temporarily use Plato's avatar until we add Marcus
    '柏拉图': 'plato' // Keep for backward compatibility
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

export function AnsweringInterface({ userEmail, completedCount = 0, initialPrompts = [] }: AnsweringInterfaceProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  
  // UI State
  const [view, setView] = useState<ViewState>('selection')
  
  // Logic State
  const [theme, setTheme] = useState<Theme>('gratitude')
  const [batchType, setBatchType] = useState<BatchType>('normal')
  const [direction, setDirection] = useState(0) // 1: next, -1: prev

  
  // Initialize prompts with initialPrompts if available to prevent empty state
  const [prompts, setPrompts] = useState<{id: string, text: string, type: string}[]>(() => {
    if (initialPrompts && initialPrompts.length > 0) {
      return initialPrompts.map((p, i) => ({
        id: p.id?.toString() || `init-${i}`,
        text: p.text,
        type: 'initial'
      }))
    }
    return []
  })
  
  const [currentIndex, setCurrentIndex] = useState(0)
  const [skipCount, setSkipCount] = useState(0)
  const [localCompletedCount, setLocalCompletedCount] = useState(completedCount)

  // Sync local count with prop
  useEffect(() => {
    setLocalCompletedCount(completedCount)
  }, [completedCount])
  
  // Loading State
  const [isLoading, setIsLoading] = useState(false)

  // Answering State
  const [selectedPrompt, setSelectedPrompt] = useState<string>("")
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [insights, setInsights] = useState<SageInsightResponse[]>([])
  const [inspirationInsights, setInspirationInsights] = useState<SageInsightResponse[]>([])
  const [isGettingInspiration, setIsGettingInspiration] = useState(false)
  const [favoritedInsights, setFavoritedInsights] = useState<Set<number>>(new Set())
  const [favoritedInspirationInsights, setFavoritedInspirationInsights] = useState<Set<number>>(new Set())
  const [showInspirationPanel, setShowInspirationPanel] = useState(true)
  const [customTitle, setCustomTitle] = useState("")


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
    // Only load if we don't have prompts (e.g. no initialPrompts passed)
    if (prompts.length === 0) {
      loadPrompts(theme, 'normal')
    }
  }, []) // Run once on mount

  // Watch for URL mode changes (Initial Load & Updates)
  useEffect(() => {
    const modeParam = searchParams.get('mode')
    if (modeParam === 'free') {
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
        setShowInspirationPanel(true)
        setCustomTitle("")
    } else {
        // If not free mode (e.g. back button or direct load), ensure we are in selection or respect view state
        // But we shouldn't force reset view if user is in the middle of something unless it's a fresh navigation
    }
  }, [searchParams, userEmail, router])

  // Custom Event Listener for instant transition
  useEffect(() => {
    const handleFreeWriteEvent = () => {
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
       setShowInspirationPanel(true)
       setCustomTitle("")
       // Update URL without navigation
       window.history.pushState({}, '', '/?mode=free')
    }

    window.addEventListener('trigger-free-write', handleFreeWriteEvent)
    return () => window.removeEventListener('trigger-free-write', handleFreeWriteEvent)
  }, [userEmail, router])


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
    setDirection(1)
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
      setDirection(-1)
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
    setFavoritedInsights(new Set())
    setFavoritedInspirationInsights(new Set())
    setShowInspirationPanel(true)
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
    setFavoritedInsights(new Set())
    setFavoritedInspirationInsights(new Set())
    setShowInspirationPanel(true)
  }

  const handleBack = () => {
    if (view === 'answering' && content.length > 0) {
      if (!confirm("确定要放弃当前的写作吗？")) return
    }
    setView('selection')
    setContent("")
    setInsights([])
    setInspirationInsights([])
    setFavoritedInsights(new Set())
    setFavoritedInspirationInsights(new Set())
    setShowInspirationPanel(true)
    
    // Clear mode from URL if present
    if (searchParams.get('mode') === 'free') {
        router.replace('/', { scroll: false })
    }
  }

  const handleGetInspiration = async () => {
    if (!content.trim()) {
      toast.error("请先写一些内容再获得启示...")
      return
    }

    setIsGettingInspiration(true)
    setShowInspirationPanel(true)
    try {
      const insights = await getAllSageInsights(content, theme, 'inspiration')
      setInspirationInsights(insights)
      toast.success("获得智者启示 ✨")
    } catch (error) {
      console.error("获取启示失败:", error)
      toast.error("获取启示失败，请稍后重试")
    } finally {
      setIsGettingInspiration(false)
    }
  }

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error("请写下你的想法...")
      return
    }

    if (isSubmitting) return

    setIsSubmitting(true)
    
    // Clear free mode param immediately to prevent view reset/content wipe during revalidation
    // This ensures we stay on the insights view instead of being forced back to answering mode
    if (searchParams.get('mode') === 'free') {
      router.replace('/', { scroll: false })
    }
    
    try {
      const sageInsights = await getAllSageInsights(content, theme, 'summary') // Use current theme as category
      setInsights(sageInsights)
      
      let promptToSave = selectedPrompt
      
      if (selectedPrompt === "自由书写") {
        if (customTitle.trim()) {
          promptToSave = customTitle.trim()
        } else {
          // Auto-generate title if empty
          try {
             promptToSave = await generateTitleFromContent(content)
             setCustomTitle(promptToSave) // Show it to user
          } catch (e) {
             console.error("Auto title failed", e)
             promptToSave = "自由书写"
          }
        }
      }

      await createEntryWithInsights(content, theme, promptToSave, sageInsights)
      
      toast.success("记录已保存", {
        description: "智者们正在回应你的思考...",
      })
      
      setLocalCompletedCount(prev => prev + 1)
      setView('insights')
      // router.refresh() removed to prevent view reset
    } catch (error) {
      toast.error("获取点评失败，请稍后重试")
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNextQuestion = () => {
    router.refresh()
    setView('selection')
    setContent("")
    setInsights([])
    setInspirationInsights([])
    setSelectedPrompt("")
    setFavoritedInsights(new Set())
    setShowInspirationPanel(true)
    
    // Advance to next question
    if (currentIndex >= prompts.length - 1) {
      // End of batch. Since we completed one, we reset to normal flow
      setBatchType('normal')
      loadPrompts(theme, 'normal')
    } else {
      setCurrentIndex(prev => prev + 1)
    }
  }

  const toggleFavorite = (idx: number) => {
    setFavoritedInsights(prev => {
      const next = new Set(prev)
      if (next.has(idx)) {
        next.delete(idx)
      } else {
        next.add(idx)
        toast.success("已收藏该洞察 ❤️")
      }
      return next
    })
  }

  const toggleInspirationFavorite = (idx: number) => {
    setFavoritedInspirationInsights(prev => {
      const next = new Set(prev)
      if (next.has(idx)) {
        next.delete(idx)
      } else {
        next.add(idx)
        toast.success("已收藏灵感 ❤️")
      }
      return next
    })
  }

  // Drag & Swipe Logic
  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  const variants = {
    enter: (direction: number) => {
      return {
        x: direction > 0 ? 300 : -300,
        opacity: 0,
        scale: 0.9,
        rotateY: direction > 0 ? 10 : -10,
        zIndex: 0
      };
    },
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
      rotateY: 0,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
        scale: { duration: 0.2 }
      }
    } as any,
    exit: (direction: number) => {
      return {
        zIndex: 0,
        x: direction < 0 ? 300 : -300,
        opacity: 0,
        scale: 0.9,
        rotateY: direction < 0 ? -10 : 10,
        transition: {
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 },
            scale: { duration: 0.2 }
        }
      };
    }
  } as any;

  // Wheel Debounce Logic
  const [lastWheelTime, setLastWheelTime] = useState(0)

  const onWheel = (e: React.WheelEvent) => {
    // Only handle horizontal scroll
    if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) return
    if (Math.abs(e.deltaX) < 30) return // Threshold

    const now = Date.now()
    if (now - lastWheelTime < 500) return // 500ms debounce
    
    if (e.deltaX > 0) {
      // Swipe Left -> Next
      handleNext()
      setLastWheelTime(now)
    } else {
      // Swipe Right -> Prev
      handlePrev()
      setLastWheelTime(now)
    }
  }

  return (
    <div className="h-[calc(100vh-5rem)] bg-[#FDFCF8] dark:bg-background text-gray-900 dark:text-foreground flex flex-col transition-colors duration-300">
      {/* Header */}
      <header className="py-6 px-6 sticky top-0 bg-[#FDFCF8]/80 dark:bg-background/80 backdrop-blur-md z-10 border-b border-gray-100 dark:border-border transition-colors duration-300">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-serif font-bold text-[#5C7A63] dark:text-primary transition-colors">今日觉察</h1>
              <p className="text-xs text-gray-500 dark:text-muted-foreground">
                {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="text-right">
              <span className="text-sm font-medium text-[#5C7A63] dark:text-primary transition-colors">
                {localCompletedCount >= 3 ? "今日完成" : `今日完成: ${localCompletedCount}/3`}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={cn(
                  "h-2 flex-1 rounded-full transition-colors duration-300",
                  step <= localCompletedCount 
                    ? "bg-[#5C7A63] dark:bg-primary" 
                    : "bg-stone-200 dark:bg-secondary"
                )}
              />
            ))}
          </div>
        </div>
      </header>

      <main className={cn(
        "flex-1 px-4 py-4 md:py-6 flex flex-col items-center w-full",
        view === 'insights' ? "overflow-y-auto" : "overflow-hidden"
      )}>
        <div className={cn(
          "w-full transition-all duration-500 flex flex-col",
          view === 'insights' ? "min-h-full" : "h-full",
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
              <div 
                className="w-full relative h-[400px] perspective-1000"
                onWheel={onWheel}
              >
                <AnimatePresence initial={false} custom={direction}>
                  {prompts.length > 0 && (
                    <motion.div
                      key={prompts[currentIndex]?.id || 'loading'}
                      custom={direction}
                      variants={variants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{
                        x: { type: "spring", stiffness: 300, damping: 30 },
                        opacity: { duration: 0.2 }
                      }}
                      drag="x"
                      dragConstraints={{ left: 0, right: 0 }}
                      dragElastic={1}
                      onDragEnd={(e, { offset, velocity }) => {
                        const swipe = swipePower(offset.x, velocity.x);

                        if (swipe < -swipeConfidenceThreshold) {
                          handleNext();
                        } else if (swipe > swipeConfidenceThreshold) {
                          handlePrev();
                        }
                      }}
                      className="w-full h-full absolute top-0 left-0"
                      // onClick removed to prevent conflict with drag
                    >
                      <Card className={cn(
                        "h-full flex flex-col justify-center items-center p-8 transition-shadow border-stone-200 dark:border-border bg-white dark:bg-card relative group",
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
                              <RefreshCw className="w-8 h-8 animate-spin text-[#5C7A63] dark:text-primary" />
                              <p className="text-gray-400 dark:text-muted-foreground">正在寻找灵感...</p>
                            </div>
                          ) : (
                            <h3 className="text-2xl md:text-3xl font-serif font-medium text-gray-800 dark:text-foreground leading-relaxed transition-colors">
                              {prompts[currentIndex]?.text}
                            </h3>
                          )}
                        </CardContent>
                        
                        {/* Drama CTA Button */}
                        <div 
                          className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 transition-all duration-500 group-hover:scale-110 group-hover:-translate-y-2 cursor-pointer z-20"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectPrompt();
                          }}
                        >
                          <div className="relative">
                            {/* Pulse Glow Effect */}
                            <div className="absolute inset-0 rounded-full bg-[#5C7A63] dark:bg-primary opacity-0 group-hover:animate-ping duration-1000" />
                            <div className="absolute inset-0 rounded-full bg-[#5C7A63]/20 dark:bg-primary/20 scale-0 group-hover:scale-[1.6] transition-transform duration-500 ease-out" />
                            
                            {/* Main Button Circle */}
                            <div className="relative w-14 h-14 bg-[#5C7A63] dark:bg-primary rounded-full flex items-center justify-center shadow-lg shadow-[#5C7A63]/30 transition-all duration-300 group-hover:rotate-12 group-hover:shadow-[#5C7A63]/50 group-hover:shadow-xl">
                              <PenLine className="w-6 h-6 text-white dark:text-stone-900 transition-transform duration-300 group-hover:scale-110" />
                            </div>
                          </div>
                          <span className="text-sm font-bold tracking-widest uppercase text-[#5C7A63] dark:text-primary opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
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

              {/* Bottom Input Teaser (Removed) */}

            </div>
          )}

          {(view === 'answering' || view === 'insights') && (
            <div className={cn(
              "flex-1 flex flex-col animate-in fade-in zoom-in-95 duration-500",
              view === 'insights' ? "min-h-full" : "h-full"
            )}>
              <div className="flex items-center gap-4 mb-4 shrink-0">
                <Button variant="ghost" onClick={handleBack} className="pl-0 hover:pl-2 transition-all text-gray-500 hover:text-gray-900 dark:text-muted-foreground dark:hover:text-foreground">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {searchParams.get('mode') === 'free' ? '返回首页' : '返回选题'}
                </Button>
                <h2 className="text-xl font-serif font-bold text-gray-800 dark:text-foreground line-clamp-1">
                  {selectedPrompt}
                </h2>
              </div>

              {view === 'answering' ? (
                <div className={cn(
                  "flex-1 flex flex-col gap-6 overflow-hidden min-h-0 pb-4 transition-all duration-500",
                  showInspirationPanel ? "lg:flex-row" : "items-center"
                )}>
                  {/* Left Column: Editor */}
                  <Card className={cn(
                    "flex flex-col overflow-hidden bg-white dark:bg-card border-stone-200 dark:border-border shadow-sm rounded-xl transition-all duration-500",
                    showInspirationPanel ? "flex-[2] h-full" : "w-full max-w-5xl flex-1 max-h-[calc(100vh-14rem)] min-h-[500px]"
                  )}>
                    {selectedPrompt === "自由书写" && (
                      <input
                        type="text"
                        value={customTitle}
                        onChange={(e) => setCustomTitle(e.target.value)}
                        placeholder="请输入标题 (留空将自动生成)..."
                        className="w-full px-8 pt-6 pb-1 text-lg bg-transparent border-none focus:outline-none focus:ring-0 placeholder:text-gray-300 dark:placeholder:text-muted-foreground/30 text-gray-700 dark:text-foreground/80"
                      />
                    )}
                    <Textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="在此写下你的思考..."
                      className={cn(
                        "flex-1 resize-none border-none focus-visible:ring-0 text-lg leading-relaxed bg-transparent",
                        selectedPrompt === "自由书写" ? "px-8 pb-8 pt-2" : "p-8"
                      )}
                    />
                    <div className="p-4 border-t border-stone-100 dark:border-border bg-stone-50/50 dark:bg-secondary/20 flex justify-between items-center">
                      <Button
                        onClick={handleGetInspiration}
                        disabled={isGettingInspiration || !content.trim()}
                        className="bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:hover:bg-orange-900/50 transition-colors border border-orange-200 dark:border-orange-800 h-11"
                      >
                        {isGettingInspiration ? (
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Lightbulb className="mr-2 h-4 w-4" />
                        )}
                        获得启示
                      </Button>

                      <Button 
                        onClick={handleSubmit} 
                        disabled={isSubmitting || !content.trim()}
                        className="bg-[#5C7A63] dark:bg-primary hover:bg-[#4A6350] dark:hover:bg-primary/90 text-white dark:text-primary-foreground px-8 rounded-full transition-all hover:scale-105 shadow-md shadow-[#5C7A63]/20 h-11"
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
                  {showInspirationPanel && (
                    <div className="flex-1 lg:max-w-md flex flex-col bg-white/60 dark:bg-card/40 backdrop-blur-md border border-stone-200 dark:border-border rounded-xl overflow-hidden shadow-sm h-full animate-in slide-in-from-right-10 fade-in duration-500">
                    <div className="p-4 border-b border-stone-100 dark:border-border bg-white/80 dark:bg-card/80 flex items-center justify-between min-h-[60px]">
                      <div className="flex items-center gap-2 text-[#5C7A63] dark:text-primary">
                        <Sparkles className="w-5 h-5" />
                        <h3 className="font-semibold">智者启示</h3>
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
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
                      {isGettingInspiration ? (
                        <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 dark:text-muted-foreground p-8 space-y-4 animate-pulse">
                          <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center mb-2">
                            <Sparkles className="w-8 h-8 text-orange-500 animate-pulse" />
                          </div>
                          <p className="text-sm leading-relaxed text-orange-600 dark:text-orange-400 font-medium">
                            智者正在阅读你的内容...
                          </p>
                        </div>
                      ) : inspirationInsights.length === 0 ? (
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
                        <div className="p-4 flex-1 space-y-6">
                            {inspirationInsights.map((insight, idx) => (
                              <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2, delay: idx * 0.1 }}
                              >
                                <Card className="bg-white dark:bg-card border-none shadow-none group">
                                  <CardHeader className="pb-2 px-0 pt-0 flex flex-row items-center gap-3">
                                      {getSageAvatar(insight.sage) ? (
                                        <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-stone-100 dark:ring-border shadow-sm">
                                          <Image
                                            src={getSageAvatar(insight.sage)}
                                            alt={insight.sage}
                                            fill
                                            sizes="40px"
                                            className="object-cover"
                                          />
                                        </div>
                                      ) : (
                                        <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-secondary flex items-center justify-center text-xl shadow-sm">
                                          {insight.emoji}
                                        </div>
                                      )}
                                      <div className="flex-1">
                                        <CardTitle className="text-base font-bold text-gray-800 dark:text-foreground">
                                          {insight.sage}
                                        </CardTitle>
                                        <p className="text-xs text-gray-500 dark:text-muted-foreground mt-0.5">
                                            {insight.sage === "马可·奥勒留" ? "斯多葛哲人" : 
                                            insight.sage === "老子" ? "自然辩证" :
                                            insight.sage === "释迦牟尼" ? "正念觉察" : "爱的使者"}
                                        </p>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className={cn(
                                          "h-8 w-8 -mt-1 transition-opacity",
                                          favoritedInspirationInsights.has(idx) 
                                            ? "opacity-100 text-red-500 hover:bg-red-50" 
                                            : "text-stone-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100"
                                        )}
                                        onClick={() => toggleInspirationFavorite(idx)}
                                      >
                                        <Heart className={cn("w-5 h-5 transition-all", favoritedInspirationInsights.has(idx) ? "fill-red-500 text-red-500 scale-110" : "scale-100")} />
                                      </Button>
                                  </CardHeader>
                                  <CardContent className="px-0 pb-4 pt-2">
                                    <div className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap font-sans">
                                      {insight.insight}
                                    </div>
                                  </CardContent>
                                </Card>
                              </motion.div>
                            ))}
                        </div>

                      )}
                    </div>

                    {inspirationInsights.length === 0 && (
                      <div className="p-4 border-t border-stone-100 dark:border-border bg-white/80 dark:bg-card/80">
                        <Button 
                          onClick={handleGetInspiration}
                          disabled={isGettingInspiration || !content.trim()}
                          className="w-full bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-200 dark:shadow-none dark:bg-orange-700 dark:hover:bg-orange-600 transition-all hover:scale-[1.02] h-11"
                        >
                          {isGettingInspiration ? (
                            <>
                              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                              正在连接智者...
                            </>
                          ) : (
                            <>
                              <Sparkles className="mr-2 h-4 w-4" />
                              获取启示
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                  )}
                </div>
              ) : (
                <div className="max-w-2xl mx-auto w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
                   <div className="bg-white dark:bg-card p-8 rounded-xl border border-stone-100 dark:border-border shadow-sm transition-colors mb-8">
                      <h3 className="text-sm font-medium text-gray-400 dark:text-muted-foreground mb-4 uppercase tracking-wider">你的思考</h3>
                      <p className="text-lg text-gray-800 dark:text-foreground leading-relaxed whitespace-pre-wrap font-serif">{content}</p>
                   </div>
                   
                   <div className="space-y-6">
                     <div className="flex items-center justify-center gap-2 text-[#D8B064] dark:text-primary transition-colors mb-4">
                       <Sparkles className="w-5 h-5" />
                       <h3 className="font-semibold text-lg">智者回应</h3>
                     </div>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {insights.map((insight, idx) => (
                         <Card key={idx} className="bg-[#FDFCF8] dark:bg-card border-stone-200 dark:border-border hover:shadow-md transition-all group relative">
                           <CardHeader className="pb-2 flex flex-row items-start justify-between">
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
                             <Button
                               variant="ghost"
                               size="icon"
                               className="h-8 w-8 text-stone-400 hover:text-red-500 hover:bg-red-50 -mr-2 -mt-2"
                               onClick={() => toggleFavorite(idx)}
                             >
                               <Heart className={cn("w-5 h-5 transition-all", favoritedInsights.has(idx) ? "fill-red-500 text-red-500 scale-110" : "scale-100")} />
                             </Button>
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
                       <Button onClick={handleNextQuestion} variant="outline" className="border-[#5C7A63] dark:border-primary text-[#5C7A63] dark:text-primary hover:bg-[#F0F5F2] dark:hover:bg-primary/20 transition-colors px-8 py-6 rounded-full text-lg">
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
