'use client'

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Sparkles, History, PenLine, LogOut, User, Sun, Moon, Menu, Settings, Heart, Plus } from "lucide-react"
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
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"

interface NavbarProps {
    userEmail?: string
}

export function AppNavbar({ userEmail }: NavbarProps) {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()
    const { theme, setTheme } = useTheme()
    const [isOpen, setIsOpen] = useState(false)

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
                {/* Left: Hamburger & Logo */}
                <div className="flex items-center gap-4">
                    <Sheet open={isOpen} onOpenChange={setIsOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="-ml-2 hover:bg-stone-100 dark:hover:bg-secondary/50">
                                <Menu className="h-5 w-5 text-[#5C7A63] dark:text-primary" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[280px] p-0">
                            <div className="flex flex-col h-full bg-[#FDFCF8] dark:bg-background">
                                {/* Sidebar Header */}
                                <div className="p-6 border-b border-stone-100 dark:border-border">
                                    <div className="flex items-center gap-2 mb-6">
                                        <div className="w-8 h-8 rounded-full bg-[#5C7A63] flex items-center justify-center text-white font-serif font-bold">
                                            A
                                        </div>
                                        <span className="font-serif font-bold text-lg text-[#5C7A63] dark:text-primary">Awaken</span>
                                    </div>
                                    <div className="space-y-1">
                                         {routes.map((route) => (
                                            <Link key={route.href} href={route.href} onClick={() => setIsOpen(false)}>
                                                <Button
                                                    variant="ghost"
                                                    className={cn(
                                                        "w-full justify-start text-base font-medium",
                                                        route.active 
                                                            ? "bg-[#F0F5F2] dark:bg-primary/20 text-[#5C7A63] dark:text-primary" 
                                                            : "text-stone-600 dark:text-muted-foreground hover:bg-stone-100 dark:hover:bg-secondary/50"
                                                    )}
                                                >
                                                    <route.icon className="w-5 h-5 mr-3" />
                                                    {route.label}
                                                </Button>
                                            </Link>
                                        ))}
                                    </div>
                                </div>

                                {/* Sidebar Middle - Insights & Features */}
                                <div className="flex-1 p-6 overflow-y-auto">
                                    <h3 className="text-xs font-semibold text-stone-400 dark:text-muted-foreground uppercase tracking-wider mb-4">功能与洞察</h3>
                                    <div className="space-y-1">
                                        <Button 
                                            variant="ghost" 
                                            className="w-full justify-start text-stone-600 dark:text-muted-foreground hover:bg-stone-100 dark:hover:bg-secondary/50"
                                            onClick={() => {
                                                setIsOpen(false)
                                                if (pathname === '/') {
                                                    window.dispatchEvent(new Event('trigger-free-write'))
                                                } else {
                                                    router.push('/?mode=free')
                                                }
                                            }}
                                        >
                                            <PenLine className="w-5 h-5 mr-3" />
                                            自由记录
                                        </Button>
                                        <Button variant="ghost" className="w-full justify-start text-stone-600 dark:text-muted-foreground hover:bg-stone-100 dark:hover:bg-secondary/50">
                                            <Heart className="w-5 h-5 mr-3" />
                                            我的收藏
                                        </Button>
                                        <Button variant="ghost" className="w-full justify-start text-stone-600 dark:text-muted-foreground hover:bg-stone-100 dark:hover:bg-secondary/50">
                                            <Settings className="w-5 h-5 mr-3" />
                                            偏好设置
                                        </Button>
                                    </div>
                                </div>

                                {/* Sidebar Footer */}
                                <div className="p-6 border-t border-stone-100 dark:border-border bg-stone-50/50 dark:bg-secondary/20">
                                    <div className="flex items-center gap-3 mb-4">
                                        <Avatar className="h-10 w-10 border border-stone-200 dark:border-border">
                                            <AvatarImage src="" />
                                            <AvatarFallback className="bg-[#5C7A63] text-white">ME</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-stone-900 dark:text-foreground truncate">
                                                {userEmail || '我的账号'}
                                            </p>
                                            <p className="text-xs text-stone-500 dark:text-muted-foreground">免费计划</p>
                                        </div>
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 h-9"
                                        onClick={handleSignOut}
                                    >
                                        <LogOut className="w-4 h-4 mr-2" />
                                        退出登录
                                    </Button>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                    
                    <span className="font-serif font-bold text-lg text-[#5C7A63] dark:text-primary transition-colors hidden md:inline-block">Awaken Entries</span>
                </div>

                {/* Center: Navigation Pills (Hidden) */}
                <div className="hidden" />

                {/* Right: User Menu */}
                <div className="flex items-center gap-2">
                    {/* Free Write Button (Removed - moved to floating button) */}

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
                        <div className="flex items-center gap-3">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                                        <Avatar className="h-9 w-9 border border-gray-200 dark:border-border">
                                            <AvatarImage src="" alt={userEmail} />
                                            <AvatarFallback className="bg-[#FCF8EB] dark:bg-secondary text-[#D8B064] dark:text-primary">
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

                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                    if (pathname === '/') {
                                        window.dispatchEvent(new Event('trigger-free-write'))
                                    } else {
                                        router.push('/?mode=free')
                                    }
                                }}
                                className="rounded-full bg-[#5C7A63] text-white hover:bg-[#4A6350] hover:text-white h-9 w-9 shadow-sm"
                            >
                                <Plus className="h-5 w-5" />
                            </Button>
                        </div>
                    ) : (
                        <Link href="/login">
                            <Button variant="ghost" size="sm">登录</Button>
                        </Link>
                    )}
                </div>
            </div>
        </div>
    )
}
