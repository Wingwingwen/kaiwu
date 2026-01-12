'use client'

import { Card, CardContent } from "@/components/ui/card"
import { ConflictData } from "@/app/actions/ai"
import { TheoristCard } from "./TheoristCard"

export function ConflictView({ data }: { data: ConflictData }) {
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

      {/* Conflicts List - Grid on Desktop */}
      <div className="grid md:grid-cols-2 gap-6">
        {data.conflicts.map((conflict, index) => (
          <Card key={index} className="border-none bg-white dark:bg-zinc-900 text-gray-900 dark:text-white overflow-hidden shadow-md flex flex-col">
            <CardContent className="p-6 flex-1 flex flex-col">
               {/* Title */}
               <h3 className="text-lg font-bold mb-4">
                 {conflict.title}
               </h3>

               {/* Tension & Integration - Side by Side on wide cards if space permits, but stacked in grid columns */}
               <div className="flex-1 space-y-3">
                  {/* Tension Section */}
                  <div className="bg-gray-50 dark:bg-zinc-800/80 p-4 rounded-xl h-full">
                    <div className="text-xs font-bold text-gray-500 dark:text-zinc-500 mb-2">矛盾点</div>
                    <p className="text-gray-700 dark:text-zinc-300 text-sm leading-relaxed">
                      {conflict.tension}
                    </p>
                  </div>

                  {/* Integration Section */}
                  <div className="bg-emerald-50 dark:bg-[#1a2e26] p-4 rounded-xl h-full">
                    <div className="text-xs font-bold text-emerald-600 dark:text-emerald-500 mb-2">整合之路</div>
                    <p className="text-gray-700 dark:text-zinc-300 text-sm leading-relaxed">
                      {conflict.integration}
                    </p>
                  </div>
               </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Wisdom Footer */}
      <Card className="border-none bg-white dark:bg-zinc-900 text-gray-900 dark:text-white shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-3">
             <span className="text-xl">🕊️</span>
             <h3 className="font-bold text-emerald-600 dark:text-emerald-400">走向完整的智慧</h3>
          </div>
          <p className="text-gray-700 dark:text-zinc-300 leading-relaxed">
            {data.wisdom}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
