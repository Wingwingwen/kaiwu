'use client'

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Sparkles, History, Star, LogOut, User } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface NavbarProps {
    userEmail?: string
}

export function AppNavbar({ userEmail }: NavbarProps) {
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
            label: "历史",
            icon: History,
            href: "/history",
            active: pathname?.startsWith("/history"),
        },
        {
            label: "收藏",
            icon: Star,
            href: "/favorites",
            active: pathname === "/favorites",
        },
    ]

    return (
        <div className="fixed top-0 left-0 right-0 z-50 bg-[#FDFCF8]/80 backdrop-blur-md border-b border-gray-100 h-16">
            <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
                {/* Left: Logo */}
                <div className="flex items-center gap-2">
                    <span className="font-serif font-bold text-lg text-[#5F7368]">Awaken Entries</span>
                </div>

                {/* Center: Navigation Pills */}
                <div className="hidden md:flex items-center gap-1 bg-white/50 p-1 rounded-full border border-gray-200/50 shadow-sm">
                    {routes.map((route) => (
                        <Link key={route.href} href={route.href}>
                            <Button
                                variant="ghost"
                                size="sm"
                                className={cn(
                                    "rounded-full px-4 py-1.5 h-8 text-sm font-medium transition-all",
                                    route.active 
                                        ? "bg-[#5F7368] text-white hover:bg-[#4E6056] hover:text-white shadow-sm" 
                                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                                )}
                            >
                                <route.icon className="w-3.5 h-3.5 mr-2" />
                                {route.label}
                            </Button>
                        </Link>
                    ))}
                </div>

                {/* Right: User Menu */}
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                                <Avatar className="h-9 w-9 border border-gray-200">
                                    <AvatarImage src="" alt={userEmail} />
                                    <AvatarFallback className="bg-[#E8F3E8] text-[#5F7368]">
                                        {userEmail?.[0].toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">用户</p>
                                    <p className="text-xs leading-none text-muted-foreground">
                                        {userEmail}
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleSignOut} className="text-red-600 cursor-pointer">
                                <LogOut className="mr-2 h-4 w-4" />
                                退出登录
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    )
}
