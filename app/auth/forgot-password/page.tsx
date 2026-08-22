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
      redirectTo: `${getSiteUrl()}/auth/callback?next=/auth/reset-password` })

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
        style={{ background: "#F4F0E8" }}
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
              background: "rgba(21, 94, 86, 0.15)",
              border: "1px solid rgba(21, 94, 86, 0.3)" }}
          >
            <Check size={32} style={{ color: "#155e56" }} />
          </motion.div>

          <h1 className="text-2xl font-bold mb-3" style={{ color: "#1c1d20" }}>
            Check Your Email
          </h1>
          <p className="mb-8" style={{ color: "#8b867c", fontSize: 14 }}>
            We&apos;ve sent password reset instructions to <strong style={{ color: "#1c1d20" }}>{email}</strong>
          </p>

          <Link 
            href="/auth/login"
            className="inline-flex items-center gap-2 text-sm font-medium"
            style={{ color: "#155e56" }}
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
      style={{ background: "#F4F0E8" }}
    >
      <div 
        className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(21, 94, 86, 0.13) 0%, transparent 70%)",
          filter: "blur(60px)" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative"
      >
        <div className="text-center mb-8">
          <Mail size={40} className="mx-auto mb-4" style={{ color: "#155e56" }} />
          <h1 className="text-2xl font-bold mb-2" style={{ color: "#1c1d20" }}>
            Reset Your Password
          </h1>
          <p style={{ color: "#8b867c", fontSize: 14 }}>
            Enter your email and we&apos;ll send you reset instructions
          </p>
        </div>

        <div
          className="p-8 rounded-3xl"
          style={{
            background: "#FDFBF7",
            border: "1px solid #e2dbcd" }}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
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
                className="w-full px-4 py-3.5 rounded-xl text-sm focus:outline-none"
                style={{
                  background: "#FDFBF7",
                  border: "1px solid #e2dbcd",
                  color: "#1c1d20" }}
                placeholder="you@example.com"
              />
            </div>

            {error && (
              <div
                className="p-3 rounded-lg text-sm"
                style={{ 
                  background: "rgba(154, 59, 46, 0.1)", 
                  border: "1px solid rgba(154, 59, 46, 0.2)",
                  color: "#A32B23"
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
                background: "linear-gradient(135deg, #155e56 0%, #155e56 100%)",
                color: "#F6F3ED",
                boxShadow: "0 8px 32px rgba(21, 94, 86, 0.25)" }}
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
              style={{ color: "#8b867c" }}
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
