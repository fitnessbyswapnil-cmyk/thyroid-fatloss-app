import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getHealthProfile, listLabs } from "@/app/actions/health"
import { HealthView } from "@/components/health/HealthView"

// Client's own thyroid profile + lab tracking.
export default async function HealthPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const [profile, labs] = await Promise.all([getHealthProfile(), listLabs()])
  return <HealthView profile={profile} labs={labs} />
}
