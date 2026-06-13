"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useState, useEffect } from "react"
import { Activity, Sparkles, ArrowDown, Zap } from "lucide-react"

function useAnimatedCounter(target: number, duration: number = 1400, decimals: number = 0, shouldAnimate: boolean = true) {
  const [count, setCount] = useState(0)
  const ref = useRef<number>(0)

  useEffect(() => {
    if (!shouldAnimate) {
      setCount(target)
      return
    }
    const startTime = performance.now()
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
      setCount(parseFloat((eased * target).toFixed(decimals)))
      if (progress < 1) ref.current = requestAnimationFrame(animate)
    }
    ref.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(ref.current)
  }, [target, duration, decimals, shouldAnimate])

  return count
}

interface WeeklyVictoryProps {
  weekNumber?: number
  mainVictory?: string
  tshDrop?: number
  energyGain?: number
}

export function WeeklyVictory({
  weekNumber = 8,
  mainVictory = "Your TSH trend",
  tshDrop = 51,
  energyGain = 25
}: WeeklyVictoryProps) {
  const containerRef = useRef(null)
  const isInView = useInView(containerRef, { once: true, margin: "-60px" })
  const animatedTsh = useAnimatedCounter(tshDrop, 1600, 0, isInView)
  const animatedEnergy = useAnimatedCounter(energyGain, 1600, 0, isInView)

  return (
    <motion.section
      ref={containerRef}
      className="px-4"
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Victory Card with celebration styling */}
      <motion.div
        className="relative overflow-hidden p-6 rounded-[24px]"
        style={{
          background: "linear-gradient(135deg, rgba(45, 212, 191, 0.12) 0%, rgba(52, 211, 153, 0.08) 50%, rgba(245, 158, 11, 0.06) 100%)",
          border: "1px solid rgba(45, 212, 191, 0.25)",
          boxShadow: "0 0 40px rgba(45, 212, 191, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
        }}
        initial={{ scale: 0.95 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Sparkle decorations */}
        <motion.div
          className="absolute top-4 right-4"
          animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkles style={{ width: 24, height: 24, color: "#f59e0b", opacity: 0.6 }} />
        </motion.div>

        {/* Week label */}
        <div 
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
          style={{
            background: "rgba(245, 158, 11, 0.15)",
            border: "1px solid rgba(245, 158, 11, 0.25)"
          }}
        >
          <Activity style={{ width: 14, height: 14, color: "#f59e0b" }} />
          <span
            className="text-[11px] font-semibold uppercase"
            style={{ color: "#f59e0b", letterSpacing: "0.06em" }}
          >
            Week {weekNumber} · Tracking
          </span>
        </div>

        {/* Main headline */}
        <h3 
          className="text-[20px] font-semibold mb-5"
          style={{ color: "#eaecf4", lineHeight: 1.4 }}
        >
          {mainVictory}
        </h3>

        {/* Stats row */}
        <div className="flex gap-6">
          {/* TSH Drop */}
          <div className="flex items-center gap-2">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: "rgba(52, 211, 153, 0.15)" }}
            >
              <ArrowDown style={{ width: 18, height: 18, color: "#34d399" }} />
            </div>
            <div>
              <span 
                className="tabular-nums block"
                style={{ 
                  fontFamily: "'Instrument Serif', Georgia, serif",
                  fontStyle: "italic",
                  fontSize: 28,
                  color: "#34d399"
                }}
              >
                {animatedTsh}%
              </span>
              <span className="text-[11px]" style={{ color: "#7e8a9e" }}>
                Change since start
              </span>
            </div>
          </div>

          {/* Energy Gain */}
          <div className="flex items-center gap-2">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: "rgba(245, 158, 11, 0.15)" }}
            >
              <Zap style={{ width: 18, height: 18, color: "#f59e0b" }} />
            </div>
            <div>
              <span 
                className="tabular-nums block"
                style={{ 
                  fontFamily: "'Instrument Serif', Georgia, serif",
                  fontStyle: "italic",
                  fontSize: 28,
                  color: "#f59e0b"
                }}
              >
                {animatedEnergy}%
              </span>
              <span className="text-[11px]" style={{ color: "#7e8a9e" }}>
                Energy level
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.section>
  )
}
