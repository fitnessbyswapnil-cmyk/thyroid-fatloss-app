"use client"

import Link from "next/link"
import { ArrowLeft, BookOpen, Check, Lock, ChevronRight, Clock } from "lucide-react"
import type { LessonWithRead } from "@/app/actions/lessons"

const CATEGORY_TINT: Record<string, string> = {
  Medication: "#34d399",
  Nutrition: "#2dd4bf",
  Training: "#f59e0b",
  Mindset: "#a78bfa",
  Labs: "#60a5fa",
}

export function LessonsView({ lessons }: { lessons: LessonWithRead[] }) {
  const available = lessons.filter((l) => !l.locked)
  const readCount = available.filter((l) => l.read).length

  return (
    <div className="min-h-screen relative" style={{ background: "#090c14", paddingBottom: "calc(90px + env(safe-area-inset-bottom, 24px))" }}>
      <div className="tw-glow" style={{ position: "fixed", top: -150, left: 20, width: 340, height: 300, zIndex: 0 }} />

      <header className="sticky top-0 z-40 px-6 py-4" style={{ background: "rgba(9,12,20,0.8)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link href="/dashboard" className="p-2 -ml-2 rounded-lg" style={{ color: "#7e8a9e" }}><ArrowLeft size={20} /></Link>
          <h1 className="text-2xl" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: "italic", color: "#e8eaf0" }}>Learn</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-3 relative" style={{ zIndex: 1 }}>
        <div className="flex items-center gap-3 p-4 rounded-2xl mb-2" style={{ background: "rgba(45,212,191,0.06)", border: "1px solid rgba(45,212,191,0.16)" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(45,212,191,0.14)" }}>
            <BookOpen size={19} style={{ color: "#2dd4bf" }} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: "#e8eaf0" }}>
              {readCount} of {available.length} read
            </p>
            <p className="text-[11.5px]" style={{ color: "#7e8a9e" }}>
              New lessons unlock as you move through the programme
            </p>
          </div>
        </div>

        {lessons.map((l) => {
          const tint = CATEGORY_TINT[l.category || ""] || "#7e8a9e"
          if (l.locked) {
            return (
              <div key={l.id} className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <Lock size={16} className="shrink-0" style={{ color: "#404858" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "#5a6578" }}>{l.title}</p>
                  <p className="text-[11px]" style={{ color: "#404858" }}>Unlocks in week {l.week_number}</p>
                </div>
              </div>
            )
          }
          return (
            <Link key={l.id} href={`/dashboard/learn/${l.slug}`} className="flex items-start gap-3 p-4 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <span className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center mt-0.5"
                style={{ background: l.read ? "rgba(52,211,153,0.12)" : `${tint}1f` }}>
                {l.read ? <Check size={16} style={{ color: "#34d399" }} strokeWidth={3} /> : <BookOpen size={16} style={{ color: tint }} />}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {l.category && (
                    <span className="text-[9.5px] font-bold uppercase rounded-full px-2 py-0.5" style={{ color: tint, background: `${tint}1a`, letterSpacing: "0.06em" }}>
                      {l.category}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 text-[10.5px]" style={{ color: "#5a6578" }}>
                    <Clock size={10} /> {l.read_minutes} min
                  </span>
                </div>
                <p className="text-sm font-semibold mt-1.5" style={{ color: l.read ? "#a9b2c1" : "#e8eaf0" }}>{l.title}</p>
                {l.summary && <p className="text-[12px] mt-1" style={{ color: "#7e8a9e", lineHeight: 1.5 }}>{l.summary}</p>}
              </div>
              <ChevronRight size={16} className="shrink-0 mt-2" style={{ color: "#404858" }} />
            </Link>
          )
        })}

        {lessons.length === 0 && (
          <p className="text-sm text-center py-10" style={{ color: "#7e8a9e" }}>Lessons are on their way.</p>
        )}
      </main>
    </div>
  )
}
