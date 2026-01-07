import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getUserJournalEntries } from "@/lib/db/queries"
import { AppNavbar } from "@/components/app-navbar"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Calendar, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface SageInsight {
  emoji: string;
  sage: string;
  insight: string;
}

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const entries = await getUserJournalEntries(user.id)

  return (
    <div className="min-h-screen bg-[#FDFCF8]">
      <AppNavbar userEmail={user.email} />
      
      <main className="pt-24 pb-12 px-4 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-[#E8F3E8] rounded-full">
            <Calendar className="w-6 h-6 text-[#5F7368]" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-[#5F7368]">历史</h1>
          <p className="text-sm text-gray-500">{format(new Date(), "yyyy年M月d日", { locale: zhCN })}</p>
        </div>

        {/* Insights Card */}
        {entries.length >= 7 && (
          <Card className="mb-8 border-none shadow-lg bg-gradient-to-br from-orange-50 to-amber-50 overflow-hidden">
            <CardContent className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-orange-100 rounded-full">
                <Sparkles className="w-8 h-8 text-orange-500" />
              </div>
              <h2 className="text-xl font-serif font-bold text-gray-900 mb-2">深度回顾与洞察</h2>
              <p className="text-gray-600 mb-1">基于你的 {entries.length} 篇日记</p>
              <p className="text-sm text-gray-500 mb-6">发现你的成长、关系、内在智慧</p>
              <Link href="/history/insights">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-6 py-2 inline-flex items-center gap-2">
                  开始探索
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {entries.length === 0 ? (
          <div className="text-center py-20 bg-white/50 rounded-2xl border border-gray-100">
            <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">还没有记录，开始你的第一次觉察吧</p>
          </div>
        ) : (
          <div className="space-y-6">
            {entries.map((entry) => (
              <Card key={entry.id} className="border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className={
                          entry.category === 'gratitude' 
                            ? "bg-amber-50 text-amber-700 hover:bg-amber-100" 
                            : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                        }>
                          {entry.category === 'gratitude' ? '感恩日记' : '哲思时刻'}
                        </Badge>
                        <span className="text-xs text-gray-400 font-medium">
                          {format(entry.createdAt, "yyyy年M月d日 EEEE HH:mm", { locale: zhCN })}
                        </span>
                      </div>
                      <CardTitle className="text-lg font-medium text-gray-900 leading-relaxed">
                        {entry.promptText || "自由书写"}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-stone max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {entry.content}
                    </p>
                  </div>
                  
                  {/* Show insights summary if any */}
                  {Array.isArray(entry.sageInsights) && entry.sageInsights.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-gray-100">
                      <h4 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        智者回应
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {(entry.sageInsights as unknown as SageInsight[]).map((insight, idx) => (
                          <div key={idx} className="bg-[#FDFCF8] p-3 rounded-lg border border-gray-100 text-sm">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg">{insight.emoji}</span>
                              <span className="font-medium text-[#5F7368]">{insight.sage}</span>
                            </div>
                            <p className="text-gray-600 line-clamp-3">{insight.insight}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
