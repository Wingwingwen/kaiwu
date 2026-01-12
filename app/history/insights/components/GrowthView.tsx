'use client'

import { Card, CardContent } from "@/components/ui/card"
import { GrowthData } from "@/app/actions/ai"
import { TheoristCard } from "./TheoristCard"

export function GrowthView({ data }: { data: GrowthData }) {
  if (!data) return null;

  return (
    <div className="space-y-6 max-w-md mx-auto md:max-w-4xl">
      {/* Top Section: Theorist & Current Level */}
      <div className="grid md:grid-cols-2 gap-6">
        {data.theorist && <TheoristCard theorist={data.theorist} />}
        
        <Card className="border-none bg-white dark:bg-zinc-900 text-gray-900 dark:text-white shadow-md h-full">
          <CardContent className="p-6 flex flex-col justify-center h-full">
            <div className="text-sm text-gray-500 dark:text-zinc-400 mb-2">你当前的灵性阶段</div>
            <div className="flex items-baseline gap-3 mb-1">
              <span className="text-3xl font-bold text-emerald-500">{data.currentLevel}</span>
            </div>
            <div className="text-xs text-gray-400 dark:text-zinc-500">Hawkins 意识层级参考</div>
          </CardContent>
        </Card>
      </div>

      {/* Middle Section: Journey & Key Shifts - Side by Side on Desktop */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Journey Section */}
        <Card className="border-none bg-white dark:bg-zinc-900 text-gray-900 dark:text-white shadow-md h-full">
          <CardContent className="p-6 flex flex-col h-full">
            <div className="flex items-center gap-2 mb-3">
               <span className="text-xl">🌱</span>
               <h3 className="font-bold text-lg">你的成长轨迹</h3>
            </div>
            <p className="text-gray-700 dark:text-zinc-300 leading-relaxed text-sm flex-1">
              {data.journeyDescription}
            </p>
          </CardContent>
        </Card>

        {/* Key Shifts Section */}
        <Card className="border-none bg-white dark:bg-zinc-900 text-gray-900 dark:text-white shadow-md h-full">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
               <span className="text-xl">✨</span>
               <h3 className="font-bold text-lg">关键转变</h3>
            </div>
            <div className="space-y-3">
              {data.shifts.map((shift, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                  <p className="text-gray-700 dark:text-zinc-300 text-sm">
                    从 <span className="text-gray-500 dark:text-zinc-500">{shift.from}</span> 到 <span className="text-emerald-600 dark:text-emerald-400 font-medium">{shift.to}</span>
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Encouragement Footer */}
      <Card className="border border-emerald-100 dark:border-emerald-900/30 bg-white dark:bg-zinc-900 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-3">
             <span className="text-xl">🌟</span>
             <h3 className="font-bold text-emerald-600 dark:text-emerald-400">来自高维的视角</h3>
          </div>
          <p className="text-gray-700 dark:text-zinc-300 leading-relaxed">
            {data.encouragement}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
