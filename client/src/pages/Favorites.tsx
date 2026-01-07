import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Heart, Trash2, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

// Sage info mapping
const sageInfo: Record<string, { emoji: string; color: string }> = {
  confucius: { emoji: "📜", color: "text-amber-600" },
  laozi: { emoji: "☯️", color: "text-purple-500" },
  buddha: { emoji: "🙏", color: "text-yellow-600" },
  plato: { emoji: "🏛️", color: "text-blue-500" },
};

const sageNames: Record<string, string> = {
  confucius: "孔子",
  laozi: "老子",
  buddha: "释迦牟尼",
  plato: "柏拉图",
};

export default function Favorites() {
  const { isAuthenticated } = useAuth();
  const { data: favorites, isLoading, refetch } = trpc.sage.getFavorites.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  
  const removeFavoriteMutation = trpc.sage.removeFavorite.useMutation();

  const handleRemove = async (id: number) => {
    try {
      await removeFavoriteMutation.mutateAsync({ id });
      refetch();
      toast.success("已取消收藏");
    } catch (error) {
      toast.error("操作失败");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center p-8">
          <Heart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-medium mb-2">登录后查看收藏</h2>
          <p className="text-muted-foreground mb-4">收藏的智者启示将保存在这里</p>
          <Button asChild variant="outline" className="rounded-full">
            <a href={getLoginUrl()}>登录</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 bg-background/95 backdrop-blur-md border-b border-border z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/">
            <button className="p-2 rounded-full hover:bg-muted transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <h1 className="text-lg font-medium">我的收藏</h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : favorites && favorites.length > 0 ? (
          <div className="space-y-4">
            {favorites.map((fav) => {
              const sageData = sageInfo[fav.sage] || { emoji: "✨", color: "text-foreground" };
              const sageName = sageNames[fav.sage] || fav.sage;
              
              return (
                <div 
                  key={fav.id}
                  className="bg-card rounded-2xl p-5 border border-border/50 relative group"
                >
                  {/* Sage header */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">{sageData.emoji}</span>
                    <span className={`font-medium ${sageData.color}`}>{sageName}</span>
                  </div>
                  
                  {/* Content */}
                  <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                    {fav.content}
                  </p>
                  
                  {/* Footer */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/30">
                    <span className="text-xs text-muted-foreground">
                      {new Date(fav.createdAt).toLocaleDateString('zh-CN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    
                    <button
                      onClick={() => handleRemove(fav.id)}
                      className="p-2 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <Heart className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <h2 className="text-lg font-medium mb-2">暂无收藏</h2>
            <p className="text-sm text-muted-foreground">
              在写作时点击智者启示旁的心形按钮即可收藏
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
