/**
 * Server component. This file is pure composition — it takes the `data` object
 * page.tsx assembled and hands slices of it to the section components below,
 * with no state, effects or handlers of its own. As a "use client" boundary it
 * was forcing its own markup (and PrototypeHero's, and the lesson card's) into
 * the browser bundle for no behaviour. Every child that genuinely needs the
 * browser declares "use client" for itself, so each is now its own boundary.
 */
import Link from "next/link"
import { BookOpen, ChevronRight } from "lucide-react"
import { PrototypeHero } from "@/components/dashboard/PrototypeHero"
import { CoachInsightCard } from "@/components/dashboard/CoachInsightCard"
import { WeeklyVictory } from "@/components/dashboard/WeeklyVictory"
import { WellnessScorecard } from "@/components/dashboard/WellnessScorecard"
import { TodaysFocus } from "@/components/dashboard/TodaysFocus"
import { TransformationMetrics } from "@/components/dashboard/TransformationMetrics"
import { StreakAchievements } from "@/components/dashboard/StreakAchievements"
import { DailyReminder } from "@/components/dashboard/DailyReminder"
import { BottomNavPill } from "@/components/dashboard/BottomNavPill"
import { CoachFeedbackCard, type CoachFeedbackItem } from "@/components/dashboard/CoachFeedbackCard"
import { TodayLogCard } from "@/components/dashboard/TodayLogCard"
import { ReminderToggle } from "@/components/dashboard/ReminderToggle"
import { CheckInCTA } from "@/components/dashboard/CheckInCTA"

interface DashboardData {
  name: string
  programWeek: number
  dayOfReset: number | null
  medication: { name: string | null; dose: string | null; timing: string | null } | null
  nextLesson: { slug: string; title: string; summary: string | null; minutes: number; category: string | null } | null
  todayFocus: { hasPlan: boolean; hasSchedule: boolean; count: number; isRestDay: boolean }
  recoveryPercent: number
  wellnessScore: { current: number; previous: number; delta: number }
  subscores: {
    mood: number
    energyLevels: number
    sleepQuality: number
    mentalClarity: number
  }
  streak: { current: number; best: number }
  monthlyGoal: { current: number; target: number }
  weight: { current: number; start: number; goal: number; lost: number }
  tsh: { before: number; current: number }
  tshImprovement: number
  energy: number
  sleep: number
  coachInsight: string | null
  insightTimestamp: string
  isNewInsight: boolean
  dailyIntention: string
  chartData: Array<{ week_number: number; weight: number; energy_level: number; sleep_score: number }>
  coachFeedback: CoachFeedbackItem[]
  todayLog: { workoutDone: boolean; mealsFollowed: number }
}

export function DashboardClient({ data }: { data: DashboardData }) {
  return (
    <div 
      className="min-h-screen"
      style={{ 
        background: "#090c14",
        paddingBottom: "calc(100px + env(safe-area-inset-bottom, 24px))"
      }}
    >
      {/* SECTION 1 — Prototype hero (greeting, medication, focus, streak, quick actions) */}
      <PrototypeHero
        name={data.name}
        dayOfReset={data.dayOfReset}
        programWeek={data.programWeek}
        streak={data.streak.current}
        medication={data.medication}
        todayFocus={data.todayFocus}
      />
      
      {/* SECTION 1b — This week's lesson. Education is the cheapest retention
          lever a solo coach has, so it sits high, right under the hero. */}
      {data.nextLesson && (
        <div className="px-6 pt-4">
          <Link
            href={`/dashboard/learn/${data.nextLesson.slug}`}
            className="max-w-2xl mx-auto flex items-start gap-3 p-5 rounded-3xl"
            style={{ background: "rgba(167,139,250,0.07)", border: "1px solid rgba(167,139,250,0.2)" }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(167,139,250,0.15)" }}>
              <BookOpen size={19} style={{ color: "#a78bfa" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10.5px] uppercase font-semibold" style={{ color: "#a78bfa", letterSpacing: "0.16em" }}>
                Learn · {data.nextLesson.minutes} min
              </p>
              <p className="font-semibold text-sm mt-1" style={{ color: "#e8eaf0" }}>{data.nextLesson.title}</p>
              {data.nextLesson.summary && (
                <p className="text-[11.5px] mt-1" style={{ color: "#7e8a9e", lineHeight: 1.5 }}>{data.nextLesson.summary}</p>
              )}
            </div>
            <ChevronRight size={18} className="shrink-0 mt-1" style={{ color: "#a78bfa" }} />
          </Link>
        </div>
      )}

      {/* SECTION 2 — TSH trend (shown whenever real TSH data exists, either direction) */}
      {data.tsh.current > 0 && data.tsh.before > 0 && (
        <div className="py-8">
          <WeeklyVictory
            weekNumber={data.programWeek}
            mainVictory="Your TSH trend"
            tshCurrent={data.tsh.current}
            tshChangePct={data.tshImprovement}
            energyLevel={data.energy}
          />
        </div>
      )}

      {/* SECTION 3 — Coach Insight Card.
          Rendered only when the coach has genuinely written something. It used
          to fall back to placeholder text under a header saying he was reviewing
          her progress, timestamped Today. */}
      {data.coachInsight && (
        <div className="py-8">
          <CoachInsightCard
            coachRole="Wellness coach · Reviewing your progress"
            insight={data.coachInsight}
            timestamp={data.insightTimestamp}
            isNew={data.isNewInsight}
          />
        </div>
      )}
      
      {/* SECTION 3b — Coach feedback on the client's reviewed check-ins.
          The card stamps checkin_feedback.read_at when it scrolls into view, so
          the coach can tell a client who reads her weekly review from one who
          stopped opening it. Passing readAt on each item (page.tsx would need to
          select it) skips the stamp call once everything here is already read. */}
      {data.coachFeedback.length > 0 && (
        <div className="py-8">
          <CoachFeedbackCard feedback={data.coachFeedback} />
        </div>
      )}

      {/* SECTION 4 — Wellness Scorecard */}
      <div className="py-8">
        <WellnessScorecard
          score={data.wellnessScore.current}
          delta={data.wellnessScore.delta}
          subscores={[
            { label: "Mood", value: data.subscores.mood, color: "#2dd4bf" },
            { label: "Energy", value: data.subscores.energyLevels, color: "#f59e0b" },
            { label: "Sleep", value: data.subscores.sleepQuality, color: "#34d399" },
            { label: "Mental Clarity", value: data.subscores.mentalClarity, color: "#fb7185" }
          ]}
          insight="Your wellness score is based on your latest check-in."
        />
      </div>
      
      {/* SECTION 5 — Today's Focus Strip */}
      <div className="py-8">
        <TodaysFocus
          intention={data.dailyIntention}
          streakDays={data.streak.current}
        />
      </div>

      {/* SECTION 5b — Weekly check-in entry point */}
      <div className="pt-2 pb-4">
        <CheckInCTA programWeek={data.programWeek} />
      </div>

      {/* SECTION 5b-ii — Reminders, for anyone who has not switched them on.
          There are zero push subscribers across the whole roster, and the only
          two places to enable them were the Week 1 screen and Settings — the
          moment she is most overwhelmed, and a page nobody opens. A client who
          taps past Week 1 never gets a single nudge for twelve weeks, which
          makes the entire reminder system dead weight.

          hideWhenOn means this disappears the moment it has done its job, so a
          subscribed client never sees it here. Settings keeps the control. */}
      <div className="pb-4">
        <ReminderToggle hideWhenOn />
      </div>

      {/* SECTION 5c — Today's adherence log (drives the real streak) */}
      <div className="py-8">
        <TodayLogCard
          initialWorkoutDone={data.todayLog.workoutDone}
          initialMealsFollowed={data.todayLog.mealsFollowed}
        />
      </div>
      
      {/* SECTION 6 — Weight progress (only when the client has weight data) */}
      {data.weight.current > 0 && (
        <div className="py-8">
          <TransformationMetrics
            weight={data.weight}
          />
        </div>
      )}
      
      {/* SECTION 7 — Streak & Achievements */}
      <div className="py-10">
        <StreakAchievements
          currentStreak={data.streak.current}
          bestStreak={data.streak.best}
          monthlyGoal={data.monthlyGoal}
        />
      </div>
      
      {/* SECTION 8 — Daily Reminder (Closing Affirmation) */}
      <DailyReminder
        quote="Every small step you take today is building a healthier, stronger you."
      />
      
      {/* Floating Bottom Navigation */}
      <BottomNavPill />
    </div>
  )
}
