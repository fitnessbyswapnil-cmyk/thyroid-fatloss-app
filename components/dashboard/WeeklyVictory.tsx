"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useState, useEffect } from "react"
import { Activity, Sparkles, ArrowDown, ArrowUp, Minus, Zap } from "lucide-react"

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
  tshCurrent?: number     // the client's latest self-entered TSH reading
  tshChangePct?: number   // signed: positive = lower than start, negative = higher
  energyLevel?: number    // 1–10 from the latest check-in
}

export function WeeklyVictory({
  weekNumber = 8,
  mainVictory = "Your TSH trend",
  tshCurrent = 0,
  tshChangePct = 0,
  energyLevel = 0
}: WeeklyVictoryProps) {
  const containerRef = useRef(null)
  const isInView = useInView(containerRef, { once: true, margin: "-60px" })
  const animatedTsh = useAnimatedCounter(tshCurrent, 1600, 1, isInView)
  const animatedEnergy = useAnimatedCounter(energyLevel, 1600, 0, isInView)

  // Direction-aware, no value judgment: just show which way it moved.
  const lower = tshChangePct > 0
  const higher = tshChangePct < 0
  const TrendIcon = lower ? ArrowDown : higher ? ArrowUp : Minus
  const changeLabel = tshChangePct !== 0
    ? `${Math.abs(tshChangePct)}% ${lower ? "lower" : "higher"} than start`
    : "Latest reading"

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
          background: "linear-gradient(135deg, rgba(21, 94, 86, 0.12) 0%, rgba(21, 94, 86, 0.08) 50%, rgba(151, 103, 27, 0.06) 100%)",
          border: "1px solid rgba(21, 94, 86, 0.25)",
          boxShadow: "0 0 40px rgba(21, 94, 86, 0.1), inset 0 1px 0 #cfc7b6"
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
          <Sparkles style={{ width: 24, height: 24, color: "#97671b", opacity: 0.6 }} />
        </motion.div>

        {/* Week label */}
        <div 
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
          style={{
            background: "rgba(151, 103, 27, 0.15)",
            border: "1px solid rgba(151, 103, 27, 0.25)"
          }}
        >
          <Activity style={{ width: 14, height: 14, color: "#97671b" }} />
          <span
            className="text-[11px] font-semibold uppercase"
            style={{ color: "#97671b", letterSpacing: "0.06em" }}
          >
            Week {weekNumber} · Tracking
          </span>
        </div>

        {/* Main headline */}
        <h3 
          className="text-[20px] font-semibold mb-5"
          style={{ color: "#1c1d20", lineHeight: 1.4 }}
        >
          {mainVictory}
        </h3>

        {/* Stats row — the client's own latest readings, shown neutrally */}
        <div className="flex gap-6">
          {/* Latest TSH reading + direction since start */}
          <div className="flex items-center gap-2">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: "#e2dbcd" }}
            >
              <TrendIcon style={{ width: 18, height: 18, color: "#8b867c" }} />
            </div>
            <div>
              <span
                className="tabular-nums block"
                style={{
                  fontFamily: "'Newsreader', Georgia, serif",
                  fontStyle: "italic",
                  fontSize: 28,
                  color: "#1c1d20"
                }}
              >
                {animatedTsh}
              </span>
              <span className="text-[11px]" style={{ color: "#8b867c" }}>
                {changeLabel}
              </span>
            </div>
          </div>

          {/* Latest energy level */}
          <div className="flex items-center gap-2">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: "rgba(151, 103, 27, 0.15)" }}
            >
              <Zap style={{ width: 18, height: 18, color: "#97671b" }} />
            </div>
            <div>
              <span
                className="tabular-nums block"
                style={{
                  fontFamily: "'Newsreader', Georgia, serif",
                  fontStyle: "italic",
                  fontSize: 28,
                  color: "#1c1d20"
                }}
              >
                {animatedEnergy}<span style={{ fontSize: 16, color: "#8b867c" }}>/10</span>
              </span>
              <span className="text-[11px]" style={{ color: "#8b867c" }}>
                Energy level
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.section>
  )
}
