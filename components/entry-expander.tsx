'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Sparkles, ChevronUp, ChevronDown } from 'lucide-react'

interface SageInsight {
  emoji: string;
  sage: string;
  insight: string;
}

interface JournalEntry {
  id: number;
  content: string;
  sageInsights?: SageInsight[];
}

// 智者头像映射函数
const getSageAvatar = (sageName: string): string => {
  const sageKeyMap: Record<string, string> = {
    '爱的使者': 'confucius',
    '孔子': 'confucius',
    '老子': 'laozi', 
    '释迦牟尼': 'buddha',
    '马可·奥勒留': 'plato',
    '柏拉图': 'plato'
  }
  
  const key = sageKeyMap[sageName]
  return key ? `/sagens/${key}-avatar.png` : '/sagens/default-avatar.png'
}

export function EntryExpander({ entryId, userId, initialEntry }: { entryId: number; userId: string; initialEntry?: JournalEntry | null }) {
  const [showInsights, setShowInsights] = useState(false)
  const [entry, setEntry] = useState<JournalEntry | null>(initialEntry || null)
  const [loading, setLoading] = useState(false)
  
  // Also support collapsing content if it's very long, but default to visible
  // const [contentExpanded, setContentExpanded] = useState(true)

  const fetchFullEntry = async () => {
    if (loading) return
    
    setLoading(true)
    try {
      const res = await fetch(`/api/entries/${entryId}`, {
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
        body: JSON.stringify({ userId })
      })
      
      if (!res.ok) {
        throw new Error('Failed to fetch entry')
      }
      
      const data = await res.json()
      setEntry(data)
      setShowInsights(true)
    } catch (error) {
      console.error('Error fetching entry:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleInsights = () => {
    if (!showInsights) {
      if (entry?.sageInsights) {
        setShowInsights(true)
      } else {
        fetchFullEntry()
      }
    } else {
      setShowInsights(false)
    }
  }

  /*
  const toggleContent = () => {
    setContentExpanded(!contentExpanded)
  }
  */

  if (!entry) {
      // Fallback if no initial entry (should not happen with current usage)
      return (
        <div className="mt-4">
             <Button 
                variant="ghost" 
                size="sm" 
                onClick={fetchFullEntry} 
                disabled={loading}
                className="text-xs text-gray-500"
              >
                {loading ? '加载中...' : '查看内容'}
              </Button>
        </div>
      )
  }

  return (
    <div className="mt-0">
      {/* Content Section - Always rendered if we have entry, but can be collapsed */}
      <div className="prose prose-stone dark:prose-invert max-w-none overflow-hidden">
        <p className="mt-0 text-gray-700 dark:text-foreground whitespace-pre-wrap leading-relaxed transition-colors text-base">
          {entry.content}
        </p>
      </div>
      
      {/* Sage Insights Section */}
      <div className="border-t border-dashed border-gray-100 dark:border-border pt-4 mt-4">
          {!showInsights ? (
            <Button
                variant="ghost"
                size="sm"
                onClick={toggleInsights}
                disabled={loading}
                className="text-sm font-medium text-[#5C7A63] dark:text-primary hover:text-[#4A6350] dark:hover:text-primary/90 hover:bg-[#F0F5F2] dark:hover:bg-primary/10 transition-colors"
            >
                {loading ? (
                    <span className="flex items-center gap-2"><Sparkles className="w-4 h-4 animate-spin" /> 正在连接智者...</span>
                ) : (
                    <span className="flex items-center gap-2"><Sparkles className="w-4 h-4" /> 查看智者回应</span>
                )}
            </Button>
          ) : (
             <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-muted-foreground flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-orange-500" />
                        智者回应
                    </h4>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setShowInsights(false)}
                        className="text-xs text-gray-400 hover:text-gray-600 h-6 px-2"
                    >
                        收起
                    </Button>
                </div>
                
                {Array.isArray(entry.sageInsights) && entry.sageInsights.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                    {entry.sageInsights.slice(0, 1).map((insight, idx) => (
                        <div key={idx} className="bg-stone-50 dark:bg-muted/50 rounded-lg p-4 border border-stone-100 dark:border-border/50">
                        <div className="flex items-center gap-2 mb-2">
                            {getSageAvatar(insight.sage) ? (
                            <div className="relative w-8 h-8 rounded-full overflow-hidden ring-1 ring-white dark:ring-border">
                                <Image
                                src={getSageAvatar(insight.sage)}
                                alt={insight.sage}
                                fill
                                sizes="32px"
                                className="object-cover"
                                />
                            </div>
                            ) : (
                            <span className="text-xl">{insight.emoji}</span>
                            )}
                            <span className="font-serif font-bold text-gray-700 dark:text-foreground">{insight.sage}</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-muted-foreground leading-relaxed">
                            {insight.insight}
                        </p>
                        </div>
                    ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-400 italic">暂无智者回应</p>
                )}
             </div>
          )}
      </div>
    </div>
  )
}