"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useState, useEffect } from "react"

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

interface WeightData {
  current: number
  start: number
  goal: number
  lost: number
}

export function TransformationMetrics({
  weight = { current: 0, start: 0, goal: 0, lost: 0 }
}: {
  weight?: WeightData
}) {
  const containerRef = useRef(null)
  const isInView = useInView(containerRef, { once: true, margin: "-60px" })
  const animatedWeight = useAnimatedCounter(weight.current, 1400, 1, isInView)

  // Progress toward goal from the client's own start weight (no hardcoded values).
  const span = weight.start - weight.goal
  const progressToGoal = span > 0
    ? Math.max(0, Math.min(100, Math.round(((weight.start - weight.current) / span) * 100)))
    : 0

  return (
    <motion.section
      ref={containerRef}
      className="px-4"
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Section Label */}
      <span
        className="text-[11px] font-medium uppercase block mb-4"
        style={{ color: "#7e8a9e", letterSpacing: "0.10em" }}
      >
        Your weight progress
      </span>

      {/* Featured Weight Card - Full Width (real data) */}
      <motion.div
        className="p-5 rounded-[20px]"
        style={{
          background: "linear-gradient(135deg, rgba(45, 212, 191, 0.08) 0%, transparent 60%)",
          border: "1px solid rgba(255, 255, 255, 0.08)"
        }}
        whileHover={{ y: -5, boxShadow: "0 20px 60px rgba(0, 0, 0, 0.28)" }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-baseline gap-2 mb-2">
          <span
            className="tabular-nums"
            style={{
              fontFamily: "'Instrument Serif', Georgia, serif",
              fontStyle: "italic",
              fontSize: 42,
              color: "white"
            }}
          >
            {animatedWeight} kg
          </span>
        </div>
        <p className="text-[13px] mb-4" style={{ color: "#7e8a9e" }}>
          Goal: {weight.goal}kg · {progressToGoal}% there
        </p>

        {/* Progress bar */}
        <div className="h-1.5 rounded-full overflow-hidden mb-3" style={{ background: "rgba(255, 255, 255, 0.08)" }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, #2dd4bf, #f59e0b)" }}
            initial={{ width: 0 }}
            whileInView={{ width: `${progressToGoal}%` }}
            viewport={{ once: true }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>

        {/* Delta chip (real data) */}
        {weight.lost > 0 && (
          <span
            className="px-2.5 py-1 rounded-full text-[12px] font-medium"
            style={{ background: "rgba(52, 211, 153, 0.12)", color: "#34d399" }}
          >
            -{weight.lost} kg lost
          </span>
        )}
      </motion.div>
    </motion.section>
  )
}
