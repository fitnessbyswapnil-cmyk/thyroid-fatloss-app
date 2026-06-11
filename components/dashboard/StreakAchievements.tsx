"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useState, useEffect } from "react"
import { Flame, Check, Lock, Star, TrendingDown, Zap, Target, Moon } from "lucide-react"

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
  currentStreak = 19,
  bestStreak = 24,
  monthlyGoal = { current: 19, target: 30 }
}: StreakAchievementsProps) {
  const containerRef = useRef(null)
  const isInView = useInView(containerRef, { once: true, margin: "-60px" })
  const animatedStreak = useAnimatedCounter(currentStreak, 1400, isInView)
  
  const weekDays = ["M", "T", "W", "T", "F", "S", "S"]
  const weekStatus = [true, true, true, true, true, "today", false] // completed, completed, today, upcoming
  
  const milestones = [
    { days: 7, earned: true },
    { days: 14, earned: true },
    { days: 30, earned: false, current: true },
    { days: 60, earned: false }
  ]
  
  const badges = [
    { name: "First Week", icon: Star, earned: true, color: "#2dd4bf" },
    { name: "TSH Drop", icon: TrendingDown, earned: true, color: "#34d399" },
    { name: "Energy Up", icon: Zap, earned: true, color: "#f59e0b" },
    { name: "2kg Lost", icon: Target, earned: true, color: "#fb7185" },
    { name: "Sleep Champion", icon: Moon, earned: false, color: "#7e8a9e" },
    { name: "7-Day Streak", icon: Flame, earned: false, color: "#7e8a9e" }
  ]

  return (
    <motion.section
      ref={containerRef}
      className="px-4"
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Section Label - emotional language */}
      <span 
        className="text-[11px] font-medium uppercase block mb-4"
        style={{ color: "#7e8a9e", letterSpacing: "0.10em" }}
      >
        Your Consistency Journey
      </span>

      {/* Streak Display */}
      <div className="flex items-center gap-4 mb-6">
        {/* Flame icon with pulse */}
        <motion.div
          animate={{ scale: [1, 1.18, 1] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <Flame style={{ width: 32, height: 32, color: "#f59e0b" }} />
        </motion.div>
        
        <div>
          <div className="flex items-baseline gap-2">
            <span 
              className="tabular-nums"
              style={{ 
                fontFamily: "'Instrument Serif', Georgia, serif",
                fontStyle: "italic",
                fontSize: 64,
                color: "#f59e0b"
              }}
            >
              {animatedStreak}
            </span>
          </div>
          <span 
            className="text-[12px] font-medium uppercase block"
            style={{ color: "#7e8a9e", letterSpacing: "0.08em" }}
          >
            Day Streak
          </span>
          <span className="text-[12px]" style={{ color: "#404858" }}>
            Best: {bestStreak} days
          </span>
        </div>
      </div>

      {/* Keep it up message */}
      <p className="text-[13px] mb-5" style={{ color: "#2dd4bf" }}>
        Keep it up — 5 more days to unlock &apos;Sleep Champion&apos;
      </p>

      {/* Weekly Grid */}
      <div className="flex gap-2 mb-5">
        {weekDays.map((day, index) => {
          const status = weekStatus[index]
          const isCompleted = status === true
          const isToday = status === "today"
          
          return (
            <motion.div
              key={index}
              className="flex flex-col items-center gap-1"
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ 
                type: "spring",
                stiffness: 300,
                damping: 18,
                delay: 0.05 * index
              }}
            >
              <span className="text-[10px]" style={{ color: "#404858" }}>{day}</span>
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{
                  background: isCompleted ? "#2dd4bf" : isToday ? "#f59e0b" : "#171e30",
                  boxShadow: isToday ? "0 0 0 3px rgba(245, 158, 11, 0.3)" : "none"
                }}
              >
                {isCompleted && <Check className="w-4 h-4 text-[#090c14]" />}
                {!isCompleted && !isToday && <div className="w-2 h-2 rounded-full bg-[#404858]" />}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Monthly goal bar */}
      <div className="mb-6">
        <div className="flex justify-between text-[12px] mb-2">
          <span style={{ color: "#7e8a9e" }}>{monthlyGoal.current}/{monthlyGoal.target} days this month</span>
          <span style={{ color: "#eaecf4" }}>{Math.round((monthlyGoal.current / monthlyGoal.target) * 100)}%</span>
        </div>
        <div 
          className="h-1.5 rounded-full overflow-hidden"
          style={{ background: "rgba(255, 255, 255, 0.08)" }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ background: "#2dd4bf" }}
            initial={{ width: 0 }}
            whileInView={{ width: `${(monthlyGoal.current / monthlyGoal.target) * 100}%` }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>

      {/* Milestones */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        {milestones.map((milestone, index) => (
          <motion.div
            key={milestone.days}
            className="p-3 rounded-xl text-center"
            style={{
              background: milestone.earned 
                ? "rgba(45, 212, 191, 0.12)" 
                : milestone.current 
                ? "rgba(245, 158, 11, 0.12)"
                : "rgba(255, 255, 255, 0.04)",
              border: `1px solid ${
                milestone.earned 
                  ? "rgba(45, 212, 191, 0.3)" 
                  : milestone.current
                  ? "rgba(245, 158, 11, 0.3)"
                  : "rgba(255, 255, 255, 0.08)"
              }`,
              boxShadow: milestone.earned ? "0 0 20px rgba(45, 212, 191, 0.2)" : "none"
            }}
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ 
              type: "spring",
              stiffness: 300,
              damping: 18,
              delay: 0.1 * index
            }}
          >
            <span 
              className="text-[14px] font-semibold block"
              style={{ 
                color: milestone.earned 
                  ? "#2dd4bf" 
                  : milestone.current 
                  ? "#f59e0b" 
                  : "#404858" 
              }}
            >
              {milestone.days}d
            </span>
            {milestone.earned && <Check className="w-3 h-3 mx-auto mt-1" style={{ color: "#2dd4bf" }} />}
          </motion.div>
        ))}
      </div>

      {/* Badge Collection - emotional language */}
      <span 
        className="text-[11px] font-medium uppercase block mb-3"
        style={{ color: "#7e8a9e", letterSpacing: "0.08em" }}
      >
        Milestones You&apos;ve Conquered
      </span>
      <div className="grid grid-cols-3 gap-3">
        {badges.map((badge, index) => (
          <motion.div
            key={badge.name}
            className="flex flex-col items-center gap-2 p-3"
            style={{ opacity: badge.earned ? 1 : 0.3 }}
            initial={{ scale: 0, rotate: -15 }}
            whileInView={{ scale: 1, rotate: 0 }}
            viewport={{ once: true }}
            transition={{ 
              type: "spring",
              stiffness: 300,
              damping: 18,
              delay: 0.12 * index
            }}
          >
            <div 
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{
                background: badge.earned 
                  ? `rgba(${badge.color === "#2dd4bf" ? "45, 212, 191" : badge.color === "#34d399" ? "52, 211, 153" : badge.color === "#f59e0b" ? "245, 158, 11" : "251, 113, 133"}, 0.15)`
                  : "rgba(255, 255, 255, 0.04)",
                boxShadow: badge.earned 
                  ? `0 0 20px ${badge.color}40, 0 0 40px ${badge.color}20`
                  : "none"
              }}
            >
              {badge.earned ? (
                <badge.icon style={{ width: 24, height: 24, color: badge.color }} />
              ) : (
                <Lock style={{ width: 20, height: 20, color: "#404858" }} />
              )}
            </div>
            <span 
              className="text-[11px] text-center"
              style={{ color: badge.earned ? "#eaecf4" : "#404858" }}
            >
              {badge.name}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.section>
  )
}
