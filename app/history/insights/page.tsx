import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AppNavbar } from "@/components/app-navbar"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, ArrowRight, Users, Target, TrendingUp, Lightbulb, Repeat } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const insights = [
  {
    id: "relationships",
    title: "我的人物关系",
    subtitle: "基于社会网络分析",
    description: "梳理你日记中提及最多的人，以及你感恩他们的点",
    icon: Users,
    color: "from-blue-50 to-cyan-50",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    id: "consciousness",
    title: "我的意识层级",
    subtitle: "基于 David Hawkins 意识地图",
    description: "分析你日记中的言语层级，追踪意识升级进步",
    icon: Target,
    color: "from-purple-50 to-pink-50",
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
  },
  {
    id: "growth",
    title: "我的成长",
    subtitle: "基于David Hawkins意识层级",
    description: "回顾你的灵性成长轨迹，看见内在的蜕变",
    icon: TrendingUp,
    color: "from-green-50 to-emerald-50",
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
  },
  {
    id: "mindfulness",
    title: "我近期可以注意的",
    subtitle: "基于正念觉察理论",
    description: "从爱和高维的视角，给你近期生活的温柔提醒",
    icon: Lightbulb,
    color: "from-yellow-50 to-orange-50",
    iconBg: "bg-yellow-100",
    iconColor: "text-yellow-600",
  },
  {
    id: "inner-conflict",
    title: "如何梳理我的内在矛盾",
    subtitle: "基于荣格心理学",
    description: "帮助你认知并梳理内在的矛盾与冲突",
    icon: Repeat,
    color: "from-rose-50 to-red-50",
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600",
  },
]

export default async function InsightsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-[#FDFCF8]">
      <AppNavbar userEmail={user.email} />

      <main className="pt-24 pb-12 px-4 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/history">
            <Button variant="ghost" size="sm" className="mb-4 gap-2">
              <ArrowLeft className="w-4 h-4" />
              返回
            </Button>
          </Link>
          <h1 className="text-3xl font-serif font-bold text-[#5F7368] mb-2">回顾与洞察</h1>
          <p className="text-gray-600">选择你想要探索日记的方式</p>
        </div>

        {/* Insights Grid - 2 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {insights.map((insight) => {
            const Icon = insight.icon
            return (
              <Link key={insight.id} href={`/history/insights/${insight.id}`}>
                <Card className={`h-full border-none shadow-md hover:shadow-xl transition-all duration-300 bg-gradient-to-br ${insight.color} group cursor-pointer`}>
                  <CardContent className="p-6">
                    <div className={`inline-flex items-center justify-center w-12 h-12 mb-4 ${insight.iconBg} rounded-full`}>
                      <Icon className={`w-6 h-6 ${insight.iconColor}`} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{insight.title}</h3>
                    <p className="text-sm font-medium text-amber-600 mb-3">{insight.subtitle}</p>
                    <p className="text-sm text-gray-600 mb-4 leading-relaxed">{insight.description}</p>
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                      探索
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </main>
    </div>
  )
}
