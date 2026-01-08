'use client'

import { Card, CardContent } from "@/components/ui/card"
import { MindfulnessData } from "@/app/actions/ai"
import { Sparkles } from "lucide-react"

export function MindfulnessView({ data }: { data: MindfulnessData }) {
  return (
    <div className="space-y-6">
      {/* Intro */}
      <div className="text-center mb-8">
        <p className="text-gray-600 font-serif text-lg italic">
          "{data.intro}"
        </p>
      </div>

      {/* Reminders */}
      <div className="space-y-4">
        {data.reminders.map((reminder, index) => (
          <Card key={index} className="border-none shadow-sm bg-amber-50/50 overflow-hidden">
            <div className="h-1 bg-amber-200" />
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="text-3xl bg-white w-12 h-12 flex items-center justify-center rounded-full shadow-sm flex-shrink-0">
                  {reminder.emoji}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                    {reminder.title}
                  </h3>
                  <div className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-sm font-medium mb-2">
                    {reminder.coreInsight}
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {reminder.detail}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Blessing */}
      <div className="mt-8 relative p-8 text-center overflow-hidden rounded-3xl bg-gradient-to-r from-yellow-50 via-orange-50 to-yellow-50">
        <Sparkles className="absolute top-4 left-4 w-6 h-6 text-yellow-400 opacity-50" />
        <Sparkles className="absolute bottom-4 right-4 w-6 h-6 text-yellow-400 opacity-50" />
        <p className="font-serif font-bold text-xl text-amber-800">
          {data.blessing}
        </p>
      </div>
    </div>
  )
}
