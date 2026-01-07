import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { ThemeSelector } from "@/components/ThemeSelector";
import { QuestionCard } from "@/components/QuestionCard";
import { SideDrawer } from "@/components/SideDrawer";
import { QuickInput } from "@/components/QuickInput";
import { Menu, Plus, Heart, BookOpen, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useSwipe } from "@/hooks/useSwipe";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const { data: prompts } = trpc.prompts.list.useQuery({});
  const { data: entries, refetch: refetchEntries } = trpc.journal.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Side drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Category state: gratitude or philosophical
  const [category, setCategory] = useState<"gratitude" | "philosophical">("gratitude");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState<"left" | "right" | null>(null);

  // Filter prompts by category and limit to 5
  const filteredPrompts = useMemo(() => {
    const filtered = prompts?.filter(p => p.category === category) || [];
    return filtered.slice(0, 5);
  }, [prompts, category]);

  // Reset index when category changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [category]);

  const totalPrompts = filteredPrompts.length;

  // Calculate today's progress
  const today = new Date().toDateString();
  const todayEntries = entries?.filter(e => new Date(e.createdAt).toDateString() === today).length || 0;
  const dailyGoal = 3;

  // Navigation handlers with animation
  const handlePrev = useCallback(() => {
    setSlideDirection("right");
    setTimeout(() => {
      setCurrentIndex(prev => (prev > 0 ? prev - 1 : totalPrompts - 1));
      setSlideDirection(null);
    }, 150);
  }, [totalPrompts]);

  const handleNext = useCallback(() => {
    setSlideDirection("left");
    setTimeout(() => {
      setCurrentIndex(prev => (prev < totalPrompts - 1 ? prev + 1 : 0));
      setSlideDirection(null);
    }, 150);
  }, [totalPrompts]);

  const handleComplete = () => {
    refetchEntries();
    // Move to next question
    if (currentIndex < totalPrompts - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  // Format date
  const formatDate = () => {
    const now = new Date();
    return now.toLocaleDateString('zh-CN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Toggle category
  const toggleCategory = () => {
    setCategory(prev => prev === "gratitude" ? "philosophical" : "gratitude");
  };

  // Get visible cards (prev, current, next)
  const getVisibleCards = () => {
    if (totalPrompts === 0) return [];
    
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : totalPrompts - 1;
    const nextIndex = currentIndex < totalPrompts - 1 ? currentIndex + 1 : 0;
    
    return [
      { prompt: filteredPrompts[prevIndex], position: "left" as const },
      { prompt: filteredPrompts[currentIndex], position: "center" as const },
      { prompt: filteredPrompts[nextIndex], position: "right" as const },
    ];
  };

  const visibleCards = getVisibleCards();

  // Swipe gesture support with iOS-style physics
  const { ref: swipeRef, swipeState } = useSwipe<HTMLDivElement>({
    onSwipeLeft: handleNext,
    onSwipeRight: handlePrev,
    threshold: 50,
    enabled: totalPrompts > 0,
  });

  return (
    <div className="min-h-screen bg-background text-foreground ambient-bg flex flex-col pb-20">
      {/* Side Drawer */}
      <SideDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      {/* Header */}
      <header className="py-6 px-6 relative z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsDrawerOpen(true)}
              className="p-2 rounded-full hover:bg-muted transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-serif font-bold">开悟日志</h1>
              <p className="text-sm text-muted-foreground">{formatDate()}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <ThemeSelector />
            
            <Link href="/favorites">
              <Button variant="ghost" size="icon" className="rounded-full icon-glow">
                <Heart className="w-5 h-5" />
              </Button>
            </Link>
            
            <Link href="/history">
              <Button variant="ghost" size="icon" className="rounded-full icon-glow">
                <BookOpen className="w-5 h-5" />
              </Button>
            </Link>
            
            <Link href="/write?mode=free">
              <Button size="icon" className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 px-4 pb-10 relative z-10 flex flex-col">
        <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
          
          {/* Today's Progress */}
          <section className="mb-6 px-2">
            <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-4 border border-border/50">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">今日进度</span>
                <span className="text-sm text-primary font-medium">{todayEntries}/{dailyGoal} 条记录</span>
              </div>
              <div className="flex gap-2">
                {[...Array(dailyGoal)].map((_, i) => (
                  <div 
                    key={i}
                    className={`flex-1 h-2 rounded-full transition-colors ${
                      i < todayEntries ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* Category Header */}
          <section className="flex items-center justify-between mb-4 px-2">
            <h2 className="text-lg font-medium">
              {category === "gratitude" ? "今日感恩" : "今日哲思"}
            </h2>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={toggleCategory}
              className="rounded-full text-xs gap-1 btn-glow"
            >
              {category === "gratitude" ? "感恩" : "哲思"}
              <RefreshCw className="w-3 h-3" />
              {category === "gratitude" ? "哲思" : "感恩"}
            </Button>
          </section>

          {/* Card Carousel */}
          <section className="flex-1 flex flex-col justify-center">
            {totalPrompts > 0 ? (
              <>
                {/* Cards Container */}
                <div 
                  ref={swipeRef}
                  className="relative flex items-center justify-center gap-4 overflow-hidden py-4 cursor-grab active:cursor-grabbing select-none"
                  style={{
                    transform: `translateX(${swipeState.offset}px) translateZ(0)`,
                    transition: swipeState.isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                    willChange: 'transform',
                  }}>
                  {visibleCards.map((card, index) => (
                    <QuestionCard
                      key={`${card.prompt.id}-${card.position}`}
                      prompt={card.prompt}
                      isActive={card.position === "center"}
                      position={card.position}
                      onComplete={handleComplete}
                    />
                  ))}
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-center gap-8 mt-4">
                  <button 
                    onClick={handlePrev}
                    className="p-2 rounded-full hover:bg-muted transition-colors interactive-glow"
                  >
                    <ChevronLeft className="w-6 h-6 text-muted-foreground" />
                  </button>
                  
                  <span className="text-sm text-muted-foreground">
                    {currentIndex + 1} / {totalPrompts}
                  </span>
                  
                  <button 
                    onClick={handleNext}
                    className="p-2 rounded-full hover:bg-muted transition-colors interactive-glow"
                  >
                    <ChevronRight className="w-6 h-6 text-muted-foreground" />
                  </button>
                </div>

                {/* Dot indicators */}
                <div className="flex items-center justify-center gap-2 mt-4">
                  {filteredPrompts.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentIndex 
                          ? 'bg-primary w-4' 
                          : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                      }`}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <p>暂无题目</p>
                </div>
              </div>
            )}
          </section>

          {/* Login prompt for non-authenticated users */}
          {!isAuthenticated && (
            <section className="mt-4 px-2">
              <div className="bg-card/50 rounded-2xl p-4 text-center border border-border/50">
                <p className="text-sm text-muted-foreground mb-3">登录后可保存您的日记</p>
                <Button asChild variant="outline" size="sm" className="rounded-full btn-glow">
                  <a href={getLoginUrl()}>登录</a>
                </Button>
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Bottom Quick Input */}
      <QuickInput onComplete={() => refetchEntries()} />
    </div>
  );
}
