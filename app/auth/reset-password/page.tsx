"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { Eye, EyeOff, Loader2, Check, ArrowRight } from "lucide-react"

// The password-recovery email link routes through /auth/callback (which
// exchanges the code for a session) with next=/auth/reset-password, so by the
// time the user lands here they have an active recovery session and can set a
// new password via updateUser.
export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }
    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setIsLoading(false)
      return
    }

    setDone(true)
    setTimeout(() => {
      router.push("/dashboard")
      router.refresh()
    }, 1500)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#090c14" }}>
      <div
        className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(45,212,191,0.08) 0%, transparent 70%)", filter: "blur(60px)" }}
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md relative"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: "italic", color: "#e8eaf0" }}>
            Set a new password
          </h1>
          <p style={{ color: "#7e8a9e", fontSize: 14 }}>Choose a new password for your account.</p>
        </div>

        <div className="p-8 rounded-3xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(24px)" }}>
          {done ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "rgba(45,212,191,0.15)" }}>
                <Check size={28} style={{ color: "#2dd4bf" }} />
              </div>
              <p className="text-sm" style={{ color: "#c9cdd5" }}>Password updated. Taking you in…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="password" className="block text-xs font-medium uppercase mb-2" style={{ color: "#7e8a9e", letterSpacing: "0.08em" }}>
                  New password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3.5 rounded-xl text-sm focus:outline-none pr-12"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#e8eaf0" }}
                    placeholder="At least 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                    style={{ color: "#7e8a9e" }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg text-sm" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5" }}>
                  {error}
                </div>
              )}

              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #2dd4bf 0%, #22c55e 100%)", color: "#0a0d14", boxShadow: "0 8px 32px rgba(45,212,191,0.25)" }}
              >
                {isLoading ? <Loader2 className="animate-spin" size={18} /> : <>Update password <ArrowRight size={16} /></>}
              </motion.button>
            </form>
          )}
        </div>

        <p className="text-center text-sm mt-6" style={{ color: "#7e8a9e" }}>
          <Link href="/auth/login" style={{ color: "#2dd4bf" }}>Back to sign in</Link>
        </p>
      </motion.div>
    </div>
  )
}
