import Link from "next/link"
import { BookOpen, Camera, Check, ChevronRight, ClipboardList, Dumbbell, Footprints, Play, UtensilsCrossed } from "lucide-react"
import type { TodayMeal } from "@/lib/plans/today"
import type { WorkoutItem } from "@/app/actions/plans"

/**
 * The pieces Today is built from. No hooks and no data fetching, so they can
 * be composed by the server page and by the Week 0 client component alike.
 *
 * Each block exists in one of two weights: a primary version (big, one clear
 * button) for when it is the thing to do right now, and a plain version for the
 * "also today" list underneath.
 */

const card = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" } as const
const primaryCard = { background: "linear-gradient(160deg, rgba(45,212,191,0.12), rgba(45,212,191,0.03))", border: "1px solid rgba(45,212,191,0.28)" } as const
const eyebrow = { color: "#7e8a9e", letterSpacing: "0.16em" } as const
const cta = { background: "#2dd4bf", color: "#06231f", boxShadow: "0 8px 24px rgba(45,212,191,0.25)" } as const

function Eyebrow({ Icon, children, color }: { Icon: typeof Dumbbell; children: React.ReactNode; color?: string }) {
  return (
    <p className="text-[10.5px] uppercase font-semibold inline-flex items-center gap-1.5" style={{ ...eyebrow, color: color ?? eyebrow.color }}>
      <Icon size={12} /> {children}
    </p>
  )
}

const dishes = (m: TodayMeal) => m.pick?.items.map((x) => x.name).join(" · ") ?? "Not set yet"

// ── Meals ────────────────────────────────────────────────────────────────────

/** The one meal she eats next, as the thing to do now. */
export function NextMealBlock({ meals, slot }: { meals: TodayMeal[]; slot: string }) {
  const m = meals.find((x) => x.slot === slot) ?? meals[0]
  const later = meals.filter((x) => ["Breakfast", "Lunch", "Dinner"].includes(x.slot) && x.slot !== m?.slot)
  if (!m) return null
  return (
    <section className="p-5 rounded-3xl" style={primaryCard}>
      <Eyebrow Icon={UtensilsCrossed} color="#2dd4bf">Eat next · {m.slot}</Eyebrow>
      <p className="text-[19px] font-semibold mt-2" style={{ color: "#e8eaf0", lineHeight: 1.35 }}>{dishes(m)}</p>
      {m.pick && (
        <p className="text-[12px] mt-1.5 tabular-nums" style={{ color: "#7e8a9e" }}>
          {m.pick.kcal} kcal · {m.pick.protein}g protein
          {m.options.length > 1 ? ` · ${m.options.length - 1} other options` : ""}
        </p>
      )}
      <Link href={`/dashboard/food#${m.slot.toLowerCase()}`} className="mt-4 h-12 rounded-full font-bold text-sm flex items-center justify-center gap-2" style={cta}>
        Recipe, portions &amp; swaps <ChevronRight size={16} />
      </Link>
      {later.length > 0 && (
        <p className="text-[11.5px] mt-3" style={{ color: "#7e8a9e" }}>
          Later: {later.map((x) => x.slot).join(" · ")} — listed below
        </p>
      )}
    </section>
  )
}

/** All of today's meals, as a plain list. `skip` leaves out the one shown above. */
export function MealsBlock({ meals, skip }: { meals: TodayMeal[]; skip?: string }) {
  const main = meals.filter((m) => ["Breakfast", "Lunch", "Dinner"].includes(m.slot) && m.slot !== skip)
  if (main.length === 0) return null
  return (
    <section>
      <div className="flex items-baseline justify-between mb-2.5">
        <Eyebrow Icon={UtensilsCrossed}>{skip ? "Later today" : "Today's food"}</Eyebrow>
        <Link href="/dashboard/food" className="text-[11px] font-medium" style={{ color: "#2dd4bf" }}>Recipes &amp; swaps</Link>
      </div>
      <div className="space-y-2">
        {main.map((m) => (
          <Link key={m.slot} href={`/dashboard/food#${m.slot.toLowerCase()}`} className="flex items-center gap-3 p-4 rounded-2xl" style={card}>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[11px] font-semibold uppercase" style={{ color: "#7e8a9e", letterSpacing: "0.1em" }}>{m.slot}</span>
                {m.pick && <span className="text-[11px] tabular-nums" style={{ color: "#5a6578" }}>{m.pick.kcal} kcal</span>}
              </div>
              <p className="text-[14.5px] mt-1" style={{ color: "#e8eaf0", lineHeight: 1.4 }}>{dishes(m)}</p>
            </div>
            <ChevronRight size={16} className="shrink-0" style={{ color: "#4b5563" }} />
          </Link>
        ))}
      </div>
    </section>
  )
}

// ── Movement ─────────────────────────────────────────────────────────────────

export function MovementBlock({ walk, exercises, primary = false }: { walk: WorkoutItem | null; exercises: WorkoutItem[]; primary?: boolean }) {
  const hasEx = exercises.length > 0
  return (
    <section className={primary ? "p-5 rounded-3xl" : ""} style={primary ? primaryCard : undefined}>
      <div className="flex items-baseline justify-between mb-2.5">
        <Eyebrow Icon={Dumbbell} color={primary ? "#2dd4bf" : undefined}>{primary ? "Move now" : "Today's movement"}</Eyebrow>
        {!primary && <Link href="/dashboard/move" className="text-[11px] font-medium" style={{ color: "#2dd4bf" }}>All days</Link>}
      </div>
      <Link href="/dashboard/move" className="block p-4 rounded-2xl" style={card}>
        <div className="flex items-center gap-3">
          <Footprints size={18} style={{ color: "#2dd4bf" }} />
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-medium" style={{ color: "#e8eaf0" }}>Walk 30 minutes</p>
            <p className="text-[11.5px] mt-0.5" style={{ color: "#7e8a9e" }}>
              {hasEx ? `Plus ${exercises.length} short exercises, about 20 minutes` : "Rest day — just the walk"}
            </p>
          </div>
          <ChevronRight size={16} className="shrink-0" style={{ color: "#4b5563" }} />
        </div>
      </Link>
      {hasEx && (
        <Link href="/dashboard/move?start=1" className="mt-3 h-12 rounded-full font-bold text-sm flex items-center justify-center gap-2" style={primary ? cta : { background: "rgba(45,212,191,0.12)", color: "#2dd4bf" }}>
          <Play size={15} fill={primary ? "#06231f" : "#2dd4bf"} /> Start today&apos;s exercises
        </Link>
      )}
    </section>
  )
}

// ── Check-in ─────────────────────────────────────────────────────────────────

export function CheckInDueBlock({ first }: { first: boolean }) {
  return (
    <section className="p-5 rounded-3xl" style={primaryCard}>
      <Eyebrow Icon={ClipboardList} color="#2dd4bf">{first ? "Your first check-in" : "This week's check-in"}</Eyebrow>
      <p className="text-[19px] font-semibold mt-2" style={{ color: "#e8eaf0", lineHeight: 1.35 }}>
        Tell your coach how the week went
      </p>
      <p className="text-[12.5px] mt-1.5" style={{ color: "#a9b2c1", lineHeight: 1.5 }}>
        Your weight and a few taps. About a minute. Your coach reads it and adjusts your plan.
      </p>
      <Link href="/dashboard/check-in" className="mt-4 h-12 rounded-full font-bold text-sm flex items-center justify-center gap-2" style={cta}>
        Start check-in <ChevronRight size={16} />
      </Link>
    </section>
  )
}

export function CheckInUpcoming({ days }: { days: number }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-2xl" style={card}>
      <ClipboardList size={17} style={{ color: "#7e8a9e" }} />
      <p className="flex-1 text-[13px]" style={{ color: "#a9b2c1" }}>
        Next check-in in {days} day{days === 1 ? "" : "s"}
      </p>
      <Link href="/dashboard/check-in" className="text-[12px] font-medium" style={{ color: "#2dd4bf" }}>Do it early</Link>
    </div>
  )
}

// ── Done ─────────────────────────────────────────────────────────────────────

export function DoneBlock({ name }: { name: string }) {
  return (
    <section className="p-5 rounded-3xl text-center" style={primaryCard}>
      <span className="w-12 h-12 rounded-full inline-flex items-center justify-center" style={{ background: "#2dd4bf" }}>
        <Check size={24} style={{ color: "#06231f" }} strokeWidth={3} />
      </span>
      <p className="text-[19px] font-semibold mt-3" style={{ color: "#e8eaf0" }}>Done for today, {name}</p>
      <p className="text-[12.5px] mt-1.5" style={{ color: "#a9b2c1", lineHeight: 1.5 }}>
        Food, movement and steps are all logged. Your coach will see it in the morning.
      </p>
      <a href="#today-log" className="inline-block mt-3 text-[12px] font-medium" style={{ color: "#2dd4bf" }}>Change something</a>
    </section>
  )
}

// ── Small prompts for the secondary list ─────────────────────────────────────

export function PhotoDueCard({ first }: { first: boolean }) {
  return (
    <Link href="/dashboard/progress-photos" className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)" }}>
      <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(245,158,11,0.16)" }}>
        <Camera size={18} style={{ color: "#f59e0b" }} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color: "#e8eaf0" }}>{first ? "Take your day-one photos" : "Time for this month's photos"}</p>
        <p className="text-[11.5px] mt-0.5" style={{ color: "#a9b2c1" }}>Front, side and back. Two minutes.</p>
      </div>
      <ChevronRight size={16} className="shrink-0" style={{ color: "#f59e0b" }} />
    </Link>
  )
}

export function LessonCard({ lesson }: { lesson: { slug: string; title: string; summary: string | null; minutes: number } }) {
  return (
    <Link href={`/dashboard/learn/${lesson.slug}`} className="flex items-start gap-3 p-4 rounded-2xl" style={{ background: "rgba(167,139,250,0.07)", border: "1px solid rgba(167,139,250,0.2)" }}>
      <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(167,139,250,0.15)" }}>
        <BookOpen size={18} style={{ color: "#a78bfa" }} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[10.5px] uppercase font-semibold" style={{ color: "#a78bfa", letterSpacing: "0.16em" }}>New lesson · {lesson.minutes} min</p>
        <p className="text-sm font-semibold mt-1" style={{ color: "#e8eaf0" }}>{lesson.title}</p>
        {lesson.summary && <p className="text-[11.5px] mt-1" style={{ color: "#7e8a9e", lineHeight: 1.5 }}>{lesson.summary}</p>}
      </div>
      <ChevronRight size={16} className="shrink-0 mt-1" style={{ color: "#a78bfa" }} />
    </Link>
  )
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10.5px] uppercase font-semibold pt-2" style={eyebrow}>{children}</p>
  )
}
