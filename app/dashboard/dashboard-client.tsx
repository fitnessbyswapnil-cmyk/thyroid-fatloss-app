"use client"

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
  coachInsight: string
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
        background: "#fdfbf7",
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
            style={{ background: "rgba(184, 134, 63, 0.14)", border: "1px solid rgba(184, 134, 63,0.2)" }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(184, 134, 63,0.15)" }}>
              <BookOpen size={19} style={{ color: "#b8863f" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10.5px] uppercase font-semibold" style={{ color: "#b8863f", letterSpacing: "0.16em" }}>
                Learn · {data.nextLesson.minutes} min
              </p>
              <p className="font-semibold text-sm mt-1" style={{ color: "#1c1d20" }}>{data.nextLesson.title}</p>
              {data.nextLesson.summary && (
                <p className="text-[11.5px] mt-1" style={{ color: "#8b867c", lineHeight: 1.5 }}>{data.nextLesson.summary}</p>
              )}
            </div>
            <ChevronRight size={18} className="shrink-0 mt-1" style={{ color: "#b8863f" }} />
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

      {/* SECTION 3 — Coach Insight Card */}
      <div className="py-8">
        <CoachInsightCard
          coachName="Your Coach"
          coachRole="Wellness coach · Reviewing your progress"
          insight={data.coachInsight}
          timestamp={data.insightTimestamp}
          isNew={data.isNewInsight}
        />
      </div>
      
      {/* SECTION 3b — Coach feedback on the client's reviewed check-ins */}
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
            { label: "Mood", value: data.subscores.mood, color: "#155e56" },
            { label: "Energy", value: data.subscores.energyLevels, color: "#97671b" },
            { label: "Sleep", value: data.subscores.sleepQuality, color: "#155e56" },
            { label: "Mental Clarity", value: data.subscores.mentalClarity, color: "#9a3b2e" }
          ]}
          insight="Your wellness score is based on your latest check-in."
        />
      </div>
      
      {/* SECTION 5 — Today's Focus Strip */}
      <div className="py-8">
        <TodaysFocus
          intention={data.dailyIntention}
          attribution="Your Coach"
          streakDays={data.streak.current}
        />
      </div>

      {/* SECTION 5b — Weekly check-in entry point */}
      <div className="pt-2 pb-4">
        <CheckInCTA programWeek={data.programWeek} />
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
        attribution="Your ThyroWell Coach"
      />
      
      {/* Floating Bottom Navigation */}
      <BottomNavPill />
    </div>
  )
}
