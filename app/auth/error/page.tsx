import Link from "next/link"
import { AlertTriangle } from "lucide-react"
import { FragmentRescue } from "./fragment-rescue"

export const metadata = { title: "Link problem · ThyroWell" }

export default function AuthErrorPage() {
  return (
    <FragmentRescue>
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#090c14" }}>
      <div className="w-full max-w-md text-center">
        <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ background: "rgba(239,68,68,0.12)" }}>
          <AlertTriangle size={28} style={{ color: "#fb7185" }} />
        </div>
        <h1 className="text-2xl mb-3" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: "italic", color: "#e8eaf0" }}>
          This link didn't work
        </h1>
        <p className="text-sm leading-relaxed mb-8" style={{ color: "#7e8a9e" }}>
          Your sign-in or invite link may have expired or already been used. Ask your coach to
          resend your invite, or try signing in again.
        </p>
        <Link
          href="/auth/login"
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-medium text-sm"
          style={{ background: "linear-gradient(135deg, #2dd4bf 0%, #22c55e 100%)", color: "#0a0d14" }}
        >
          Back to sign in
        </Link>
      </div>
    </div>
    </FragmentRescue>
  )
}
