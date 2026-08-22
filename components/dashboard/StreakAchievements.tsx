"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useState, useEffect } from "react"
import { Flame, Check } from "lucide-react"

function useAnimatedCounter(target: number, duration: number = 1400, shouldAnimate: boolean = true) {
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
      setCount(Math.round(eased * target))
      if (progress < 1) ref.current = requestAnimationFrame(animate)
    }
    ref.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(ref.current)
  }, [target, duration, shouldAnimate])

  return count
}

interface StreakAchievementsProps {
  currentStreak?: number
  bestStreak?: number
  monthlyGoal?: { current: number; target: number }
}

export function StreakAchievements({
  currentStreak = 0,
  bestStreak = 0,
  monthlyGoal = { current: 0, target: 30 }
}: StreakAchievementsProps) {
  const containerRef = useRef(null)
  const isInView = useInView(containerRef, { once: true, margin: "-60px" })
  const animatedStreak = useAnimatedCounter(currentStreak, 1400, isInView)

  // Milestones are derived from the real streak — earned when reached, the next
  // unreached one is the current target. No hardcoded "earned" badges.
  const milestoneDays = [7, 14, 30, 60]
  const nextIndex = milestoneDays.findIndex((d) => currentStreak < d)
  const goalPct = monthlyGoal.target > 0
    ? Math.max(0, Math.min(100, Math.round((monthlyGoal.current / monthlyGoal.target) * 100)))
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
      <span
        className="text-[11px] font-medium uppercase block mb-4"
        style={{ color: "#8b867c", letterSpacing: "0.10em" }}
      >
        Your Consistency Journey
      </span>

      {/* Streak Display (real data) */}
      <div className="flex items-center gap-4 mb-6">
        <motion.div
          animate={{ scale: [1, 1.18, 1] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <Flame style={{ width: 32, height: 32, color: "#97671b" }} />
        </motion.div>

        <div>
          <div className="flex items-baseline gap-2">
            <span
              className="tabular-nums"
              style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic", fontSize: 64, color: "#97671b" }}
            >
              {animatedStreak}
            </span>
          </div>
          <span className="text-[12px] font-medium uppercase block" style={{ color: "#8b867c", letterSpacing: "0.08em" }}>
            Day Streak
          </span>
          <span className="text-[12px]" style={{ color: "#cfc7b6" }}>
            Best: {bestStreak} {bestStreak === 1 ? "day" : "days"}
          </span>
        </div>
      </div>

      {/* Monthly goal bar (real data) */}
      <div className="mb-6">
        <div className="flex justify-between text-[12px] mb-2">
          <span style={{ color: "#8b867c" }}>{monthlyGoal.current}/{monthlyGoal.target} days this month</span>
          <span style={{ color: "#1c1d20" }}>{goalPct}%</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#e2dbcd" }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: "#155e56" }}
            initial={{ width: 0 }}
            whileInView={{ width: `${goalPct}%` }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>

      {/* Streak milestones (derived from real streak) */}
      <div className="grid grid-cols-4 gap-2">
        {milestoneDays.map((days, index) => {
          const earned = currentStreak >= days
          const current = index === nextIndex
          return (
            <motion.div
              key={days}
              className="p-3 rounded-xl text-center"
              style={{
                background: earned ? "rgba(21, 94, 86, 0.12)" : current ? "rgba(151, 103, 27, 0.12)" : "#ffffff",
                border: `1px solid ${earned ? "rgba(21, 94, 86, 0.3)" : current ? "rgba(151, 103, 27, 0.3)" : "#e2dbcd"}`,
                boxShadow: earned ? "0 0 20px rgba(21, 94, 86, 0.2)" : "none"
              }}
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.1 * index }}
            >
              <span
                className="text-[14px] font-semibold block"
                style={{ color: earned ? "#155e56" : current ? "#97671b" : "#cfc7b6" }}
              >
                {days}d
              </span>
              {earned && <Check className="w-3 h-3 mx-auto mt-1" style={{ color: "#155e56" }} />}
            </motion.div>
          )
        })}
      </div>
    </motion.section>
  )
}
