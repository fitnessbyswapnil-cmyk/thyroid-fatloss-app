"use client"

import { motion } from "framer-motion"
import { Mail, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function SignUpSuccessPage() {
  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "#090c14" }}
    >
      {/* Ambient glow */}
      <div 
        className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(45, 212, 191, 0.12) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md relative text-center"
      >
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
          style={{
            background: "rgba(45, 212, 191, 0.15)",
            border: "1px solid rgba(45, 212, 191, 0.3)",
          }}
        >
          <Mail size={32} style={{ color: "#2dd4bf" }} />
        </motion.div>

        {/* Content */}
        <h1 
          className="text-2xl font-bold mb-3"
          style={{ color: "#e8eaf0" }}
        >
          Check Your Email
        </h1>
        <p 
          className="mb-8 leading-relaxed"
          style={{ color: "#7e8a9e", fontSize: 14 }}
        >
          We&apos;ve sent a confirmation link to your email address. 
          Click the link to verify your account and start your thyroid recovery journey.
        </p>

        {/* Card */}
        <div
          className="p-6 rounded-2xl mb-6"
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.06)",
          }}
        >
          <p className="text-sm" style={{ color: "#7e8a9e" }}>
            Didn&apos;t receive the email? Check your spam folder or{" "}
            <button 
              className="underline transition-colors"
              style={{ color: "#2dd4bf" }}
            >
              resend the confirmation email
            </button>
          </p>
        </div>

        {/* Back to Login */}
        <Link 
          href="/auth/login"
          className="inline-flex items-center gap-2 text-sm font-medium transition-colors"
          style={{ color: "#2dd4bf" }}
        >
          Back to Sign In
          <ArrowRight size={14} />
        </Link>
      </motion.div>
    </div>
  )
}
