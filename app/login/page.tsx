'use client'

import { useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isLogin, setIsLogin] = useState(true) // true = Login, false = Sign Up
  
  // const supabase = createClient() // Move this inside handlers to avoid build-time exec
  
  const handleGoogleLogin = async () => {
    try {
      setIsGoogleLoading(true)
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (error: any) {
      toast.error('Google 登录失败', {
        description: error.message,
      })
      setIsGoogleLoading(false)
    }
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('请输入邮箱和密码')
      return
    }

    try {
      setIsLoading(true)
      
      if (isLogin) {
        // Sign In
        const supabase = createClient()
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        
        toast.success('登录成功')
        window.location.href = '/' // Force reload to update auth state
      } else {
        // Sign Up
        const supabase = createClient()
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })
        if (error) throw error
        
        toast.success('注册成功', {
          description: '请查收您的邮箱以验证账号',
        })
      }
    } catch (error: any) {
      toast.error(isLogin ? '登录失败' : '注册失败', {
        description: error.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full bg-[#FDFCF8] dark:bg-background transition-colors duration-300">
      {/* Left: Auth Form */}
      <div className="flex w-full flex-col justify-center px-8 lg:w-[45%] lg:px-20 xl:px-32 relative">
        <div className="mx-auto w-full max-w-[400px]">
          
          {/* Logo / Brand */}
          <div className="mb-12">
            <h2 className="text-xl font-serif font-medium text-[#5F7368] dark:text-primary transition-colors">Enlightenment Journal</h2>
          </div>

          <div className="space-y-2 mb-8">
            <h1 className="text-3xl font-serif font-medium text-gray-900 dark:text-foreground transition-colors">
              {isLogin ? '欢迎回来' : '创建账号'}
            </h1>
            <p className="text-gray-500 dark:text-muted-foreground text-sm transition-colors">
              {isLogin ? '开启您的觉察之旅' : '开启您的觉察之旅'}
            </p>
          </div>

          <div className="space-y-4">
            {/* Google Login */}
            <Button
              variant="outline"
              className="w-full h-12 bg-white dark:bg-card border-gray-200 dark:border-border hover:bg-gray-50 dark:hover:bg-secondary hover:text-gray-900 dark:hover:text-foreground text-gray-700 dark:text-muted-foreground font-medium rounded-xl shadow-sm transition-all"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading || isLoading}
            >
              {isGoogleLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
              )}
              使用 Google {isLogin ? '登录' : '注册'}
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200 dark:border-border transition-colors" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#FDFCF8] dark:bg-background px-2 text-gray-400 dark:text-muted-foreground transition-colors">或者</span>
              </div>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div className="space-y-4">
                <Input
                  type="email"
                  placeholder="输入您的邮箱"
                  className="h-12 rounded-xl bg-white dark:bg-card dark:text-foreground border-gray-200 dark:border-border focus-visible:ring-[#5F7368] dark:focus-visible:ring-primary focus-visible:border-[#5F7368] dark:focus-visible:border-primary transition-colors"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Input
                  type="password"
                  placeholder="输入密码"
                  className="h-12 rounded-xl bg-white dark:bg-card dark:text-foreground border-gray-200 dark:border-border focus-visible:ring-[#5F7368] dark:focus-visible:ring-primary focus-visible:border-[#5F7368] dark:focus-visible:border-primary transition-colors"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-[#5F7368] dark:bg-primary hover:bg-[#4E6056] dark:hover:bg-primary/90 text-white dark:text-primary-foreground font-medium rounded-xl shadow-lg shadow-[#5F7368]/20 dark:shadow-primary/20 transition-all mt-6"
                disabled={isLoading || isGoogleLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                登录 / 注册
              </Button>
            </form>

            <div className="text-center mt-8">
              <p className="text-xs text-gray-400 dark:text-muted-foreground transition-colors">
                继续即表示您同意 Vilas 的 <a href="#" className="underline hover:text-gray-600 dark:hover:text-muted-foreground">服务条款</a> 和 <a href="#" className="underline hover:text-gray-600 dark:hover:text-muted-foreground">隐私政策</a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Illustration */}
      <div className="hidden lg:flex lg:w-[55%] bg-[#F5F5F0] dark:bg-secondary/30 items-center justify-center relative overflow-hidden transition-colors">
        {/* Background Pattern Grid */}
        <div className="absolute inset-0 opacity-[0.03] text-black dark:text-white" 
             style={{ 
               backgroundImage: 'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)', 
               backgroundSize: '40px 40px' 
             }} 
        />
        
        <div className="relative w-full h-full p-20 flex items-center justify-center">
            {/* Try to load the user provided image, fallback to placeholder if needed, but Next.js Image requires width/height or fill */}
            <div className="relative w-full aspect-square max-w-2xl">
                <Image
                    src="/auth-illustration.png"
                    alt="Enlightenment Illustration"
                    fill
                    className="object-contain"
                    priority
                />
            </div>
        </div>
      </div>
    </div>
  )
}
