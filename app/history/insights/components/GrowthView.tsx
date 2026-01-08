'use client'

import { Card, CardContent } from "@/components/ui/card"
import { GrowthData } from "@/app/actions/ai"
import { ArrowRight, Sprout } from "lucide-react"

export function GrowthView({ data }: { data: GrowthData }) {
  return (
    <div className="space-y-8">
      {/* Current State */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-3xl text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4 shadow-sm">
          <Sprout className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-sm font-medium text-green-600 mb-2 uppercase tracking-wider">当前阶段</h2>
        <h3 className="text-2xl font-serif font-bold text-gray-900 mb-4">
          {data.currentLevel}
        </h3>
        <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
          {data.journeyDescription}
        </p>
      </div>

      {/* Shifts Timeline */}
      <div className="relative pl-4 border-l-2 border-gray-100 space-y-8 ml-4">
        {data.shifts.map((shift, index) => (
          <div key={index} className="relative">
            <div className="absolute -left-[21px] top-0 w-4 h-4 rounded-full bg-green-200 border-2 border-white ring-1 ring-gray-100" />
            <div className="mb-2">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                {shift.date}
              </span>
            </div>
            <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3 text-sm">
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full line-through opacity-70">
                    {shift.from}
                  </span>
                  <ArrowRight className="w-4 h-4 text-gray-300 rotate-90 sm:rotate-0" />
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                    {shift.to}
                  </span>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {shift.description}
                </p>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* Encouragement */}
      <div className="text-center p-6 border-t border-gray-100">
        <p className="font-handwriting text-xl text-green-700 transform -rotate-1">
          {data.encouragement}
        </p>
      </div>
    </div>
  )
}
