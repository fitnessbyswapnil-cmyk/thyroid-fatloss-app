import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

/**
 * Access gate for the entire client dashboard. Clients must have an active
 * subscription (provisioned by the coach after external payment) and a
 * completed profile. Coaches/admins pass through.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: client } = await supabase
    .from("clients")
    .select("role, subscription_status, onboarding_completed")
    .eq("id", user.id)
    .single()

  // No profile row yet — let onboarding create the rest of the flow.
  if (!client) redirect("/onboarding")

  if (client.role === "client") {
    if (client.subscription_status !== "active") redirect("/enroll")
    if (!client.onboarding_completed) redirect("/onboarding")
  }

  return <>{children}</>
}
