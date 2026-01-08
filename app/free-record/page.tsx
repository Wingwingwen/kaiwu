import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AppNavbar } from "@/components/app-navbar"
import { AnsweringInterface } from "@/components/answering-interface"

export default async function FreeRecordPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-[#FDFCF8]">
      <AppNavbar userEmail={user.email} />
      
      <main className="pt-20 pb-12">
        <AnsweringInterface 
          userEmail={user.email} 
          mode="free"
        />
      </main>
    </div>
  )
}
