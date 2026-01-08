'use client'

import { Card, CardContent } from "@/components/ui/card"
import { RelationshipData } from "@/app/actions/ai"
import { Heart } from "lucide-react"

export function RelationshipView({ data }: { data: RelationshipData }) {
  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="border-none shadow-md bg-white">
        <CardContent className="p-6">
          <p className="text-gray-700 leading-relaxed font-serif text-lg">
            {data.summary}
          </p>
        </CardContent>
      </Card>

      {/* People Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.people.map((person, index) => (
          <Card key={index} className="border border-gray-100 hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-2xl flex-shrink-0">
                {person.emoji || "👤"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-gray-900 truncate">{person.name}</h3>
                  <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                    提及 {person.count} 次
                  </span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {person.gratitude}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Insight Footer */}
      <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl p-6 text-center">
        <Heart className="w-8 h-8 text-red-400 mx-auto mb-3 fill-current" />
        <p className="text-gray-800 font-medium font-serif italic">
          "{data.insight}"
        </p>
      </div>
    </div>
  )
}
