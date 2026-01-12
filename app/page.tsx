import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AnsweringInterface } from "@/components/answering-interface"
import { getActivePrompts, getTodayEntryCount } from "@/lib/db/queries"
import { AppNavbar } from "@/components/app-navbar"
import { Suspense } from "react"

export default async function HomePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    // redirect("/login")
  }

  // Ensure prompts exist and fetch them
  const [prompts, completedCount] = await Promise.all([
    getActivePrompts(),
    user ? getTodayEntryCount(user.id) : Promise.resolve(0)
  ])

  return (
    <div className="min-h-screen bg-[#FDFCF8] dark:bg-background transition-colors duration-300">
      <AppNavbar userEmail={user?.email} />
      
      <main className="pt-20 pb-12">
        <Suspense fallback={<div className="flex items-center justify-center h-[50vh] text-gray-400">Loading...</div>}>
          <AnsweringInterface 
            userEmail={user?.email} 
            initialPrompts={prompts} 
            completedCount={completedCount}
          />
        </Suspense>
      </main>
    </div>
  )
}
