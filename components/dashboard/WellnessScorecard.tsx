"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { useCountUp } from "@/components/ui/count-up"
import { useStaggerDelay } from "@/components/ui/stagger"

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
    { label: "Mood", value: 82, color: "#2dd4bf" },
    { label: "Energy", value: 75, color: "#f59e0b" },
    { label: "Sleep", value: 88, color: "#34d399" },
    { label: "Mental Clarity", value: 71, color: "#fb7185" }
  ],
  insight = "Great progress! Focus on sleep consistency to boost your score further."
}: WellnessScorecardProps) {
  const containerRef = useRef(null)
  const isInView = useInView(containerRef, { once: true, margin: "-60px" })
  const animatedScore = useCountUp(score, { start: isInView })

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
        style={{ color: "#2dd4bf", letterSpacing: "0.10em" }}
      >
        Your Wellness Progress
      </span>

      {/* Main Score */}
      <div className="flex items-baseline gap-3 mb-1">
        <span 
          className="tabular-nums"
          style={{ 
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontStyle: "italic",
            fontSize: 64,
            color: "#eaecf4"
          }}
        >
          <motion.span>{animatedScore}</motion.span>
        </span>
        <span className="text-[13px]" style={{ color: "#7e8a9e" }}>
          out of 100
        </span>
        <span 
          className="px-2.5 py-1 rounded-full text-[12px] font-medium"
          style={{ 
            background: "rgba(52, 211, 153, 0.12)",
            color: "#34d399"
          }}
        >
          +{delta} this week
        </span>
      </div>

      {/* Insight */}
      <p 
        className="text-[14px] mb-6"
        style={{ color: "#7e8a9e" }}
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
  const animatedValue = useCountUp(value, { start: isInView })
  // Four subscores today, so these ramps were already short — routed through
  // the shared helper so they stay short if a fifth is added, and so the card
  // stops animating at all under reduced motion.
  const cardDelay = useStaggerDelay(0.06, 0.1)
  const barDelay = useStaggerDelay(0.08, 0.2)

  return (
    <motion.div
      className="p-4 rounded-2xl"
      style={{
        background: "rgba(255, 255, 255, 0.04)",
        border: "1px solid rgba(255, 255, 255, 0.08)"
      }}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ 
        duration: 0.5, 
        ease: [0.22, 1, 0.36, 1],
        delay: cardDelay(index)
      }}
    >
      <span 
        className="text-[11px] font-medium uppercase block mb-2"
        style={{ color: "#7e8a9e", letterSpacing: "0.08em" }}
      >
        {label}
      </span>
      <span 
        className="tabular-nums block mb-3"
        style={{ 
          fontFamily: "'Instrument Serif', Georgia, serif",
          fontStyle: "italic",
          fontSize: 28,
          color: "#eaecf4"
        }}
      >
        <motion.span>{animatedValue}</motion.span>
      </span>
      {/* Progress bar */}
      <div 
        className="h-1 rounded-full overflow-hidden"
        style={{ background: "rgba(255, 255, 255, 0.08)" }}
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
            delay: barDelay(index)
          }}
        />
      </div>
    </motion.div>
  )
}
