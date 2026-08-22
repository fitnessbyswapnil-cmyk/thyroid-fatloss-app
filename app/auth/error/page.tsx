import Link from "next/link"
import { AlertTriangle } from "lucide-react"

export const metadata = { title: "Link problem · ThyroWell" }

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#F4F0E8" }}>
      <div className="w-full max-w-md text-center">
        <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ background: "rgba(154, 59, 46,0.12)" }}>
          <AlertTriangle size={28} style={{ color: "#A32B23" }} />
        </div>
        <h1 className="text-2xl mb-3" style={{ fontFamily: "'Newsreader', Georgia, serif",  color: "#1c1d20" }}>
          This link didn't work
        </h1>
        <p className="text-sm leading-relaxed mb-8" style={{ color: "#8b867c" }}>
          Your sign-in or invite link may have expired or already been used. Ask your coach to
          resend your invite, or try signing in again.
        </p>
        <Link
          href="/auth/login"
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-medium text-sm"
          style={{ background: "linear-gradient(135deg, #155e56 0%, #155e56 100%)", color: "#F6F3ED" }}
        >
          Back to sign in
        </Link>
      </div>
    </div>
  )
}
