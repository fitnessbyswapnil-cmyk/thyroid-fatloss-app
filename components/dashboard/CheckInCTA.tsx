"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ClipboardList, ChevronRight } from "lucide-react"

export function CheckInCTA({ programWeek }: { programWeek: number }) {
  return (
    <motion.section
      className="px-4"
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        href="/dashboard/check-in"
        className="flex items-center gap-4 p-5 rounded-[22px] transition-transform active:scale-[0.99]"
        style={{
          background: "linear-gradient(135deg, rgba(21, 94, 86,0.14) 0%, rgba(21, 94, 86, 0.13) 100%)",
          border: "1px solid rgba(21, 94, 86,0.28)",
          boxShadow: "0 0 32px rgba(21, 94, 86,0.10)",
        }}
      >
        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(21, 94, 86,0.18)" }}>
          <ClipboardList size={20} style={{ color: "#155e56" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: "#1c1d20" }}>Week {programWeek} check-in</p>
          <p className="text-xs mt-0.5" style={{ color: "#8b867c" }}>5 minutes — your coach reviews every one</p>
        </div>
        <ChevronRight size={18} style={{ color: "#155e56" }} className="shrink-0" />
      </Link>
    </motion.section>
  )
}
