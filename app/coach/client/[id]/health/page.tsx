import { createClient } from "@/lib/supabase/server"
import { getAuthUser } from "@/lib/supabase/auth"
import { redirect } from "next/navigation"
import { getHealthProfile, listLabs } from "@/app/actions/health"
import { HealthView } from "@/components/health/HealthView"

// Coach view of a client's thyroid profile + labs (RLS coach policy allows all).
export default async function CoachClientHealthPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  // getAuthUser verifies the token locally; getUser() spent an Auth-server round
  // trip re-checking what the proxy had already checked on this same request.
  const user = await getAuthUser(supabase)
  if (!user) redirect("/auth/login")

  // One batch. The role check, the client's name and the health data were four
  // awaits in a row — four Mumbai→Singapore round trips before anything
  // rendered — and none of them needs a result from the others.
  //
  // Fetching the labs alongside the role check rather than after it is safe:
  // RLS decides what comes back, so a non-coach gets nothing regardless, and
  // the redirect below fires before any of it reaches a component.
  const [{ data: me }, { data: client }, profile, labs] = await Promise.all([
    supabase.from("clients").select("role").eq("id", user.id).single(),
    supabase.from("clients").select("full_name").eq("id", id).single(),
    getHealthProfile(id),
    listLabs(id),
  ])

  if (!me || (me.role !== "coach" && me.role !== "admin")) redirect("/dashboard")

  return <HealthView profile={profile} labs={labs} clientId={id} clientName={client?.full_name || "Client"} asCoach />
}
