'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { BookOpen, History, Star, LogOut, Menu, Sparkles } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    userEmail?: string
}

export function AppSidebar({ className, userEmail }: SidebarProps) {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.refresh()
    }

    const routes = [
        {
            label: "今日觉察",
            icon: Sparkles,
            href: "/",
            active: pathname === "/",
        },
        {
            label: "时光长河",
            icon: History,
            href: "/history",
            active: pathname === "/history",
        },
        {
            label: "收藏",
            icon: Star,
            href: "/favorites",
            active: pathname === "/favorites",
        },
    ]

    return (
        <div className={cn("pb-12 min-h-screen border-r bg-sidebar", className)}>
            <div className="space-y-4 py-4">
                <div className="px-3 py-2">
                    <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight text-[#5F7368]">
                        Awaken Entries
                    </h2>
                    <div className="space-y-1">
                        {routes.map((route) => (
                            <Link
                                key={route.href}
                                href={route.href}
                            >
                                <Button
                                    variant={route.active ? "secondary" : "ghost"}
                                    className={cn(
                                        "w-full justify-start",
                                        route.active && "bg-[#E8F3E8] text-[#5F7368] hover:bg-[#D6E6D6]"
                                    )}
                                >
                                    <route.icon className="mr-2 h-4 w-4" />
                                    {route.label}
                                </Button>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
            <div className="absolute bottom-4 w-full px-3">
                <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500">
                    <div className="truncate flex-1">{userEmail}</div>
                </div>
                <Button 
                    variant="ghost" 
                    className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={handleSignOut}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    退出登录
                </Button>
            </div>
        </div>
    )
}

export function MobileNav({ userEmail }: { userEmail?: string }) {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" className="md:hidden" size="icon">
                    <Menu className="h-5 w-5" />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
                <AppSidebar userEmail={userEmail} />
            </SheetContent>
        </Sheet>
    )
}
