import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AnsweringInterface } from "@/components/answering-interface"
import { getActivePrompts, seedInitialPrompts, getTodayEntryCount } from "@/lib/db/queries"
import { AppNavbar } from "@/components/app-navbar"

export default async function HomePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Ensure prompts exist and fetch them
  await seedInitialPrompts()
  const [prompts, completedCount] = await Promise.all([
    getActivePrompts(),
    getTodayEntryCount(user.id)
  ])

  return (
    <div className="min-h-screen bg-[#FDFCF8]">
      <AppNavbar userEmail={user.email} />
      
      <main className="pt-20 pb-12">
        <AnsweringInterface 
          userEmail={user.email} 
          initialPrompts={prompts} 
          completedCount={completedCount}
        />
      </main>
    </div>
  )
}
