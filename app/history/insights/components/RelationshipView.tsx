'use client'

import { Card, CardContent } from "@/components/ui/card"
import { RelationshipData } from "@/app/actions/ai"
import { Heart } from "lucide-react"
import { TheoristCard } from "./TheoristCard"

export function RelationshipView({ data }: { data: RelationshipData }) {
  if (!data) return null;

  return (
    <div className="space-y-6 max-w-md mx-auto">
      {/* Theorist Card */}
      {data.theorist && <TheoristCard theorist={data.theorist} />}

      {/* Analysis Text Card */}
      {data.analysis && (
        <Card className="border-none bg-gray-50/80 dark:bg-zinc-800/50 text-gray-900 dark:text-zinc-100 shadow-md">
          <CardContent className="p-6">
            <p className="leading-relaxed font-serif text-base text-gray-700 dark:text-zinc-300">
              {data.analysis}
            </p>
          </CardContent>
        </Card>
      )}

      {/* People Groups */}
      {data.peopleGroups?.map((group, gIndex) => (
        <Card key={gIndex} className="border-none bg-white dark:bg-zinc-900 text-gray-900 dark:text-white shadow-md overflow-hidden">
          <CardContent className="p-6">
            {/* Group Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center text-lg">
                {group.emoji}
              </div>
              <div>
                <h3 className="font-bold text-lg">{group.category}</h3>
                <p className="text-xs text-gray-500 dark:text-zinc-500">
                  提及 {group.people.reduce((acc, p) => acc + p.count, 0)} 次
                </p>
              </div>
            </div>

            {/* People List in this Group */}
            <div className="space-y-4">
              {group.people.map((person, pIndex) => (
                <div key={pIndex} className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl p-4">
                   <div className="flex items-center justify-between mb-2">
                      <div className="font-bold text-gray-800 dark:text-zinc-200">{person.name}</div>
                      {person.count > 0 && (
                        <span className="text-xs bg-gray-200 dark:bg-zinc-700 text-gray-600 dark:text-zinc-300 px-2 py-0.5 rounded-full">
                          {person.count} 次
                        </span>
                      )}
                   </div>
                   <p className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">
                     {person.gratitude}
                   </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Insight Footer */}
      <Card className="border border-red-100 dark:border-red-900/30 bg-gradient-to-br from-white to-red-50 dark:from-zinc-900 dark:to-zinc-950 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-3">
             <Heart className="w-5 h-5 text-red-500 fill-current" />
             <h3 className="font-bold text-red-600 dark:text-red-400">爱的洞察</h3>
          </div>
          <p className="text-gray-700 dark:text-zinc-300 font-serif leading-relaxed">
            {data.insight}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
