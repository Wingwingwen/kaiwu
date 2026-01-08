'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, AlertCircle } from "lucide-react"
import { InsightType, generateInsightAnalysis, AnalysisResult } from "@/app/actions/ai"
import { AnalysisLoading } from "./components/AnalysisLoading"
import { RelationshipView } from "./components/RelationshipView"
import { ConsciousnessView } from "./components/ConsciousnessView"
import { GrowthView } from "./components/GrowthView"
import { MindfulnessView } from "./components/MindfulnessView"
import { ConflictView } from "./components/ConflictView"
import { Button } from "@/components/ui/button"

interface InsightContentProps {
  type: string
  entries: { content: string; createdAt: Date }[]
}

export function InsightContent({ type, entries }: InsightContentProps) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AnalysisResult['data'] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalysis = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await generateInsightAnalysis(entries, type as InsightType)
      setData(result.data)
    } catch (err) {
      console.error(err)
      setError("AI 分析暂时不可用，请稍后再试")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalysis()
  }, [type, entries])

  if (loading) {
    return <AnalysisLoading entryCount={entries.length} />
  }

  if (error) {
    return (
      <Card className="border-red-100 bg-red-50">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
          <p className="text-red-800 font-medium mb-4">{error}</p>
          <Button 
            onClick={fetchAnalysis}
            variant="outline" 
            className="border-red-200 text-red-700 hover:bg-red-100"
          >
            重试
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!data) return null

  switch (type) {
    case 'relationships':
      return <RelationshipView data={data as any} />
    case 'consciousness':
      return <ConsciousnessView data={data as any} />
    case 'growth':
      return <GrowthView data={data as any} />
    case 'mindfulness': // Match the key in config
      return <MindfulnessView data={data as any} />
    case 'inner-conflict':
      return <ConflictView data={data as any} />
    default:
      return <div>Unknown type</div>
  }
}
