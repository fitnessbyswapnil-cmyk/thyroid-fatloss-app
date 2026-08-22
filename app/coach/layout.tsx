import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function CoachLayout({
  children }: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/auth/login")
  }

  // Check if user is a coach or admin
  const { data: client } = await supabase
    .from("clients")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!client || !["coach", "admin"].includes(client.role)) {
    redirect("/dashboard")
  }

  return <>{children}</>
}
