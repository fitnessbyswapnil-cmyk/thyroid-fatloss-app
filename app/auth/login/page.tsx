"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { Eye, EyeOff, Loader2, ArrowRight } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [linkSent, setLinkSent] = useState(false)
  const [sendingLink, setSendingLink] = useState(false)

  /**
   * A client who arrived by invite never chose a password, so "Forgot your
   * password?" does not describe her situation and she will not read it as the
   * way in. This sends her a fresh sign-in link instead.
   */
  const emailSignInLink = async () => {
    if (!email.trim()) {
      setError("Enter your email first and we'll send you a link.")
      return
    }
    setSendingLink(true)
    setError(null)
    const supabase = createClient()
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
    })
    setSendingLink(false)
    // Deliberately the same message whether or not the address is registered —
    // otherwise this page tells a stranger who is a client here.
    if (err) setError("Could not send the link just now. Please try again in a moment.")
    else setLinkSent(true)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setIsLoading(false)
      return
    }

    router.push("/dashboard")
    router.refresh()
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "#090c14" }}
    >
      {/* Ambient glow */}
      <div 
        className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(45, 212, 191, 0.08) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md relative"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 
            className="text-3xl font-bold mb-2"
            style={{ 
              fontFamily: "'Instrument Serif', Georgia, serif",
              fontStyle: "italic",
              color: "#e8eaf0"
            }}
          >
            ThyroWell
          </h1>
          <p style={{ color: "#7e8a9e", fontSize: 14 }}>
            Welcome back to your wellness journey
          </p>
        </div>

        {/* Login Card */}
        <div
          className="p-8 rounded-3xl"
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.06)",
            backdropFilter: "blur(24px)",
          }}
        >
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Input */}
            <div>
              <label 
                htmlFor="email" 
                className="block text-xs font-medium uppercase mb-2"
                style={{ color: "#7e8a9e", letterSpacing: "0.08em" }}
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3.5 rounded-xl text-sm transition-all duration-300 focus:outline-none"
                style={{
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  color: "#e8eaf0",
                }}
                placeholder="you@example.com"
              />
            </div>

            {/* Password Input */}
            <div>
              <label 
                htmlFor="password" 
                className="block text-xs font-medium uppercase mb-2"
                style={{ color: "#7e8a9e", letterSpacing: "0.08em" }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3.5 rounded-xl text-sm transition-all duration-300 focus:outline-none pr-12"
                  style={{
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    color: "#e8eaf0",
                  }}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "#7e8a9e" }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Two ways back in. The emailed link is first because a client who
                joined by invite has no password to have forgotten. */}
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={emailSignInLink}
                disabled={sendingLink || linkSent}
                className="text-xs transition-colors hover:underline text-left"
                style={{ color: linkSent ? "#34d399" : "#2dd4bf" }}
              >
                {sendingLink
                  ? "Sending…"
                  : linkSent
                    ? "Link sent — check your email"
                    : "Email me a sign-in link instead"}
              </button>
              <Link
                href="/auth/forgot-password"
                className="text-xs transition-colors hover:underline shrink-0"
                style={{ color: "#7e8a9e" }}
              >
                Reset password
              </Link>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-lg text-sm"
                style={{ 
                  background: "rgba(239, 68, 68, 0.1)", 
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                  color: "#fca5a5"
                }}
              >
                {error}
              </motion.div>
            )}

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all duration-300"
              style={{
                background: "linear-gradient(135deg, #2dd4bf 0%, #22c55e 100%)",
                color: "#0a0d14",
                boxShadow: "0 8px 32px rgba(45, 212, 191, 0.25)",
              }}
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  Sign In
                  <ArrowRight size={16} />
                </>
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px" style={{ background: "rgba(255, 255, 255, 0.06)" }} />
            <span className="text-xs" style={{ color: "#7e8a9e" }}>or</span>
            <div className="flex-1 h-px" style={{ background: "rgba(255, 255, 255, 0.06)" }} />
          </div>

          {/* Request access link */}
          <p className="text-center text-sm" style={{ color: "#7e8a9e" }}>
            New to ThyroWell?{" "}
            <Link
              href="/request-access"
              className="font-medium transition-colors hover:underline"
              style={{ color: "#2dd4bf" }}
            >
              Request your spot
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs mt-6" style={{ color: "#404858" }}>
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </motion.div>
    </div>
  )
}
