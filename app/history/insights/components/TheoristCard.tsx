'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Theorist } from "@/app/actions/ai"

interface TheoristCardProps {
  theorist: Theorist;
}

export function TheoristCard({ theorist }: TheoristCardProps) {
  if (!theorist) return null;

  return (
    <Card className="border-none bg-white dark:bg-zinc-900 text-gray-900 dark:text-white overflow-hidden shadow-lg">
      <CardContent className="p-6 flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-2xl flex-shrink-0 border border-gray-200 dark:border-zinc-700">
          {theorist.avatar || "👔"}
        </div>
        <div>
          <h3 className="font-bold text-lg mb-0.5">来自 {theorist.name} 的视角</h3>
          <div className="text-xs text-gray-500 dark:text-zinc-400 mb-2">
            {theorist.name} {theorist.period ? `(${theorist.period})` : ''}
            <br />
            {theorist.description}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
