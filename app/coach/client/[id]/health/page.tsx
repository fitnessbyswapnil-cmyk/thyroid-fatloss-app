import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getHealthProfile, listLabs } from "@/app/actions/health"
import { HealthView } from "@/components/health/HealthView"

// Coach view of a client's thyroid profile + labs (RLS coach policy allows all).
export default async function CoachClientHealthPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")
  const { data: me } = await supabase.from("clients").select("role").eq("id", user.id).single()
  if (!me || (me.role !== "coach" && me.role !== "admin")) redirect("/dashboard")

  const { data: client } = await supabase.from("clients").select("full_name").eq("id", id).single()
  const [profile, labs] = await Promise.all([getHealthProfile(id), listLabs(id)])
  return <HealthView profile={profile} labs={labs} clientId={id} clientName={client?.full_name || "Client"} asCoach />
}
