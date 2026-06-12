import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { SettingsView } from "@/components/dashboard/SettingsView"

// Top-level (UNGATED) account page so non-active / cancelled clients can still
// export and delete their data — a right that must not depend on subscription.
export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: client } = await supabase
    .from("clients")
    .select("full_name, email, consent_at, subscription_status, role")
    .eq("id", user.id)
    .single()

  const isActive = client?.role !== "client" || client?.subscription_status === "active"

  return (
    <SettingsView
      fullName={client?.full_name || ""}
      email={client?.email || user.email || ""}
      consentAt={client?.consent_at || null}
      isActive={isActive}
    />
  )
}
