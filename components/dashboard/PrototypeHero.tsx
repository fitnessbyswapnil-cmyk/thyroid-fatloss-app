"use client"

import Link from "next/link"
import { Pill, Scale, Apple, Smile, MessageSquare, ChevronRight, Check } from "lucide-react"

/**
 * Prototype-style client home hero: warm greeting, thyroid-medication reminder,
 * "today's focus", a streak / next-check-in pair, and quick actions — all wired
 * to real data. Sits at the top of the dashboard above the existing sections.
 */
export function PrototypeHero({
  name,
  dayOfReset,
  programWeek,
  streak,
  medication,
  todayFocus }: {
  name: string
  dayOfReset: number | null
  programWeek: number
  streak: number
  medication: { name: string | null; dose: string | null; timing: string | null } | null
  todayFocus?: { hasPlan: boolean; hasSchedule: boolean; count: number; isRestDay: boolean }
}) {
  const now = new Date()
  const hr = now.getHours()
  const greeting = hr < 12 ? "Good morning" : hr < 17 ? "Good afternoon" : "Good evening"
  const dateLabel = now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })
  const dots = Array.from({ length: 7 })
  const hasMed = medication && (medication.name || medication.dose)

  return (
    <div className="relative">
      {/* ── Ink. Allowed on exactly two things in this system: the greeting at
          the top of Home and Week 0, and the coach's own voice. Nothing that
          can be counted lives up here. ── */}
      <div
        style={{
          background: "#17181C",
          paddingTop: "calc(46px + env(safe-area-inset-top, 0px))",
          paddingBottom: 30,
          paddingLeft: 20,
          paddingRight: 20 }}
      >
        <div className="max-w-2xl mx-auto">
          <p className="uppercase" style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.14em", color: "#8E8A84" }}>
            {dateLabel}
          </p>
          {/* The one serif moment on this screen. */}
          <h1
            className="mt-2"
            style={{ fontFamily: "var(--face-serif)", fontWeight: 400, fontSize: 30, lineHeight: 1.24, letterSpacing: "-0.01em", color: "#F6F3ED" }}
          >
            {greeting}, {name}.
          </h1>
          <p className="mt-2" style={{ fontSize: 13, lineHeight: 1.6, color: "#B8B3AB" }}>
            {dayOfReset ? `Day ${dayOfReset} of your reset` : `Week ${programWeek} of your reset`} — steady wins.
          </p>
        </div>
      </div>

      {/* ── The seam. Paper is drawn OVER ink, pulled up 14px with a 16px
          radius, so the dark greeting never sits behind a number. ── */}
      <div
        className="relative px-6"
        style={{
          background: "#F4F0E8",
          marginTop: -14,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          paddingTop: 22,
          paddingBottom: 8,
          zIndex: 1 }}
      >
      <div className="relative max-w-2xl mx-auto">

        {/* Medication reminder (from thyroid profile) */}
        {hasMed ? (
          <div className="flex items-center gap-3 mt-5 p-3.5 rounded-2xl" style={{ background: "#FDFBF7", border: "1px solid #e2dbcd" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(21, 94, 86,0.12)" }}>
              <Pill size={18} style={{ color: "#155e56" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: "#1c1d20" }}>
                {[medication!.name, medication!.dose].filter(Boolean).join(" ")}
              </p>
              {medication!.timing && <p className="text-[11.5px] mt-0.5 truncate" style={{ color: "#8b867c" }}>{medication!.timing}</p>}
            </div>
            <span className="flex items-center gap-1 rounded-full px-2.5 py-1 shrink-0" style={{ background: "rgba(21, 94, 86,0.12)" }}>
              <Check size={11} style={{ color: "#155e56" }} strokeWidth={3} />
              <span className="text-[11px] font-semibold" style={{ color: "#155e56" }}>Daily</span>
            </span>
          </div>
        ) : (
          <Link href="/dashboard/health" className="flex items-center gap-3 mt-5 p-3.5 rounded-2xl" style={{ background: "#FDFBF7", border: "1px dashed #cfc7b6" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(21, 94, 86,0.1)" }}>
              <Pill size={18} style={{ color: "#155e56" }} />
            </div>
            <p className="flex-1 text-sm" style={{ color: "#5a564e" }}>Add your thyroid medication</p>
            <ChevronRight size={16} style={{ color: "#8b867c" }} />
          </Link>
        )}

        {/* Today's focus */}
        <Link href="/dashboard/plans" className="block relative overflow-hidden mt-3.5 p-5 rounded-3xl" style={{ background: "#FDFBF7", border: "1px solid rgba(21, 94, 86,0.16)" }}>
          <div className="tw-glow" style={{ position: "absolute", top: -70, right: -50, width: 220, height: 200, zIndex: 0, animationDuration: "6s" }} />
          <div className="relative" style={{ zIndex: 1 }}>
            <p className="text-[10.5px] uppercase font-semibold" style={{ color: "#155e56", letterSpacing: "0.16em" }}>Today&rsquo;s focus</p>
            {/* Answers "what do I do today" on the home screen itself, rather
                than making her open the plan and work it out. */}
            <p className="mt-1.5 tabular-nums" style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em", color: "#1C1D20" }}>
              {!todayFocus?.hasPlan
                ? "Your training plan"
                : todayFocus.isRestDay
                ? "Rest day"
                : todayFocus.count > 0
                ? `${todayFocus.count} exercise${todayFocus.count === 1 ? "" : "s"}`
                : "Your training plan"}
            </p>
            <p className="text-[12.5px] mt-1" style={{ color: "#5a564e" }}>
              {!todayFocus?.hasPlan
                ? "Open this week's workout & meals"
                : todayFocus.isRestDay
                ? "Recovery is part of the plan — nothing scheduled today"
                : todayFocus.count > 0
                ? "Scheduled for today — tap to start"
                : "Open this week's workout & meals"}
            </p>
            <span className="inline-block mt-4 rounded-full font-bold text-[13.5px] px-5 py-2.5" style={{ background: "#155e56", color: "#dfe7dd", boxShadow: "0 8px 24px rgba(21, 94, 86,0.25)" }}>
              {todayFocus?.isRestDay ? "View the week" : "Open plan"}
            </span>
          </div>
        </Link>

        {/* Streak + next check-in */}
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="p-4 rounded-2xl" style={{ background: "#FDFBF7", border: "1px solid #e2dbcd" }}>
            <p className="text-[10.5px] uppercase font-semibold" style={{ color: "#8B867C", letterSpacing: "0.16em" }}>Weeks together</p>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="tabular-nums" style={{ fontSize: 32, fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1, color: "#1C1D20" }}>{programWeek}</span>
              <span className="text-xs" style={{ color: "#8B867C" }}>{programWeek === 1 ? "week" : "weeks"}</span>
            </div>
            <div className="flex gap-1.5 mt-3">
              {dots.map((_, i) => (
                <div key={i} style={{ width: 15, height: 15, borderRadius: "50%", background: i < Math.min(programWeek, 7) ? "#155E56" : "#ECE5D6", border: "none" }} />
              ))}
            </div>
          </div>
          <Link href="/dashboard/check-in" className="p-4 rounded-2xl block" style={{ background: "#FDFBF7", border: "1px solid #e2dbcd" }}>
            <p className="text-[10.5px] uppercase font-semibold" style={{ color: "#8b867c", letterSpacing: "0.16em" }}>Weekly check-in</p>
            <p className="mt-2 tabular-nums" style={{ fontSize: 17, fontWeight: 600, color: "#1C1D20" }}>Week {programWeek}</p>
            <p className="text-[11.5px] mt-1" style={{ color: "#8b867c" }}>Tap to submit yours</p>
            <div className="h-[5px] rounded-full mt-3 overflow-hidden" style={{ background: "#e2dbcd" }}>
              <div style={{ width: "62%", height: "100%", borderRadius: 999, background: "linear-gradient(90deg,#155e56,#155e56)" }} />
            </div>
          </Link>
        </div>

        {/* Quick actions */}
        <p className="text-[10.5px] uppercase font-semibold mt-6 mb-2.5 ml-0.5" style={{ color: "#8b867c", letterSpacing: "0.16em" }}>Quick actions</p>
        <div className="grid grid-cols-4 gap-2.5">
          {[
            { icon: Scale, label: "Labs", href: "/dashboard/health" },
            { icon: Apple, label: "Plan", href: "/dashboard/plans" },
            { icon: Smile, label: "Progress", href: "/dashboard/progress" },
            { icon: MessageSquare, label: "Coach", href: "/dashboard/messages" },
          ].map((a) => (
            <Link key={a.label} href={a.href} className="flex flex-col items-center gap-1.5 rounded-2xl py-3.5" style={{ background: "#FDFBF7", border: "1px solid #e2dbcd" }}>
              <a.icon size={20} style={{ color: "#155e56" }} />
              <span className="text-[10.5px] font-medium" style={{ color: "#5a564e" }}>{a.label}</span>
            </Link>
          ))}
        </div>
      </div>
      </div>
    </div>
  )
}
