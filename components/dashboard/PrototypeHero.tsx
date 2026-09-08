/**
 * Server component: greeting, medication reminder, focus and quick actions are
 * all rendered from props, and every "action" is a Link. It was the largest
 * leaf under the dashboard's client boundary; once dashboard-client.tsx became
 * a server component there was nothing left tying this to the browser.
 */
import Link from "next/link"
import { Pill, Camera, TrendingUp, BookOpen, FlaskConical, ChevronRight, Check } from "lucide-react"

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
}: {
  name: string
  dayOfReset: number | null
  programWeek: number
  streak: number
  medication: { name: string | null; dose: string | null; timing: string | null } | null
}) {
  const now = new Date()
  const hr = now.getHours()
  const greeting = hr < 12 ? "Good morning" : hr < 17 ? "Good afternoon" : "Good evening"
  const dateLabel = now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })
  const hasMed = medication && (medication.name || medication.dose)

  return (
    <div className="relative overflow-hidden px-6" style={{ paddingTop: "calc(52px + env(safe-area-inset-top, 0px))", paddingBottom: 8 }}>
      <div className="tw-glow" style={{ position: "absolute", top: -140, left: 10, width: 360, height: 300, zIndex: 0 }} />
      <div className="relative max-w-2xl mx-auto" style={{ zIndex: 1 }}>
        <p className="text-[10.5px] uppercase font-semibold" style={{ color: "#7e8a9e", letterSpacing: "0.16em" }}>{dateLabel}</p>
        <h1 className="mt-1.5" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: "italic", fontSize: 31, lineHeight: 1.15, color: "#e8eaf0" }}>
          {greeting}, {name}
        </h1>
        <p className="text-sm mt-1.5" style={{ color: "#a9b2c1" }}>
          {dayOfReset ? `Day ${dayOfReset}` : `Week ${programWeek}`} · Eat, move, tap. That is the whole job today.
        </p>

        {/* Medication reminder (from thyroid profile) */}
        {hasMed ? (
          <div className="flex items-center gap-3 mt-5 p-3.5 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(52,211,153,0.12)" }}>
              <Pill size={18} style={{ color: "#34d399" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: "#e8eaf0" }}>
                {[medication!.name, medication!.dose].filter(Boolean).join(" ")}
              </p>
              {medication!.timing && <p className="text-[11.5px] mt-0.5 truncate" style={{ color: "#7e8a9e" }}>{medication!.timing}</p>}
            </div>
            <span className="flex items-center gap-1 rounded-full px-2.5 py-1 shrink-0" style={{ background: "rgba(52,211,153,0.12)" }}>
              <Check size={11} style={{ color: "#34d399" }} strokeWidth={3} />
              <span className="text-[11px] font-semibold" style={{ color: "#34d399" }}>Daily</span>
            </span>
          </div>
        ) : (
          <Link href="/dashboard/health" className="flex items-center gap-3 mt-5 p-3.5 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.1)" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(45,212,191,0.1)" }}>
              <Pill size={18} style={{ color: "#2dd4bf" }} />
            </div>
            <p className="flex-1 text-sm" style={{ color: "#a9b2c1" }}>Add your thyroid tablet and when you take it</p>
            <ChevronRight size={16} style={{ color: "#7e8a9e" }} />
          </Link>
        )}

        {/* Shortcuts to the things that are not on the tab bar */}
        <div className="grid grid-cols-4 gap-2.5 mt-5">
          {[
            { icon: Camera, label: "Photos", href: "/dashboard/progress-photos" },
            { icon: TrendingUp, label: "Progress", href: "/dashboard/progress" },
            { icon: BookOpen, label: "Lessons", href: "/dashboard/learn" },
            { icon: FlaskConical, label: "Labs", href: "/dashboard/health" },
          ].map((a) => (
            <Link key={a.label} href={a.href} className="flex flex-col items-center gap-1.5 rounded-2xl py-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <a.icon size={19} style={{ color: "#2dd4bf" }} />
              <span className="text-[10.5px] font-medium" style={{ color: "#a9b2c1" }}>{a.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
