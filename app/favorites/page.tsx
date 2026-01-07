import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getUserFavoriteInsights } from "@/lib/db/queries"
import { AppNavbar } from "@/components/app-navbar"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { Star, Quote } from "lucide-react"

export default async function FavoritesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const favorites = await getUserFavoriteInsights(user.id)

  return (
    <div className="min-h-screen bg-[#FDFCF8]">
      <AppNavbar userEmail={user.email} />
      
      <main className="pt-24 pb-12 px-4 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-[#FFF4E6] rounded-full">
            <Star className="w-6 h-6 text-amber-500" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-[#5F7368]">收藏灵感</h1>
        </div>

        {favorites.length === 0 ? (
          <div className="text-center py-20 bg-white/50 rounded-2xl border border-gray-100">
            <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">还没有收藏任何灵感</p>
            <p className="text-sm text-gray-400 mt-2">在智者回应中点击收藏图标即可保存</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {favorites.map((fav) => (
              <Card key={fav.id} className="border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 bg-white/80 backdrop-blur-sm group">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <Badge variant="outline" className="bg-[#FDFCF8] border-gray-200">
                      {fav.sage.charAt(0).toUpperCase() + fav.sage.slice(1)}
                    </Badge>
                    <span className="text-xs text-gray-400">
                      {format(fav.createdAt, "yyyy/MM/dd", { locale: zhCN })}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <Quote className="w-8 h-8 text-gray-100 absolute -top-2 -left-2 -z-10" />
                    <p className="text-gray-700 leading-relaxed font-serif text-lg">
                      {fav.content}
                    </p>
                  </div>
                  
                  {fav.originalContent && (
                    <div className="mt-4 pt-3 border-t border-gray-50 border-dashed">
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">原文回顾</p>
                      <p className="text-sm text-gray-500 line-clamp-2 italic">
                        "{fav.originalContent}"
                      </p>
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
