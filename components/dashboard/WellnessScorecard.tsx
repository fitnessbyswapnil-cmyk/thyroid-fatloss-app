"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useState, useEffect } from "react"

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

interface SubScore {
  label: string
  value: number
  color: string
}

interface WellnessScorecardProps {
  score?: number
  delta?: number
  subscores?: SubScore[]
  insight?: string
}

export function WellnessScorecard({
  score = 79,
  delta = 11,
  subscores = [
    { label: "Mood", value: 82, color: "#155e56" },
    { label: "Energy", value: 75, color: "#97671b" },
    { label: "Sleep", value: 88, color: "#155e56" },
    { label: "Mental Clarity", value: 71, color: "#9a3b2e" }
  ],
  insight = "Great progress! Focus on sleep consistency to boost your score further."
}: WellnessScorecardProps) {
  const containerRef = useRef(null)
  const isInView = useInView(containerRef, { once: true, margin: "-60px" })
  const animatedScore = useAnimatedCounter(score, 1400, isInView)

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
        className="text-[11px] font-medium uppercase block mb-2"
        style={{ color: "#155e56", letterSpacing: "0.10em" }}
      >
        Your Wellness Progress
      </span>

      {/* Main Score */}
      <div className="flex items-baseline gap-3 mb-1">
        <span 
          className="tabular-nums"
          style={{ 
            fontFamily: "'Newsreader', Georgia, serif",
            fontStyle: "italic",
            fontSize: 64,
            color: "#1c1d20"
          }}
        >
          {animatedScore}
        </span>
        <span className="text-[13px]" style={{ color: "#8b867c" }}>
          out of 100
        </span>
        <span 
          className="px-2.5 py-1 rounded-full text-[12px] font-medium"
          style={{ 
            background: "rgba(21, 94, 86, 0.12)",
            color: "#155e56"
          }}
        >
          +{delta} this week
        </span>
      </div>

      {/* Insight */}
      <p 
        className="text-[14px] mb-6"
        style={{ color: "#8b867c" }}
      >
        {insight}
      </p>

      {/* Sub-scores Grid */}
      <div className="grid grid-cols-2 gap-3">
        {subscores.map((subscore, index) => (
          <SubScoreCard 
            key={subscore.label} 
            {...subscore} 
            index={index}
            isInView={isInView}
          />
        ))}
      </div>
    </motion.section>
  )
}

function SubScoreCard({ 
  label, 
  value, 
  color, 
  index,
  isInView 
}: SubScore & { index: number; isInView: boolean }) {
  const animatedValue = useAnimatedCounter(value, 1400, isInView)

  return (
    <motion.div
      className="p-4 rounded-2xl"
      style={{
        background: "#ffffff",
        border: "1px solid #e2dbcd"
      }}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ 
        duration: 0.5, 
        ease: [0.22, 1, 0.36, 1],
        delay: 0.1 + index * 0.06
      }}
    >
      <span 
        className="text-[11px] font-medium uppercase block mb-2"
        style={{ color: "#8b867c", letterSpacing: "0.08em" }}
      >
        {label}
      </span>
      <span 
        className="tabular-nums block mb-3"
        style={{ 
          fontFamily: "'Newsreader', Georgia, serif",
          fontStyle: "italic",
          fontSize: 28,
          color: "#1c1d20"
        }}
      >
        {animatedValue}
      </span>
      {/* Progress bar */}
      <div 
        className="h-1 rounded-full overflow-hidden"
        style={{ background: "#e2dbcd" }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          whileInView={{ width: `${value}%` }}
          viewport={{ once: true }}
          transition={{ 
            duration: 1.2, 
            ease: [0.22, 1, 0.36, 1],
            delay: 0.2 + index * 0.08
          }}
        />
      </div>
    </motion.div>
  )
}
