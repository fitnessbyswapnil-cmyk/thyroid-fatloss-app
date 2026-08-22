import Link from "next/link"
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react"
import { getPaymentUrl } from "@/lib/env"

// Runtime-evaluated so the env check fires per request (and fails loudly in
// production if NEXT_PUBLIC_PAYMENT_URL is unset) instead of baking a build-time value.
export const dynamic = "force-dynamic"

const steps = [
  "Tell us about your goals and complete enrollment",
  "Your coach sets up your account and sends an invite",
  "Sign in, build your profile, and start your program",
]

export default function RequestAccessPage() {
  const PAYMENT_URL = getPaymentUrl()
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: "#F4F0E8" }}>
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse at center, rgba(21, 94, 86,0.12) 0%, transparent 70%)", filter: "blur(80px)" }}
      />
      <div className="w-full max-w-lg relative">
        <Link href="/" className="inline-flex items-center gap-2 text-sm mb-6" style={{ color: "#8b867c" }}>
          <ArrowLeft size={16} /> Back
        </Link>

        <div className="rounded-2xl p-8" style={{ background: "#FDFBF7", border: "1px solid #e2dbcd" }}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6" style={{ background: "rgba(21, 94, 86,0.1)", border: "1px solid rgba(21, 94, 86,0.2)" }}>
            <Sparkles size={14} style={{ color: "#155e56" }} />
            <span className="text-xs font-medium" style={{ color: "#155e56" }}>By invitation</span>
          </div>

          <h1 className="text-3xl mb-3" style={{ fontFamily: "'Newsreader', Georgia, serif",  color: "#1c1d20" }}>
            Request your spot
          </h1>
          <p className="text-sm leading-relaxed mb-7" style={{ color: "#8b867c" }}>
            ThyroWell is a personalized coaching program with limited spots. Accounts are set up by your coach after enrollment — there's no public sign-up.
          </p>

          <div className="space-y-4 mb-8">
            {steps.map((s, i) => (
              <div key={s} className="flex items-start gap-3">
                <div className="mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold" style={{ background: "rgba(21, 94, 86,0.15)", color: "#155e56" }}>
                  {i + 1}
                </div>
                <span className="text-sm" style={{ color: "#3c3a34" }}>{s}</span>
              </div>
            ))}
          </div>

          <a
            href={PAYMENT_URL}
            className="w-full py-4 rounded-2xl font-semibold inline-flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #155e56 0%, #155e56 100%)", color: "#F6F3ED", boxShadow: "0 12px 40px rgba(21, 94, 86,0.3)" }}
          >
            Start Enrollment
            <ArrowRight size={18} />
          </a>

          <p className="text-sm text-center mt-6" style={{ color: "#8b867c" }}>
            Already have an account?{" "}
            <Link href="/auth/login" style={{ color: "#155e56" }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
