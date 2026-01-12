'use client'

import { useEffect, useState } from "react"
import { Loader2, Sparkles } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const STEPS = [
  "正在分析你的日记内容...",
  "识别核心主题与模式...",
  "构建意识层级结构...",
  "生成个性化洞察..."
]

export function AnalysisLoading({ entryCount }: { entryCount: number }) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev))
    }, 1500)

    return () => clearInterval(interval)
  }, [])

  return (
    <Card className="border-gray-100 shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg text-center text-[#D8B064]">
          正在深度解读 {entryCount} 篇日记
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-orange-100 rounded-full animate-ping opacity-25" />
            <div className="relative bg-white p-4 rounded-full shadow-sm border border-orange-100">
              <Sparkles className="w-8 h-8 text-orange-500 animate-pulse" />
            </div>
          </div>
          
          <div className="space-y-4 max-w-xs mx-auto">
            {STEPS.map((text, index) => (
              <div 
                key={index}
                className={`flex items-center gap-3 transition-all duration-500 ${
                  index === step 
                    ? "opacity-100 transform scale-105" 
                    : index < step 
                      ? "opacity-40" 
                      : "opacity-20"
                }`}
              >
                {index <= step ? (
                  <div className="w-2 h-2 rounded-full bg-orange-500" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-gray-200" />
                )}
                <span className={`text-sm font-medium ${
                  index === step ? "text-gray-900" : "text-gray-500"
                }`}>
                  {text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
