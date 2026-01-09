'use client'

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Sparkles, History, PenLine, LogOut, User, Sun, Moon } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useTheme } from "next-themes"
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
    const { theme, setTheme } = useTheme()

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
            label: "探索洞察",
            icon: History,
            href: "/history",
            active: pathname?.startsWith("/history"),
        },
    ]

    return (
        <div className="fixed top-0 left-0 right-0 z-50 bg-[#FDFCF8]/80 dark:bg-background/80 backdrop-blur-md border-b border-gray-100 dark:border-border h-16 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
                {/* Left: Logo */}
                <div className="flex items-center gap-2">
                    <span className="font-serif font-bold text-lg text-[#5F7368] dark:text-primary transition-colors">Awaken Entries</span>
                </div>

                {/* Center: Navigation Pills */}
                <div className="hidden md:flex items-center gap-1 bg-white/50 dark:bg-secondary/20 p-1 rounded-full border border-gray-200/50 dark:border-border/50 shadow-sm transition-colors">
                    {routes.map((route) => (
                        <Link key={route.href} href={route.href}>
                            <Button
                                variant="ghost"
                                size="sm"
                                className={cn(
                                    "rounded-full px-4 py-1.5 h-8 text-sm font-medium transition-all",
                                    route.active 
                                        ? "bg-[#5F7368] dark:bg-primary text-white dark:text-primary-foreground shadow-sm" 
                                        : "text-gray-500 dark:text-muted-foreground hover:text-gray-900 dark:hover:text-foreground hover:bg-gray-100 dark:hover:bg-secondary"
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
                    {/* Free Write Button (New) */}
                    <Link href="/?mode=free">
                        <Button 
                            className="bg-[#637369] hover:bg-[#526058] text-white dark:bg-[#637369] dark:hover:bg-[#526058] dark:text-white rounded-full mr-2 hidden md:flex items-center gap-2 shadow-sm transition-all hover:scale-105"
                        >
                            <PenLine className="w-4 h-4" />
                            自由记录
                        </Button>
                    </Link>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        className="rounded-full text-gray-500 hover:text-gray-900 dark:text-muted-foreground dark:hover:text-foreground mr-2"
                    >
                        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                        <span className="sr-only">切换主题</span>
                    </Button>

                    {userEmail ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                                    <Avatar className="h-9 w-9 border border-gray-200 dark:border-border">
                                        <AvatarImage src="" alt={userEmail} />
                                        <AvatarFallback className="bg-[#E8F3E8] dark:bg-secondary text-[#5F7368] dark:text-primary">
                                            {userEmail[0].toUpperCase()}
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
                    ) : (
                        <Link href="/login">
                            <Button variant="default" className="bg-[#5F7368] hover:bg-[#4E6056] dark:bg-primary dark:hover:bg-primary/90 text-white dark:text-primary-foreground">
                                登录
                            </Button>
                        </Link>
                    )}
                </div>
            </div>
        </div>
    )
}
