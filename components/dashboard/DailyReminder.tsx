"use client"

import { motion } from "framer-motion"
import { Heart } from "lucide-react"

interface DailyReminderProps {
  quote?: string
  attribution?: string
}

export function DailyReminder({
  quote = "Every small step you take today is building a healthier, stronger you.",
  attribution = ""  // never signed unless the coach actually wrote it
}: DailyReminderProps) {
  return (
    <motion.section
      className="relative px-4 py-12 text-center overflow-hidden"
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Ambient background glow */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(circle at center, rgba(45, 212, 191, 0.06) 0%, transparent 60%)"
        }}
      />

      {/* Breathing heart icon */}
      <motion.div
        className="flex justify-center mb-4"
        animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <Heart style={{ width: 20, height: 20, color: "#2dd4bf", fill: "rgba(45, 212, 191, 0.3)" }} />
      </motion.div>

      {/* Divider */}
      <div 
        className="w-10 h-px mx-auto mb-6"
        style={{ background: "linear-gradient(90deg, transparent, #2dd4bf, transparent)" }}
      />

      {/* Quote with better typography */}
      <p 
        className="max-w-sm mx-auto mb-4"
        style={{ 
          fontFamily: "'Instrument Serif', Georgia, serif",
          fontStyle: "italic",
          fontSize: 20,
          lineHeight: 1.7,
          color: "#eaecf4"
        }}
      >
        &ldquo;{quote}&rdquo;
      </p>

      {/* Attribution */}
      <span 
        className="text-[13px]"
        style={{ color: "#2dd4bf" }}
      >
        — {attribution}
      </span>

      {/* Subtle closing line */}
      <p 
        className="text-[12px] mt-6"
        style={{ color: "#404858" }}
      >
        Rest well tonight. Tomorrow we keep building healthy habits.
      </p>
    </motion.section>
  )
}
