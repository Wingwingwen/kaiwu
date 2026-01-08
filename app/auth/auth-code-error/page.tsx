'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

function ErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FDFCF8] dark:bg-background p-4 text-center transition-colors">
      <h1 className="mb-4 text-2xl font-serif font-bold text-[#5F7368] dark:text-primary transition-colors">登录遇到问题</h1>
      <p className="mb-8 text-gray-600 dark:text-muted-foreground transition-colors">
        验证您的登录请求时发生了错误。
        {error && <span className="block mt-2 text-sm text-red-500">错误信息: {error}</span>}
      </p>
      <Link href="/login">
        <Button className="bg-[#5F7368] dark:bg-primary hover:bg-[#4E6056] dark:hover:bg-primary/90 text-white dark:text-primary-foreground transition-colors">
          返回登录页
        </Button>
      </Link>
    </div>
  )
}

export default function AuthCodeError() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#FDFCF8] dark:bg-background transition-colors">
        <div className="text-gray-600 dark:text-muted-foreground">加载中...</div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  )
}
