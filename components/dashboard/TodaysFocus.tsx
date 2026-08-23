"use client"

import { motion } from "framer-motion"
import { Quote } from "lucide-react"

interface TodaysFocusProps {
  intention?: string
  attribution?: string
  streakDays?: number
}

export function TodaysFocus({
  intention = "Take one small, kind step for yourself today.",
  attribution = "",  // never signed unless the coach actually wrote it
  streakDays = 0
}: TodaysFocusProps) {
  return (
    <motion.section
      className="px-4"
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <span
        className="text-[11px] font-medium uppercase block mb-4"
        style={{ color: "#7e8a9e", letterSpacing: "0.10em" }}
      >
        Today&apos;s Care Rituals
      </span>

      {/* Daily Intention Card */}
      <div
        className="p-5 rounded-[22px]"
        style={{
          background: "linear-gradient(135deg, rgba(45, 212, 191, 0.10) 0%, rgba(45, 212, 191, 0.04) 100%)",
          border: "1px solid rgba(45, 212, 191, 0.20)"
        }}
      >
        <Quote className="mb-3" style={{ width: 20, height: 20, color: "#2dd4bf" }} />

        <p
          className="text-[15px] font-medium mb-4"
          style={{ color: "#eaecf4", lineHeight: 1.7, fontStyle: "italic" }}
        >
          {intention}
        </p>

        <p className="text-[13px] mb-3" style={{ color: "#2dd4bf" }}>
          — {attribution}
        </p>

        {streakDays > 0 && (
          <span className="text-[12px]" style={{ color: "#f59e0b" }}>
            {streakDays} {streakDays === 1 ? "day" : "days"} of daily intentions
          </span>
        )}
      </div>
    </motion.section>
  )
}
