'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ConsciousnessData } from "@/app/actions/ai"
import { Progress } from "@/components/ui/progress"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"

const COLORS = ['#EF4444', '#3B82F6', '#F59E0B'] // Low (Red), Mid (Blue), High (Gold)

export function ConsciousnessView({ data }: { data: ConsciousnessData }) {
  const chartData = [
    { name: '低维 (恐惧/欲望)', value: data.distribution.low },
    { name: '中维 (理性/接纳)', value: data.distribution.mid },
    { name: '高维 (爱/喜悦)', value: data.distribution.high },
  ]

  return (
    <div className="space-y-8">
      {/* Overall Level */}
      <div className="text-center py-8 bg-gradient-to-b from-purple-50 to-white rounded-3xl">
        <h2 className="text-sm font-medium text-purple-600 mb-2 tracking-wider uppercase">当前意识层级估值</h2>
        <div className="text-6xl font-bold text-gray-900 mb-2 font-serif">
          {data.overallLevel}
        </div>
        <div className="inline-block px-4 py-1 bg-purple-100 text-purple-700 rounded-full font-medium text-sm mb-4">
          {data.levelName}
        </div>
        <div className="max-w-xs mx-auto">
          <Progress value={data.overallLevel / 10} className="h-2" />
        </div>
      </div>

      {/* Distribution Chart */}
      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">意识能量分布</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 text-sm">
            {chartData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                <span className="text-gray-600">{item.name} {item.value}%</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Breakdown */}
      <div className="space-y-4">
        <h3 className="font-serif font-bold text-gray-900 px-2">意识体现</h3>
        <div className="grid gap-4">
          {data.levelBreakdown.high.map((item, i) => (
            <QuoteCard key={`h-${i}`} item={item} color="bg-amber-50 border-amber-100 text-amber-900" badge="bg-amber-100 text-amber-700" />
          ))}
          {data.levelBreakdown.mid.map((item, i) => (
            <QuoteCard key={`m-${i}`} item={item} color="bg-blue-50 border-blue-100 text-blue-900" badge="bg-blue-100 text-blue-700" />
          ))}
          {data.levelBreakdown.low.map((item, i) => (
            <QuoteCard key={`l-${i}`} item={item} color="bg-red-50 border-red-100 text-red-900" badge="bg-red-100 text-red-700" />
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gray-50 p-6 rounded-2xl">
        <p className="text-gray-700 mb-4">{data.progressSummary}</p>
        <p className="text-purple-600 font-medium font-serif italic text-center">
          "{data.encouragement}"
        </p>
      </div>
    </div>
  )
}

function QuoteCard({ item, color, badge }: { item: any, color: string, badge: string }) {
  return (
    <div className={`p-4 rounded-xl border ${color}`}>
      <div className="flex justify-between items-start mb-2">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge}`}>
          {item.level} · {item.levelName}
        </span>
      </div>
      <p className="text-sm opacity-90">"{item.phrase}"</p>
    </div>
  )
}
