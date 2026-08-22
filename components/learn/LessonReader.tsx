"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Check, Clock, Loader2 } from "lucide-react"
import { markLessonRead, type LessonWithRead } from "@/app/actions/lessons"
import { LessonBody } from "@/components/learn/LessonBody"

export function LessonReader({ lesson }: { lesson: LessonWithRead }) {
  const router = useRouter()
  const [done, setDone] = useState(lesson.read)
  const [saving, setSaving] = useState(false)

  // Reading to the end is the completion signal; the button is the fallback
  // for anyone who skims.
  useEffect(() => {
    if (done) return
    const onScroll = () => {
      const nearEnd = window.innerHeight + window.scrollY >= document.body.offsetHeight - 120
      if (nearEnd) void complete()
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done])

  const complete = async () => {
    if (done || saving) return
    setSaving(true)
    setDone(true)
    await markLessonRead(lesson.id)
    setSaving(false)
    router.refresh()
  }

  return (
    <div className="min-h-screen relative" style={{ background: "#fdfbf7", paddingBottom: "calc(90px + env(safe-area-inset-bottom, 24px))" }}>
      <div className="tw-glow" style={{ position: "fixed", top: -160, left: 10, width: 350, height: 300, zIndex: 0 }} />

      <header className="sticky top-0 z-40 px-6 py-4" style={{ background: "rgba(253, 251, 247, 0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid #e2dbcd" }}>
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/dashboard/learn" className="p-2 -ml-2 rounded-lg shrink-0" style={{ color: "#8b867c" }}><ArrowLeft size={20} /></Link>
          <span className="text-[11px] uppercase font-semibold truncate" style={{ color: "#8b867c", letterSpacing: "0.14em" }}>
            {lesson.category || "Lesson"}
          </span>
          {done && (
            <span className="ml-auto inline-flex items-center gap-1 text-[10.5px] font-bold rounded-full px-2.5 py-1 shrink-0"
              style={{ color: "#155e56", background: "rgba(21, 94, 86,0.12)" }}>
              <Check size={11} strokeWidth={3} /> Read
            </span>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 relative" style={{ zIndex: 1 }}>
        <h1 style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic", fontSize: 30, lineHeight: 1.2, color: "#1c1d20" }}>
          {lesson.title}
        </h1>
        <p className="inline-flex items-center gap-1.5 text-[11.5px] mt-2.5 mb-6" style={{ color: "#a09a8e" }}>
          <Clock size={12} /> {lesson.read_minutes} min read
        </p>

        <LessonBody body={lesson.body} />

        <button
          onClick={complete}
          disabled={done || saving}
          className="w-full mt-8 h-12 rounded-full font-bold text-sm inline-flex items-center justify-center gap-2"
          style={done
            ? { background: "rgba(21, 94, 86,0.12)", color: "#155e56" }
            : { background: "#155e56", color: "#dfe7dd", boxShadow: "0 8px 24px rgba(21, 94, 86,0.25)" }}
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} strokeWidth={3} />}
          {done ? "Completed" : "Mark as read"}
        </button>

        <Link href="/dashboard/learn" className="block text-center text-[12.5px] mt-4" style={{ color: "#8b867c" }}>
          Back to all lessons
        </Link>
      </main>
    </div>
  )
}
