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
      style={{ background: "#090c14", paddingBottom: "calc(100px + env(safe-area-inset-bottom, 24px))" }}
    >
      <header
        className="sticky top-0 z-40 px-6 py-4"
        style={{
          background: "rgba(9, 12, 20, 0.8)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
        }}
      >
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link href="/dashboard" className="p-2 -ml-2 rounded-lg" style={{ color: "#7e8a9e" }}>
            <ArrowLeft size={20} />
          </Link>
          <h1
            className="text-2xl"
            style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: "italic", color: "#e8eaf0" }}
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
