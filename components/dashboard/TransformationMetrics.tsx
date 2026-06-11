"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useState, useEffect } from "react"
import { Activity, Zap, Heart, Leaf } from "lucide-react"

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
  goal: number
  lost: number
}

interface TransformationMetricsProps {
  weight?: WeightData
}

export function TransformationMetrics({
  weight = { current: 78.1, goal: 72, lost: 4.4 }
}: TransformationMetricsProps) {
  const containerRef = useRef(null)
  const isInView = useInView(containerRef, { once: true, margin: "-60px" })
  const animatedWeight = useAnimatedCounter(weight.current, 1400, 1, isInView)
  
  const progressToGoal = Math.round(((82.5 - weight.current) / (82.5 - weight.goal)) * 100)

  const metrics = [
    { 
      icon: Activity, 
      label: "Metabolic Recovery", 
      value: "15%", 
      delta: "↑",
      deltaColor: "#34d399",
      sub: "Body responding",
      iconColor: "#2dd4bf"
    },
    { 
      icon: Zap, 
      label: "Vitality Score", 
      value: "7.5 / 10", 
      delta: "+25% vs Week 1",
      deltaColor: "#f59e0b",
      sub: "Feeling stronger",
      iconColor: "#f59e0b"
    },
    { 
      icon: Heart, 
      label: "Thyroid Balance", 
      value: "4.2 TSH", 
      delta: "↓ 51% improved",
      deltaColor: "#34d399",
      sub: "Healing beautifully",
      iconColor: "#fb7185"
    },
    { 
      icon: Leaf, 
      label: "Nourishment", 
      value: "1,180 cal", 
      delta: "",
      deltaColor: "#34d399",
      sub: "Perfect balance",
      iconColor: "#34d399"
    }
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
        Your Body Is Transforming
      </span>

      {/* Featured Weight Card - Full Width */}
      <motion.div
        className="p-5 rounded-[20px] mb-3"
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
        <p 
          className="text-[13px] mb-4"
          style={{ color: "#7e8a9e" }}
        >
          Goal: {weight.goal}kg · {progressToGoal}% there
        </p>
        
        {/* Progress bar */}
        <div 
          className="h-1.5 rounded-full overflow-hidden mb-3"
          style={{ background: "rgba(255, 255, 255, 0.08)" }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, #2dd4bf, #f59e0b)" }}
            initial={{ width: 0 }}
            whileInView={{ width: `${progressToGoal}%` }}
            viewport={{ once: true }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
        
        {/* Delta chip */}
        <span 
          className="px-2.5 py-1 rounded-full text-[12px] font-medium"
          style={{ 
            background: "rgba(52, 211, 153, 0.12)",
            color: "#34d399"
          }}
        >
          -{weight.lost} kg · 5.3%
        </span>
      </motion.div>

      {/* 2x2 Metric Cards Grid */}
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            className="p-4 rounded-[16px]"
            style={{
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.08)"
            }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ 
              duration: 0.55, 
              ease: [0.22, 1, 0.36, 1],
              delay: 0.06 * index
            }}
            whileHover={{ y: -5, boxShadow: "0 20px 60px rgba(0, 0, 0, 0.28)" }}
          >
            <metric.icon 
              className="mb-2"
              style={{ width: 20, height: 20, color: metric.iconColor }}
            />
            <span 
              className="text-[11px] font-medium uppercase block mb-1"
              style={{ color: "#7e8a9e", letterSpacing: "0.05em" }}
            >
              {metric.label}
            </span>
            <div className="flex items-baseline gap-1.5 mb-1">
              <span 
                className="tabular-nums"
                style={{ 
                  fontFamily: "'Instrument Serif', Georgia, serif",
                  fontStyle: "italic",
                  fontSize: 26,
                  color: metric.delta.includes("↓") || metric.delta.includes("↑") ? metric.deltaColor : "#eaecf4"
                }}
              >
                {metric.value}
              </span>
            </div>
            {metric.delta && (
              <span 
                className="text-[11px] block mb-1"
                style={{ color: metric.deltaColor }}
              >
                {metric.delta}
              </span>
            )}
            <span 
              className="text-[12px]"
              style={{ color: "#404858" }}
            >
              {metric.sub}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.section>
  )
}
