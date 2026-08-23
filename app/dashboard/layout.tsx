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

  const { data: client, error } = await supabase
    .from("clients")
    .select("role, subscription_status, onboarding_completed")
    .eq("id", user.id)
    .single()

  // A FAILED QUERY IS NOT A MISSING PROFILE.
  //
  // This used to redirect on any falsy `client`, so a transient database error
  // sent an already-onboarded client back through onboarding — which then
  // rewrote her baseline weight, the denominator of every progress number she
  // will ever see, with no undo. The database now refuses that write too
  // (migration 022), but the redirect itself is still wrong: throw and let the
  // error boundary offer a retry rather than silently restarting her programme.
  // PGRST116 is "no rows", which genuinely means she has no profile yet.
  // Anything else is a real failure and must not be mistaken for one.
  if (error && error.code !== "PGRST116") {
    throw new Error(`Could not load your profile: ${error.message}`)
  }

  // Genuinely no profile row yet — onboarding creates the rest of the flow.
  if (!client) redirect("/onboarding")

  if (client.role === "client") {
    if (client.subscription_status !== "active") redirect("/enroll")
    if (!client.onboarding_completed) redirect("/onboarding")
  }

  return <>{children}</>
}
