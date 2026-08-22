"use client"

import Link from "next/link"
import { ArrowLeft, BookOpen, Check, Lock, ChevronRight, Clock } from "lucide-react"
import type { LessonWithRead } from "@/app/actions/lessons"

const CATEGORY_TINT: Record<string, string> = {
  Medication: "#155e56",
  Nutrition: "#155e56",
  Training: "#97671b",
  Mindset: "#b8863f",
  Labs: "#4a8a80",
}

export function LessonsView({ lessons }: { lessons: LessonWithRead[] }) {
  const available = lessons.filter((l) => !l.locked)
  const readCount = available.filter((l) => l.read).length

  return (
    <div className="min-h-screen relative" style={{ background: "#fdfbf7", paddingBottom: "calc(90px + env(safe-area-inset-bottom, 24px))" }}>
      <div className="tw-glow" style={{ position: "fixed", top: -150, left: 20, width: 340, height: 300, zIndex: 0 }} />

      <header className="sticky top-0 z-40 px-6 py-4" style={{ background: "rgba(253, 251, 247, 0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid #e2dbcd" }}>
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link href="/dashboard" className="p-2 -ml-2 rounded-lg" style={{ color: "#8b867c" }}><ArrowLeft size={20} /></Link>
          <h1 className="text-2xl" style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic", color: "#1c1d20" }}>Learn</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-3 relative" style={{ zIndex: 1 }}>
        <div className="flex items-center gap-3 p-4 rounded-2xl mb-2" style={{ background: "rgba(21, 94, 86, 0.13)", border: "1px solid rgba(21, 94, 86,0.16)" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(21, 94, 86,0.14)" }}>
            <BookOpen size={19} style={{ color: "#155e56" }} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: "#1c1d20" }}>
              {readCount} of {available.length} read
            </p>
            <p className="text-[11.5px]" style={{ color: "#8b867c" }}>
              New lessons unlock as you move through the programme
            </p>
          </div>
        </div>

        {lessons.map((l) => {
          const tint = CATEGORY_TINT[l.category || ""] || "#8b867c"
          if (l.locked) {
            return (
              <div key={l.id} className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: "#fdfbf7", border: "1px solid #f4f0e8" }}>
                <Lock size={16} className="shrink-0" style={{ color: "#cfc7b6" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "#a09a8e" }}>{l.title}</p>
                  <p className="text-[11px]" style={{ color: "#cfc7b6" }}>Unlocks in week {l.week_number}</p>
                </div>
              </div>
            )
          }
          return (
            <Link key={l.id} href={`/dashboard/learn/${l.slug}`} className="flex items-start gap-3 p-4 rounded-2xl"
              style={{ background: "#ffffff", border: "1px solid #e2dbcd" }}>
              <span className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center mt-0.5"
                style={{ background: l.read ? "rgba(21, 94, 86,0.12)" : `${tint}1f` }}>
                {l.read ? <Check size={16} style={{ color: "#155e56" }} strokeWidth={3} /> : <BookOpen size={16} style={{ color: tint }} />}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {l.category && (
                    <span className="text-[9.5px] font-bold uppercase rounded-full px-2 py-0.5" style={{ color: tint, background: `${tint}1a`, letterSpacing: "0.06em" }}>
                      {l.category}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 text-[10.5px]" style={{ color: "#a09a8e" }}>
                    <Clock size={10} /> {l.read_minutes} min
                  </span>
                </div>
                <p className="text-sm font-semibold mt-1.5" style={{ color: l.read ? "#5a564e" : "#1c1d20" }}>{l.title}</p>
                {l.summary && <p className="text-[12px] mt-1" style={{ color: "#8b867c", lineHeight: 1.5 }}>{l.summary}</p>}
              </div>
              <ChevronRight size={16} className="shrink-0 mt-2" style={{ color: "#cfc7b6" }} />
            </Link>
          )
        })}

        {lessons.length === 0 && (
          <p className="text-sm text-center py-10" style={{ color: "#8b867c" }}>Lessons are on their way.</p>
        )}
      </main>
    </div>
  )
}
