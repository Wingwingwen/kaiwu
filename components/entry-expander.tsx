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
    '孔子': 'confucius',
    '老子': 'laozi', 
    '释迦牟尼': 'buddha',
    '柏拉图': 'plato'
  }
  
  const key = sageKeyMap[sageName]
  return key ? `/sagens/${key}-avatar.png` : '/sagens/default-avatar.png'
}

export function EntryExpander({ entryId, userId }: { entryId: number; userId: string }) {
  const [expanded, setExpanded] = useState(false)
  const [entry, setEntry] = useState<JournalEntry | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchFullEntry = async () => {
    if (expanded || loading) return
    
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
      setExpanded(true)
    } catch (error) {
      console.error('Error fetching entry:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleExpanded = () => {
    if (!expanded) {
      fetchFullEntry()
    } else {
      setExpanded(false)
    }
  }

  return (
    <div className="mt-4">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={toggleExpanded} 
        disabled={loading}
        className="text-xs text-gray-500 hover:text-gray-700 inline-flex items-center gap-1"
      >
        {loading ? '加载中...' : (
          <>
            {expanded ? '收起内容' : '查看完整内容'}
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </>
        )}
      </Button>
      
      {expanded && entry && (
        <div className="mt-3 space-y-4">
          {/* 日记内容 */}
          <div className="prose prose-stone max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {entry.content}
            </p>
          </div>
          
          {/* 智者回应 */}
          {Array.isArray(entry.sageInsights) && entry.sageInsights.length > 0 && (
            <div className="pt-4 border-t border-gray-100">
              <h4 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                智者回应
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {entry.sageInsights.map((insight, idx) => (
                  <div key={idx} className="bg-[#FDFCF8] p-3 rounded-lg border border-gray-100 text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <Image
                        src={getSageAvatar(insight.sage)}
                        alt={insight.sage}
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                      <span className="font-medium text-[#5F7368]">{insight.sage}</span>
                    </div>
                    <p className="text-gray-600">{insight.insight}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}