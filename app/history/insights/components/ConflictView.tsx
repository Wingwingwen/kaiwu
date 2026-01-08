'use client'

import { Card, CardContent } from "@/components/ui/card"
import { ConflictData } from "@/app/actions/ai"
import { ArrowLeftRight, Scale } from "lucide-react"

export function ConflictView({ data }: { data: ConflictData }) {
  return (
    <div className="space-y-8">
      {/* Intro */}
      <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100">
        <div className="flex items-start gap-4">
          <Scale className="w-6 h-6 text-rose-400 mt-1 flex-shrink-0" />
          <p className="text-gray-700 leading-relaxed">
            {data.intro}
          </p>
        </div>
      </div>

      {/* Conflicts List */}
      <div className="space-y-6">
        {data.conflicts.map((conflict, index) => (
          <div key={index} className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-gray-100" />
            <div className="relative z-10 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                {conflict.title}
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-xs font-medium text-gray-500 uppercase mb-2 flex items-center gap-2">
                    <ArrowLeftRight className="w-3 h-3" />
                    内在张力
                  </div>
                  <p className="text-gray-700 text-sm">
                    {conflict.tension}
                  </p>
                </div>
                
                <div className="bg-rose-50/50 p-4 rounded-lg border border-rose-100">
                  <div className="text-xs font-medium text-rose-500 uppercase mb-2 flex items-center gap-2">
                    <Scale className="w-3 h-3" />
                    整合路径
                  </div>
                  <p className="text-gray-700 text-sm">
                    {conflict.integration}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Wisdom */}
      <Card className="bg-gradient-to-br from-gray-900 to-gray-800 text-white border-none shadow-xl">
        <CardContent className="p-8 text-center">
          <p className="font-serif text-lg leading-relaxed opacity-90">
            "{data.wisdom}"
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
