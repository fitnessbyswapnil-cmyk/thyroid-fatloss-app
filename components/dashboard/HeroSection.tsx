"use client"

import { motion } from "framer-motion"
import { useEffect, useState, useRef } from "react"

// Animated counter hook inline
function useAnimatedCounter(target: number, duration: number = 1400, decimals: number = 0) {
  const [count, setCount] = useState(0)
  const ref = useRef<number>(0)

  useEffect(() => {
    const startTime = performance.now()
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
      const current = eased * target
      setCount(parseFloat(current.toFixed(decimals)))
      if (progress < 1) ref.current = requestAnimationFrame(animate)
    }
    ref.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(ref.current)
  }, [target, duration, decimals])

  return count
}

// Wellness score ring — reflects the client's real wellness score (0–100).
function RecoveryRing({ progress }: { progress: number }) {
  const RADIUS = 96
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS
  const offset = CIRCUMFERENCE * (1 - progress)
  const animatedPercent = useAnimatedCounter(Math.round(progress * 100), 1400)

  return (
    <div className="relative" style={{ width: 230, height: 230 }}>
      <svg viewBox="0 0 220 220" className="w-full h-full -rotate-90">
        <defs>
          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2dd4bf" />
            <stop offset="100%" stopColor="#6ee7b7" />
          </linearGradient>
          <filter id="ringGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Background track */}
        <circle
          cx="110"
          cy="110"
          r={RADIUS}
          fill="none"
          stroke="#1c2438"
          strokeWidth="14"
        />
        {/* Progress arc */}
        <motion.circle
          cx="110"
          cy="110"
          r={RADIUS}
          fill="none"
          stroke="url(#ringGradient)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          initial={{ strokeDashoffset: CIRCUMFERENCE }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
          filter="url(#ringGlow)"
        />
      </svg>
      {/* Center content - wellness score % and label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span 
          className="text-white tabular-nums"
          style={{ 
            fontFamily: "'Instrument Serif', Georgia, serif", 
            fontStyle: "italic",
            fontSize: 52
          }}
        >
          {animatedPercent}%
        </span>
        <span
          className="text-xs font-medium uppercase"
          style={{ color: "#2dd4bf", letterSpacing: "0.08em" }}
        >
          Wellness
        </span>
      </div>
    </div>
  )
}

interface HeroSectionProps {
  name?: string
  wellnessPercent?: number
  tshCurrent?: number
  energyCurrent?: number
  sleepHours?: number
}

export function HeroSection({
  name = "there",
  wellnessPercent = 0,
  tshCurrent = 0,
  energyCurrent = 0,
  sleepHours = 0
}: HeroSectionProps) {
  const [greeting, setGreeting] = useState("Good morning")

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) setGreeting("Good morning")
    else if (hour >= 12 && hour < 17) setGreeting("Good afternoon")
    else setGreeting("Good evening")
  }, [])

  return (
    <section 
      className="relative flex flex-col justify-center items-center overflow-hidden"
      style={{ 
        minHeight: "88vh",
        background: "#090c14",
        padding: "72px 24px 48px"
      }}
    >
      {/* Ambient glow behind ring */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          width: 380,
          height: 380,
          background: "radial-gradient(circle at center, rgba(45,212,191,0.22) 0%, rgba(45,212,191,0.06) 45%, transparent 70%)",
          zIndex: 0
        }}
        animate={{ 
          scale: [1, 1.10, 1], 
          opacity: [0.5, 0.75, 0.5] 
        }}
        transition={{ 
          duration: 4.5, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
      />

      {/* Program badge - top right */}
      <motion.div
        className="absolute top-6 right-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <div 
          className="px-3.5 py-1.5 rounded-full text-[11px] font-medium uppercase"
          style={{
            background: "linear-gradient(135deg, rgba(45,212,191,0.15), rgba(45,212,191,0.06))",
            border: "1px solid rgba(45,212,191,0.20)",
            color: "#2dd4bf",
            letterSpacing: "0.05em"
          }}
        >
          ThyroWell Premium
        </div>
      </motion.div>

      {/* Greeting */}
      <motion.span
        className="text-[13px] font-medium uppercase mb-3"
        style={{ color: "#2dd4bf", letterSpacing: "0.08em" }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        {greeting}
      </motion.span>

      {/* Name headline */}
      <motion.h1
        className="text-center font-bold mb-1"
        style={{ 
          fontSize: "clamp(28px, 8vw, 38px)",
          color: "#eaecf4",
          letterSpacing: "-0.03em"
        }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {name}
      </motion.h1>

      <motion.p
        className="text-base mb-10 text-center"
        style={{ color: "#7e8a9e", lineHeight: 1.5 }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        You&apos;re making real progress
      </motion.p>

      {/* Recovery Ring */}
      <motion.div
        className="relative z-10 mb-8"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <RecoveryRing progress={wellnessPercent} />
      </motion.div>

      {/* Quick stat chips — the client's own latest readings, no fabricated trend
          arrows. Each chip only shows when there is a real value. Note sleep is a
          1–10 quality score (not hours). */}
      <div className="flex gap-2">
        {[
          tshCurrent > 0 ? { label: `TSH ${tshCurrent}`, color: "#2dd4bf" } : null,
          energyCurrent > 0 ? { label: `Energy ${energyCurrent}/10`, color: "#2dd4bf" } : null,
          sleepHours > 0 ? { label: `Sleep ${sleepHours}/10`, color: "#2dd4bf" } : null,
        ].filter(Boolean).map((stat, index) => (
          <motion.div
            key={stat?.label || index}
            className="flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-medium"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#eaecf4"
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 + index * 0.05, duration: 0.4 }}
          >
            {stat?.label}
          </motion.div>
        ))}
      </div>
    </section>
  )
}
