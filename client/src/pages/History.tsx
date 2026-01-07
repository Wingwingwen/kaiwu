import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ThemeSelector } from "@/components/ThemeSelector";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getLoginUrl } from "@/const";
import { useTheme } from "@/contexts/ThemeContext";
import { trpc } from "@/lib/trpc";
import { 
  ArrowLeft, 
  BookOpen, 
  Calendar, 
  Edit3, 
  Moon, 
  Sparkles, 
  Sun, 
  Trash2,
  X
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { useState } from "react";

type JournalEntry = {
  id: number;
  content: string;
  category: "gratitude" | "philosophical";
  isDraft: boolean;
  sageInsights: string | null;
  createdAt: Date;
};

type SageInsight = {
  key: string;
  sage: string;
  emoji: string;
  style: string;
  insight: string;
};

export default function History() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  
  const { data: entries, isLoading, refetch } = trpc.journal.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const deleteMutation = trpc.journal.delete.useMutation({
    onSuccess: () => {
      toast.success("日记已删除");
      refetch();
    },
    onError: () => toast.error("删除失败，请重试"),
  });

  // Require auth
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 ambient-bg">
        <div className="text-center">
          <h2 className="text-2xl font-serif font-semibold mb-4">请先登录</h2>
          <p className="text-muted-foreground mb-6">登录后即可查看你的感恩日记</p>
          <Button asChild className="btn-glow">
            <a href={getLoginUrl()}>登录</a>
          </Button>
        </div>
      </div>
    );
  }

  const completedEntries = entries?.filter(e => !e.isDraft) || [];
  const draftEntries = entries?.filter(e => e.isDraft) || [];

  // Parse sage insights from JSON
  const parseSageInsights = (sageInsightsJson: string | null): SageInsight[] => {
    if (!sageInsightsJson || sageInsightsJson === "null") return [];
    try {
      return JSON.parse(sageInsightsJson);
    } catch (e) {
      return [];
    }
  };

  return (
    <div className="min-h-screen relative ambient-bg">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" className="rounded-full icon-glow">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="font-serif font-semibold">历史记录</h1>
              <p className="text-xs text-muted-foreground">
                共 {completedEntries.length} 篇日记
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeSelector />
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full icon-glow">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Link href="/write">
              <Button size="sm" className="gap-2 btn-glow rounded-full">
                <Edit3 className="w-4 h-4" />
                新日记
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-4xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">加载中...</p>
          </div>
        ) : entries?.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-serif font-semibold mb-2">还没有日记</h3>
            <p className="text-muted-foreground mb-6">开始你的第一篇感恩日记吧</p>
            <Link href="/write">
              <Button className="gap-2 btn-primary">
                <Edit3 className="w-4 h-4" />
                开始写作
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Drafts section */}
            {draftEntries.length > 0 && (
              <section>
                <h2 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary/60" />
                  草稿 ({draftEntries.length})
                </h2>
                <div className="space-y-4">
                  {draftEntries.map((entry) => (
                    <EntryCard 
                      key={entry.id} 
                      entry={entry} 
                      onDelete={() => deleteMutation.mutate({ id: entry.id })}
                      onClick={() => setSelectedEntry(entry)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Completed entries */}
            {completedEntries.length > 0 && (
              <section>
                <h2 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-accent" />
                  已完成 ({completedEntries.length})
                </h2>
                <div className="space-y-4">
                  {completedEntries.map((entry) => (
                    <EntryCard 
                      key={entry.id} 
                      entry={entry} 
                      onDelete={() => deleteMutation.mutate({ id: entry.id })}
                      onClick={() => setSelectedEntry(entry)}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      {/* Entry Detail Dialog */}
      <Dialog open={!!selectedEntry} onOpenChange={(open) => !open && setSelectedEntry(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-3">
              <span className="font-serif">日记详情</span>
              {selectedEntry && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  selectedEntry.category === "gratitude" 
                    ? "bg-primary/10 text-primary" 
                    : "bg-accent/10 text-accent"
                }`}>
                  {selectedEntry.category === "gratitude" ? "感恩" : "哲思"}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {selectedEntry && (
            <div className="flex-1 overflow-y-auto space-y-6">
              {/* Date */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                {format(new Date(selectedEntry.createdAt), "yyyy年M月d日 HH:mm", { locale: zhCN })}
              </div>

              {/* Content */}
              <div className="bg-muted/30 rounded-xl p-4">
                <p className="font-serif text-base leading-relaxed whitespace-pre-wrap">
                  {selectedEntry.content}
                </p>
              </div>

              {/* Sage Insights */}
              {selectedEntry.sageInsights && selectedEntry.sageInsights !== "null" && (
                <div className="space-y-4">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    智者启示
                  </h4>
                  <div className="space-y-3">
                    {parseSageInsights(selectedEntry.sageInsights).map((sage) => (
                      <div 
                        key={sage.key} 
                        className="p-4 rounded-xl bg-muted/20 border border-border/30"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">{sage.emoji}</span>
                          <h5 className="font-medium">{sage.sage}</h5>
                        </div>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                          {sage.insight}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                <Link href={`/write/${selectedEntry.id}`}>
                  <Button variant="outline" size="sm" className="gap-2 rounded-full">
                    <Edit3 className="w-4 h-4" />
                    编辑
                  </Button>
                </Link>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 rounded-full text-destructive hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                      删除
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="floating-panel">
                    <AlertDialogHeader>
                      <AlertDialogTitle>确认删除</AlertDialogTitle>
                      <AlertDialogDescription>
                        此操作无法撤销，确定要删除这篇日记吗？
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-full">取消</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => {
                          deleteMutation.mutate({ id: selectedEntry.id });
                          setSelectedEntry(null);
                        }} 
                        className="rounded-full"
                      >
                        删除
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

type EntryCardProps = {
  entry: JournalEntry;
  onDelete: () => void;
  onClick: () => void;
};

function EntryCard({ entry, onDelete, onClick }: EntryCardProps) {
  const hasInsights = entry.sageInsights && entry.sageInsights !== "null";
  
  return (
    <div 
      className="card-glow p-5 rounded-xl bg-card group cursor-pointer hover:bg-card/80 transition-colors"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Meta info */}
          <div className="flex items-center gap-3 mb-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {format(new Date(entry.createdAt), "yyyy年M月d日 HH:mm", { locale: zhCN })}
            </span>
            <span className={`px-2 py-0.5 rounded-full ${
              entry.category === "gratitude" 
                ? "bg-primary/10 text-primary" 
                : "bg-accent/10 text-accent"
            }`}>
              {entry.category === "gratitude" ? "感恩" : "哲思"}
            </span>
            {hasInsights && (
              <span className="flex items-center gap-1 text-primary">
                <Sparkles className="w-3 h-3" />
                有启示
              </span>
            )}
          </div>

          {/* Content preview */}
          <p className="font-serif text-sm leading-relaxed line-clamp-3">
            {entry.content}
          </p>
        </div>

        {/* Actions */}
        <div 
          className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <Link href={`/write/${entry.id}`}>
            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 icon-glow">
              <Edit3 className="w-4 h-4" />
            </Button>
          </Link>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 text-destructive hover:text-destructive icon-glow">
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="floating-panel">
              <AlertDialogHeader>
                <AlertDialogTitle>确认删除</AlertDialogTitle>
                <AlertDialogDescription>
                  此操作无法撤销，确定要删除这篇日记吗？
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-full">取消</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete} className="rounded-full">删除</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
