import Link from "next/link"
import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react"

const PAYMENT_URL = process.env.NEXT_PUBLIC_PAYMENT_URL || "https://example.com/checkout-placeholder"

const steps = [
  "Tell us about your goals and complete enrollment",
  "Your coach sets up your account and sends an invite",
  "Sign in, build your profile, and start your program",
]

export default function RequestAccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: "#090c14" }}>
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse at center, rgba(45,212,191,0.12) 0%, transparent 70%)", filter: "blur(80px)" }}
      />
      <div className="w-full max-w-lg relative">
        <Link href="/" className="inline-flex items-center gap-2 text-sm mb-6" style={{ color: "#7e8a9e" }}>
          <ArrowLeft size={16} /> Back
        </Link>

        <div className="rounded-2xl p-8" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6" style={{ background: "rgba(45,212,191,0.1)", border: "1px solid rgba(45,212,191,0.2)" }}>
            <Sparkles size={14} style={{ color: "#2dd4bf" }} />
            <span className="text-xs font-medium" style={{ color: "#2dd4bf" }}>By invitation</span>
          </div>

          <h1 className="text-3xl mb-3" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: "italic", color: "#e8eaf0" }}>
            Request your spot
          </h1>
          <p className="text-sm leading-relaxed mb-7" style={{ color: "#7e8a9e" }}>
            ThyroWell is a personalized coaching program with limited spots. Accounts are set up by your coach after enrollment — there's no public sign-up.
          </p>

          <div className="space-y-4 mb-8">
            {steps.map((s, i) => (
              <div key={s} className="flex items-start gap-3">
                <div className="mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold" style={{ background: "rgba(45,212,191,0.15)", color: "#2dd4bf" }}>
                  {i + 1}
                </div>
                <span className="text-sm" style={{ color: "#c9cdd5" }}>{s}</span>
              </div>
            ))}
          </div>

          <a
            href={PAYMENT_URL}
            className="w-full py-4 rounded-2xl font-semibold inline-flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #2dd4bf 0%, #22c55e 100%)", color: "#0a0d14", boxShadow: "0 12px 40px rgba(45,212,191,0.3)" }}
          >
            Start Enrollment
            <ArrowRight size={18} />
          </a>

          <p className="text-sm text-center mt-6" style={{ color: "#7e8a9e" }}>
            Already have an account?{" "}
            <Link href="/auth/login" style={{ color: "#2dd4bf" }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
