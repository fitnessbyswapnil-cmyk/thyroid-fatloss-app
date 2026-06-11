import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { SettingsView } from "@/components/dashboard/SettingsView"

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: client } = await supabase
    .from("clients")
    .select("full_name, email, consent_at")
    .eq("id", user.id)
    .single()

  return (
    <SettingsView
      fullName={client?.full_name || ""}
      email={client?.email || user.email || ""}
      consentAt={client?.consent_at || null}
    />
  )
}
