"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { getSiteUrl } from "@/lib/env"
import { Loader2, ArrowLeft, Mail, Check } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    // Route through the callback so the recovery code is exchanged for a
    // session, then land on the reset-password form. URL built from
    // NEXT_PUBLIC_SITE_URL (throws in prod if unset).
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${getSiteUrl()}/auth/callback?next=/auth/reset-password`,
    })

    if (error) {
      setError(error.message)
      setIsLoading(false)
      return
    }

    setIsSuccess(true)
    setIsLoading(false)
  }

  if (isSuccess) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: "#090c14" }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md relative text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
            style={{
              background: "rgba(45, 212, 191, 0.15)",
              border: "1px solid rgba(45, 212, 191, 0.3)",
            }}
          >
            <Check size={32} style={{ color: "#2dd4bf" }} />
          </motion.div>

          <h1 className="text-2xl font-bold mb-3" style={{ color: "#e8eaf0" }}>
            Check Your Email
          </h1>
          <p className="mb-8" style={{ color: "#7e8a9e", fontSize: 14 }}>
            We&apos;ve sent password reset instructions to <strong style={{ color: "#e8eaf0" }}>{email}</strong>
          </p>

          <Link 
            href="/auth/login"
            className="inline-flex items-center gap-2 text-sm font-medium"
            style={{ color: "#2dd4bf" }}
          >
            <ArrowLeft size={14} />
            Back to Sign In
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "#090c14" }}
    >
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
        className="w-full max-w-md relative"
      >
        <div className="text-center mb-8">
          <Mail size={40} className="mx-auto mb-4" style={{ color: "#2dd4bf" }} />
          <h1 className="text-2xl font-bold mb-2" style={{ color: "#e8eaf0" }}>
            Reset Your Password
          </h1>
          <p style={{ color: "#7e8a9e", fontSize: 14 }}>
            Enter your email and we&apos;ll send you reset instructions
          </p>
        </div>

        <div
          className="p-8 rounded-3xl"
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.06)",
            backdropFilter: "blur(24px)",
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
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
                className="w-full px-4 py-3.5 rounded-xl text-sm focus:outline-none"
                style={{
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  color: "#e8eaf0",
                }}
                placeholder="you@example.com"
              />
            </div>

            {error && (
              <div
                className="p-3 rounded-lg text-sm"
                style={{ 
                  background: "rgba(239, 68, 68, 0.1)", 
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                  color: "#fca5a5"
                }}
              >
                {error}
              </div>
            )}

            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2"
              style={{
                background: "linear-gradient(135deg, #2dd4bf 0%, #22c55e 100%)",
                color: "#0a0d14",
                boxShadow: "0 8px 32px rgba(45, 212, 191, 0.25)",
              }}
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                "Send Reset Instructions"
              )}
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <Link 
              href="/auth/login"
              className="inline-flex items-center gap-2 text-sm"
              style={{ color: "#7e8a9e" }}
            >
              <ArrowLeft size={14} />
              Back to Sign In
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
