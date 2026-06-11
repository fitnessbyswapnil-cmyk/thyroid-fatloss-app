import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { ClientDetailView } from "./client-detail-view"
import { getPlansForClient } from "@/app/actions/plans"

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/auth/login")
  }

  // Fetch client profile
  const { data: client, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !client) {
    notFound()
  }

  // Fetch all checkins
  const { data: checkins } = await supabase
    .from("weekly_checkins")
    .select("*")
    .eq("client_id", id)
    .order("week_number", { ascending: false })

  // Fetch progress photos
  const { data: photos } = await supabase
    .from("progress_photos")
    .select("*")
    .eq("client_id", id)
    .order("created_at", { ascending: false })

  // Fetch all coach insights
  const { data: insights } = await supabase
    .from("coach_insights")
    .select("*")
    .eq("client_id", id)
    .order("created_at", { ascending: false })

  const { meal: mealPlan, workout: workoutPlan } = await getPlansForClient(id)

  return (
    <ClientDetailView
      client={client}
      checkins={checkins || []}
      photos={photos || []}
      insights={insights || []}
      mealPlan={mealPlan}
      workoutPlan={workoutPlan}
      coachId={user.id}
    />
  )
}
