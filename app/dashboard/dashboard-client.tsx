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
import { TransformationMetrics } from "@/components/dashboard/TransformationMetrics"
import { StreakAchievements } from "@/components/dashboard/StreakAchievements"
import { TodayCard } from "@/components/dashboard/TodayCard"
import { FirstOpenTour } from "@/components/dashboard/FirstOpenTour"
import type { TodayMeal } from "@/lib/plans/today"
import type { WorkoutItem } from "@/app/actions/plans"
import { BottomNavPill } from "@/components/dashboard/BottomNavPill"
import { CoachFeedbackCard, type CoachFeedbackItem } from "@/components/dashboard/CoachFeedbackCard"
import { ReminderToggle } from "@/components/dashboard/ReminderToggle"
import { CheckInCTA } from "@/components/dashboard/CheckInCTA"

interface DashboardData {
  name: string
  programWeek: number
  dayOfReset: number | null
  medication: { name: string | null; dose: string | null; timing: string | null } | null
  nextLesson: { slug: string; title: string; summary: string | null; minutes: number; category: string | null } | null
  today: { hasPlan: boolean; meals: TodayMeal[]; walk: WorkoutItem | null; exercises: WorkoutItem[] }
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
  todayLog: { workoutDone: boolean; walkDone: boolean; mealsFollowed: number; steps: number | null }
}

export function DashboardClient({ data }: { data: DashboardData }) {
  return (
    <div
      className="min-h-screen"
      style={{
        background: "#090c14",
        paddingBottom: "calc(90px + env(safe-area-inset-bottom, 24px))"
      }}
    >
      <FirstOpenTour />

      {/* 1 — Greeting + tablet reminder. Short, so today is above the fold. */}
      <PrototypeHero
        name={data.name}
        dayOfReset={data.dayOfReset}
        programWeek={data.programWeek}
        streak={data.streak.current}
        medication={data.medication}
      />

      {/* 2 — TODAY: eat, move, tap. The whole job, at the top. */}
      <div className="pt-4">
        <TodayCard
          hasPlan={data.today.hasPlan}
          meals={data.today.meals}
          walk={data.today.walk}
          exercises={data.today.exercises}
          log={{ workoutDone: data.todayLog.workoutDone, mealsFollowed: data.todayLog.mealsFollowed, steps: data.todayLog.steps }}
        />
      </div>

      {/* 3 — This week's check-in */}
      <div className="pt-8 pb-2">
        <CheckInCTA programWeek={data.programWeek} />
      </div>

      {/* 4 — What her coach said about her last check-in. The one thing a 1:1
          client is paying for, so it sits right under today. */}
      {data.coachFeedback.length > 0 && (
        <div className="py-6">
          <CoachFeedbackCard feedback={data.coachFeedback} />
        </div>
      )}
      {data.coachInsight && (
        <div className="py-6">
          <CoachInsightCard
            coachRole="A note from your coach"
            insight={data.coachInsight}
            timestamp={data.insightTimestamp}
            isNew={data.isNewInsight}
          />
        </div>
      )}

      {/* 5 — Reminders, for anyone who has not switched them on. Disappears
          once it has done its job. */}
      <div className="py-2">
        <ReminderToggle hideWhenOn />
      </div>

      {/* 6 — How she is doing: this week's feeling score, weight, streak. */}
      <div className="py-6">
        <WellnessScorecard
          score={data.wellnessScore.current}
          delta={data.wellnessScore.delta}
          subscores={[
            { label: "Mood", value: data.subscores.mood, color: "#2dd4bf" },
            { label: "Energy", value: data.subscores.energyLevels, color: "#f59e0b" },
            { label: "Sleep", value: data.subscores.sleepQuality, color: "#34d399" },
            { label: "Calm", value: data.subscores.mentalClarity, color: "#fb7185" }
          ]}
          insight="From your last check-in. Higher is better."
        />
      </div>

      {data.weight.current > 0 && (
        <div className="py-6">
          <TransformationMetrics weight={data.weight} />
        </div>
      )}

      {data.tsh.current > 0 && data.tsh.before > 0 && (
        <div className="py-6">
          <WeeklyVictory
            weekNumber={data.programWeek}
            mainVictory="Your TSH trend"
            tshCurrent={data.tsh.current}
            tshChangePct={data.tshImprovement}
            energyLevel={data.energy}
          />
        </div>
      )}

      <div className="py-6">
        <StreakAchievements
          currentStreak={data.streak.current}
          bestStreak={data.streak.best}
          monthlyGoal={data.monthlyGoal}
        />
      </div>

      {/* 7 — This week's lesson, last. Useful, never urgent. */}
      {data.nextLesson && (
        <div className="px-5 pb-6">
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
                This week&apos;s lesson · {data.nextLesson.minutes} min read
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

      <BottomNavPill />
    </div>
  )
}
