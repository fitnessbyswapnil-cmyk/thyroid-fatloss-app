import { createClient } from "@/lib/supabase/server"
import { getAuthUser } from "@/lib/supabase/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getPlansForClient } from "@/app/actions/plans"
import { PlanCard } from "@/components/dashboard/PlanCard"
import { BottomNavPill } from "@/components/dashboard/BottomNavPill"

export default async function PlansPage() {
  const supabase = await createClient()
  const user = await getAuthUser(supabase)
  if (!user) redirect("/auth/login")

  const { meal, workout } = await getPlansForClient(user.id)

  return (
    <div
      className="min-h-screen"
      style={{ background: "#F4F0E8", paddingBottom: "calc(100px + env(safe-area-inset-bottom, 24px))" }}
    >
      <header
        className="sticky top-0 z-40 px-6 py-4"
        style={{
          background: "rgba(253, 251, 247, 0.85)", 
          borderBottom: "1px solid #e2dbcd" }}
      >
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link href="/dashboard" className="p-2 -ml-2 rounded-lg" style={{ color: "#8b867c" }}>
            <ArrowLeft size={20} />
          </Link>
          <h1
            className="text-2xl"
            style={{ fontFamily: "'Newsreader', Georgia, serif",  color: "#1c1d20" }}
          >
            Your Plans
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-5">
        <PlanCard type="meal" plan={meal} />
        <PlanCard type="workout" plan={workout} />
      </main>

      <BottomNavPill />
    </div>
  )
}
