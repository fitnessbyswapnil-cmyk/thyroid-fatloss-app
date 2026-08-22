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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password })

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
      style={{ background: "#F4F0E8" }}
    >
      {/* Ambient glow */}
      <div 
        className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(21, 94, 86, 0.13) 0%, transparent 70%)",
          filter: "blur(60px)" }}
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
              fontFamily: "'Newsreader', Georgia, serif", 
              color: "#1c1d20"
            }}
          >
            ThyroWell
          </h1>
          <p style={{ color: "#8b867c", fontSize: 14 }}>
            Welcome back to your wellness journey
          </p>
        </div>

        {/* Login Card */}
        <div
          className="p-8 rounded-3xl"
          style={{
            background: "#FDFBF7",
            border: "1px solid #e2dbcd" }}
        >
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Input */}
            <div>
              <label 
                htmlFor="email" 
                className="block text-xs font-medium uppercase mb-2"
                style={{ color: "#8b867c", letterSpacing: "0.08em" }}
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
                  background: "#FDFBF7",
                  border: "1px solid #e2dbcd",
                  color: "#1c1d20" }}
                placeholder="you@example.com"
              />
            </div>

            {/* Password Input */}
            <div>
              <label 
                htmlFor="password" 
                className="block text-xs font-medium uppercase mb-2"
                style={{ color: "#8b867c", letterSpacing: "0.08em" }}
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
                    background: "#FDFBF7",
                    border: "1px solid #e2dbcd",
                    color: "#1c1d20" }}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "#8b867c" }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end">
              <Link 
                href="/auth/forgot-password"
                className="text-xs transition-colors hover:underline"
                style={{ color: "#155e56" }}
              >
                Forgot your password?
              </Link>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-lg text-sm"
                style={{ 
                  background: "rgba(154, 59, 46, 0.1)", 
                  border: "1px solid rgba(154, 59, 46, 0.2)",
                  color: "#A32B23"
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
                background: "linear-gradient(135deg, #155e56 0%, #155e56 100%)",
                color: "#F6F3ED",
                boxShadow: "0 8px 32px rgba(21, 94, 86, 0.25)" }}
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
            <div className="flex-1 h-px" style={{ background: "#e2dbcd" }} />
            <span className="text-xs" style={{ color: "#8b867c" }}>or</span>
            <div className="flex-1 h-px" style={{ background: "#e2dbcd" }} />
          </div>

          {/* Request access link */}
          <p className="text-center text-sm" style={{ color: "#8b867c" }}>
            New to ThyroWell?{" "}
            <Link
              href="/request-access"
              className="font-medium transition-colors hover:underline"
              style={{ color: "#155e56" }}
            >
              Request your spot
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs mt-6" style={{ color: "#cfc7b6" }}>
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </motion.div>
    </div>
  )
}
