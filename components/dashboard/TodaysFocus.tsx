"use client"

import { motion } from "framer-motion"
import { Quote, Utensils, Droplets, SmilePlus, Activity } from "lucide-react"

interface TodaysFocusProps {
  intention?: string
  attribution?: string
  streakDays?: number
}

export function TodaysFocus({
  intention = "Every cell in your body is working to heal. Trust the process, honor your journey.",
  attribution = "Dr. Rashmi Sharma",
  streakDays = 19
}: TodaysFocusProps) {
  const quickActions = [
    { icon: Utensils, label: "Log Meal" },
    { icon: Droplets, label: "Log Water" },
    { icon: SmilePlus, label: "Log Mood" },
    { icon: Activity, label: "Log Symptoms" }
  ]

  return (
    <motion.section
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
        Today&apos;s Care Rituals
      </span>

      {/* Daily Intention Card */}
      <div 
        className="p-5 rounded-[22px] mb-5"
        style={{
          background: "linear-gradient(135deg, rgba(45, 212, 191, 0.10) 0%, rgba(45, 212, 191, 0.04) 100%)",
          border: "1px solid rgba(45, 212, 191, 0.20)"
        }}
      >
        {/* Quote icon */}
        <Quote 
          className="mb-3"
          style={{ width: 20, height: 20, color: "#2dd4bf" }}
        />
        
        {/* Quote text */}
        <p 
          className="text-[15px] font-medium mb-4"
          style={{ 
            color: "#eaecf4",
            lineHeight: 1.7,
            fontStyle: "italic"
          }}
        >
          {intention}
        </p>
        
        {/* Attribution */}
        <p 
          className="text-[13px] mb-3"
          style={{ color: "#2dd4bf" }}
        >
          — {attribution}
        </p>
        
        {/* Streak label */}
        <span 
          className="text-[12px]"
          style={{ color: "#f59e0b" }}
        >
          {streakDays} days of daily intentions
        </span>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
        {quickActions.map((action, index) => (
          <motion.button
            key={action.label}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-full flex-shrink-0"
            style={{
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.08)"
            }}
            whileTap={{ scale: 0.92 }}
            transition={{ duration: 0.09 }}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <action.icon 
              style={{ width: 18, height: 18, color: "#2dd4bf" }}
            />
            <span 
              className="text-[13px]"
              style={{ color: "#eaecf4" }}
            >
              {action.label}
            </span>
          </motion.button>
        ))}
      </div>
    </motion.section>
  )
}
