import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Check, Sparkles, ArrowRight, LogOut } from "lucide-react"
import { getPaymentUrl } from "@/lib/env"

const benefits = [
  "Personalized meal and workout plans built for your thyroid",
  "Weekly check-ins reviewed personally by your coach",
  "Progress photo tracking with before/after comparisons",
  "Direct guidance and encouragement, every step",
]

export default async function EnrollPage() {
  const PAYMENT_URL = getPaymentUrl()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  // Already active? Send them in.
  const { data: client } = await supabase
    .from("clients")
    .select("subscription_status, role, full_name")
    .eq("id", user.id)
    .single()
  if (client && (client.role !== "client" || client.subscription_status === "active")) {
    redirect("/dashboard")
  }

  const firstName = client?.full_name?.split(" ")[0]

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: "#fdfbf7" }}>
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse at center, rgba(21, 94, 86,0.12) 0%, transparent 70%)", filter: "blur(80px)" }}
      />
      <div className="w-full max-w-lg relative">
        <div className="rounded-2xl p-8" style={{ background: "#ffffff", border: "1px solid #e2dbcd" }}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6" style={{ background: "rgba(151, 103, 27,0.1)", border: "1px solid rgba(151, 103, 27,0.2)" }}>
            <Sparkles size={14} style={{ color: "#97671b" }} />
            <span className="text-xs font-medium" style={{ color: "#97671b" }}>Premium Coaching</span>
          </div>

          <h1 className="text-3xl mb-3" style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic", color: "#1c1d20" }}>
            {firstName ? `Welcome, ${firstName}` : "Complete your enrollment"}
          </h1>
          <p className="text-sm leading-relaxed mb-7" style={{ color: "#8b867c" }}>
            Your account is set up. Complete enrollment to unlock your personalized thyroid coaching program and dashboard.
          </p>

          <div className="space-y-3 mb-8">
            {benefits.map((b) => (
              <div key={b} className="flex items-start gap-3">
                <div className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(21, 94, 86,0.15)" }}>
                  <Check size={12} style={{ color: "#155e56" }} />
                </div>
                <span className="text-sm" style={{ color: "#3c3a34" }}>{b}</span>
              </div>
            ))}
          </div>

          <a
            href={PAYMENT_URL}
            className="w-full h-13 py-4 rounded-2xl font-semibold inline-flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #155e56 0%, #155e56 100%)", color: "#fdfbf7", boxShadow: "0 12px 40px rgba(21, 94, 86,0.3)" }}
          >
            Complete Enrollment
            <ArrowRight size={18} />
          </a>
          <p className="text-xs text-center mt-4" style={{ color: "#a09a8e" }}>
            Already paid? Your coach will activate your access shortly.
          </p>
        </div>

        <div className="mt-6 flex items-center justify-center gap-5">
          <Link href="/account" className="text-xs" style={{ color: "#8b867c" }}>
            Manage or delete my data
          </Link>
          <Link href="/auth/login" className="inline-flex items-center gap-2 text-xs" style={{ color: "#8b867c" }}>
            <LogOut size={14} /> Back to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
