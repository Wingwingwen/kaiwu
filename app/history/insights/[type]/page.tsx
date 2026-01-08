import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { getUserJournalEntries } from "@/lib/db/queries"
import { AppNavbar } from "@/components/app-navbar"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Users, Target, TrendingUp, Lightbulb, Repeat } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { InsightContent } from "../InsightContent"

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
        {entries.length === 0 ? (
          <Card className="border-gray-100">
            <CardContent className="p-12 text-center">
              <div className="text-4xl mb-4">📝</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">还没有日记</h3>
              <p className="text-gray-600 mb-6">
                请先写一篇日记，再来生成洞察分析
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
