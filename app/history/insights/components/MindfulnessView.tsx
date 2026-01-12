'use client'

import { Card, CardContent } from "@/components/ui/card"
import { MindfulnessData } from "@/app/actions/ai"
import { TheoristCard } from "./TheoristCard"

export function MindfulnessView({ data }: { data: MindfulnessData }) {
  if (!data) return null;

  return (
    <div className="space-y-6 max-w-md mx-auto md:max-w-4xl">
      {/* Top Section: Theorist & Intro */}
      <div className="grid md:grid-cols-2 gap-6">
        {data.theorist && <TheoristCard theorist={data.theorist} />}
        
        <Card className="border-none bg-white dark:bg-zinc-900 text-gray-900 dark:text-white shadow-md h-full">
          <CardContent className="p-6 flex items-center h-full">
            <p className="leading-relaxed text-gray-700 dark:text-zinc-300">
              {data.intro}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Reminders List - Grid on Desktop */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {data.reminders.map((reminder, index) => (
          <Card key={index} className="border-none bg-white dark:bg-zinc-900 text-gray-900 dark:text-white shadow-md overflow-hidden flex flex-col">
            <CardContent className="p-6 flex-1 flex flex-col">
               {/* Header */}
               <div className="flex items-center gap-3 mb-4">
                 <div className="text-2xl">{reminder.emoji}</div>
                 <h3 className="font-bold text-lg">{reminder.title}</h3>
               </div>

               {/* Core Insight (Yellow Highlight) */}
               <div className="flex items-start gap-2 mb-3">
                 <span className="text-amber-500 mt-0.5">⚡️</span>
                 <p className="font-bold text-amber-600 dark:text-amber-400">
                   {reminder.coreInsight}
                 </p>
               </div>

               {/* Detail */}
               <p className="text-gray-700 dark:text-zinc-300 leading-relaxed text-sm mt-auto">
                 {reminder.detail}
               </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Blessing Footer */}
      <Card className="border border-amber-100 dark:border-amber-900/30 bg-white dark:bg-zinc-900 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-3">
             <span className="text-xl">🙏</span>
             <h3 className="font-bold text-amber-600 dark:text-amber-400">爱的祝福</h3>
          </div>
          <p className="text-gray-700 dark:text-zinc-300 leading-relaxed">
            {data.blessing}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
