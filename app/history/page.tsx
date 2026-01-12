import { createClient } from "@/lib/supabase/server"
import Image from "next/image"
import { redirect } from "next/navigation"
import { getUserJournalEntriesCount, getUserJournalEntriesList } from "@/lib/db/queries"
import { AppNavbar } from "@/components/app-navbar"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Calendar, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { EntryExpander } from "@/components/entry-expander"

interface SageInsight {
  emoji: string;
  sage: string;
  insight: string;
}

const PAGE_SIZE = 10

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page } = await searchParams
  const currentPage = Math.max(Number.parseInt(page ?? "1", 10) || 1, 1)
  const offset = (currentPage - 1) * PAGE_SIZE

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const [totalCount, entries] = await Promise.all([
    getUserJournalEntriesCount(user.id),
    getUserJournalEntriesList(user.id, PAGE_SIZE, offset),
  ])
  const totalPages = Math.max(Math.ceil(totalCount / PAGE_SIZE), 1)

  return (
    <div className="min-h-screen bg-[#FDFCF8] dark:bg-background transition-colors duration-300">
      <AppNavbar userEmail={user.email} />
      
      <main className="pt-24 pb-12 px-4 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-[#F0F5F2] dark:bg-primary/20 rounded-full transition-colors">
            <Calendar className="w-6 h-6 text-[#5C7A63] dark:text-primary transition-colors" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-[#5C7A63] dark:text-primary transition-colors">历史</h1>
          <p className="text-sm text-gray-500 dark:text-muted-foreground transition-colors">{format(new Date(), "yyyy年M月d日", { locale: zhCN })}</p>
        </div>

        {/* Insights Card */}
        {totalCount > 0 && (
          <Card className="mb-8 border-none shadow-lg overflow-hidden relative min-h-[400px] flex items-center justify-center group">
            <div className="absolute inset-0 z-0">
                <Image
                  src="/history-insight-bg-final.png"
                  alt="Insight Background"
                  fill
                  className="object-contain transition-transform duration-700 group-hover:scale-105"
                  priority
                />
                <div className="absolute inset-0 bg-black/30 transition-colors group-hover:bg-black/40" />
             </div>
            
            <CardContent className="relative z-10 p-8 text-center space-y-6 max-w-lg mx-auto">
              <h2 className="text-3xl font-serif font-bold text-white drop-shadow-lg tracking-wide">深度回顾与洞察</h2>
              <div className="space-y-2">
                <p className="text-white/95 text-lg font-medium drop-shadow-md">基于你的 {totalCount} 篇日记</p>
                <p className="text-white/80 text-sm drop-shadow-md font-light tracking-wide">发现你的成长、关系、内在智慧</p>
              </div>
              <div className="pt-2">
                <Link href="/history/insights">
                  <Button className="bg-white/20 hover:bg-white/30 text-white border border-white/50 backdrop-blur-md rounded-full px-8 py-6 text-lg transition-all hover:scale-105 hover:border-white shadow-lg shadow-black/20">
                    开始探索
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {totalCount === 0 ? (
          <div className="text-center py-20 bg-white/50 dark:bg-card/50 rounded-2xl border border-gray-100 dark:border-border transition-colors">
            <Sparkles className="w-12 h-12 text-gray-300 dark:text-muted mx-auto mb-4 transition-colors" />
            <p className="text-gray-500 dark:text-muted-foreground font-medium transition-colors">还没有记录，开始你的第一次觉察吧</p>
          </div>
        ) : (
          <div className="space-y-6">
            {entries.map((entry) => (
              <Card key={entry.id} className="gap-1 border-gray-100 dark:border-border shadow-sm hover:shadow-md transition-all duration-300 bg-white/80 dark:bg-card/80 backdrop-blur-sm">
                <CardHeader className="pb-0">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className={
                          entry.category === 'gratitude' 
                            ? "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors" 
                            : "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-200 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                        }>
                          {entry.category === 'gratitude' ? '感恩日记' : '哲思时刻'}
                        </Badge>
                        <span className="text-xs text-gray-400 dark:text-muted-foreground font-medium transition-colors">
                          {format(entry.createdAt, "yyyy年M月d日 EEEE HH:mm", { locale: zhCN })}
                        </span>
                      </div>
                      <CardTitle className="text-lg font-medium text-gray-900 dark:text-foreground leading-relaxed transition-colors">
                        {entry.promptText || "自由书写"}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <EntryExpander 
                    entryId={entry.id} 
                    userId={user.id} 
                    initialEntry={{
                      id: entry.id,
                      content: entry.content ?? "",
                      sageInsights: entry.sageInsights as any
                    }}
                  />
                </CardContent>
              </Card>
            ))}

            <div className="flex items-center justify-between pt-4">
              <div className="text-sm text-gray-500 dark:text-muted-foreground transition-colors">
                第 {currentPage} / {totalPages} 页
              </div>
              <div className="flex gap-2">
                {currentPage > 1 ? (
                  <Link href={`/history?page=${currentPage - 1}`}>
                    <Button variant="outline" className="border-gray-200 dark:border-border transition-colors">
                      上一页
                    </Button>
                  </Link>
                ) : (
                  <Button variant="outline" disabled className="border-gray-200 dark:border-border transition-colors">
                    上一页
                  </Button>
                )}

                {currentPage < totalPages ? (
                  <Link href={`/history?page=${currentPage + 1}`}>
                    <Button variant="outline" className="border-gray-200 dark:border-border transition-colors">
                      下一页
                    </Button>
                  </Link>
                ) : (
                  <Button variant="outline" disabled className="border-gray-200 dark:border-border transition-colors">
                    下一页
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
