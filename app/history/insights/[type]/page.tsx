import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { getUserJournalEntries } from "@/lib/db/queries"
import { AppNavbar } from "@/components/app-navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Users, Target, TrendingUp, Lightbulb, Repeat, Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const insightConfigs = {
  relationships: {
    title: "我的人物关系",
    subtitle: "基于社会网络分析",
    icon: Users,
    color: "from-blue-50 to-cyan-50",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  consciousness: {
    title: "我的意识层级",
    subtitle: "基于 David Hawkins 意识地图",
    icon: Target,
    color: "from-purple-50 to-pink-50",
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
  },
  growth: {
    title: "我的成长",
    subtitle: "基于David Hawkins意识层级",
    icon: TrendingUp,
    color: "from-green-50 to-emerald-50",
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
  },
  mindfulness: {
    title: "我近期可以注意的",
    subtitle: "基于正念觉察理论",
    icon: Lightbulb,
    color: "from-yellow-50 to-orange-50",
    iconBg: "bg-yellow-100",
    iconColor: "text-yellow-600",
  },
  "inner-conflict": {
    title: "如何梳理我的内在矛盾",
    subtitle: "基于荣格心理学",
    icon: Repeat,
    color: "from-rose-50 to-red-50",
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600",
  },
} as const

type InsightType = keyof typeof insightConfigs

export default async function InsightDetailPage({
  params
}: {
  params: Promise<{ type: string }>
}) {
  const { type } = await params

  if (!(type in insightConfigs)) {
    notFound()
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const entries = await getUserJournalEntries(user.id)
  const config = insightConfigs[type as InsightType]
  const Icon = config.icon

  return (
    <div className="min-h-screen bg-[#FDFCF8]">
      <AppNavbar userEmail={user.email} />

      <main className="pt-24 pb-12 px-4 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/history/insights">
            <Button variant="ghost" size="sm" className="mb-4 gap-2">
              <ArrowLeft className="w-4 h-4" />
              返回洞察选择
            </Button>
          </Link>

          <div className="flex items-start gap-4">
            <div className={`p-3 ${config.iconBg} rounded-2xl`}>
              <Icon className={`w-8 h-8 ${config.iconColor}`} />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-serif font-bold text-[#5F7368] mb-1">{config.title}</h1>
              <p className="text-amber-600 font-medium">{config.subtitle}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        {entries.length < 7 ? (
          <Card className="border-gray-100">
            <CardContent className="p-12 text-center">
              <div className="text-4xl mb-4">📝</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">还需要更多日记</h3>
              <p className="text-gray-600 mb-6">
                至少需要 7 篇日记才能生成有意义的洞察分析
                <br />
                当前已有 {entries.length} 篇
              </p>
              <Link href="/">
                <Button className="bg-[#5F7368] hover:bg-[#4A5A52] text-white">
                  去写日记
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <InsightContent type={type as InsightType} entries={entries} />
        )}
      </main>
    </div>
  )
}

async function InsightContent({
  type,
  entries
}: {
  type: InsightType
  entries: any[]
}) {
  // Placeholder for now - will implement AI analysis later
  return (
    <Card className="border-gray-100">
      <CardHeader>
        <CardTitle className="text-lg">正在分析你的 {entries.length} 篇日记...</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Loader2 className="w-12 h-12 text-gray-400 animate-spin mb-4" />
          <p className="text-gray-600">
            AI 正在深度分析你的日记内容
            <br />
            这可能需要一点时间...
          </p>
        </div>
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">分析内容包括：</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            {type === "relationships" && (
              <>
                <li>• 识别日记中提及的重要人物</li>
                <li>• 分析与这些人的互动模式</li>
                <li>• 发现你感恩他们的具体原因</li>
              </>
            )}
            {type === "consciousness" && (
              <>
                <li>• 根据 David Hawkins 意识地图评估你的言语层级</li>
                <li>• 追踪意识层级的变化趋势</li>
                <li>• 提供提升意识层级的建议</li>
              </>
            )}
            {type === "growth" && (
              <>
                <li>• 回顾你的灵性成长轨迹</li>
                <li>• 识别重大的内在转变时刻</li>
                <li>• 看见你的进步与蜕变</li>
              </>
            )}
            {type === "mindfulness" && (
              <>
                <li>• 从高维视角审视你的近期生活</li>
                <li>• 基于爱与觉察给出温柔提醒</li>
                <li>• 帮助你更好地活在当下</li>
              </>
            )}
            {type === "inner-conflict" && (
              <>
                <li>• 识别日记中反映的内在矛盾</li>
                <li>• 运用荣格心理学帮助你理解冲突</li>
                <li>• 提供整合与和解的路径</li>
              </>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
