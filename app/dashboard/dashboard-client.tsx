"use client"

import { HeroSection } from "@/components/dashboard/HeroSection"
import { CoachInsightCard } from "@/components/dashboard/CoachInsightCard"
import { WeeklyVictory } from "@/components/dashboard/WeeklyVictory"
import { WellnessScorecard } from "@/components/dashboard/WellnessScorecard"
import { TodaysFocus } from "@/components/dashboard/TodaysFocus"
import { TransformationMetrics } from "@/components/dashboard/TransformationMetrics"
import { StreakAchievements } from "@/components/dashboard/StreakAchievements"
import { DailyReminder } from "@/components/dashboard/DailyReminder"
import { BottomNavPill } from "@/components/dashboard/BottomNavPill"

interface DashboardData {
  name: string
  programWeek: number
  recoveryPercent: number
  wellnessScore: { current: number; previous: number; delta: number }
  subscores: {
    tshBalance: number
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
  todayHabits: Record<string, boolean> | null
  chartData: Array<{ week_number: number; weight: number; energy_level: number; sleep_score: number }>
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
      {/* SECTION 1 — Hero Section (88vh) */}
      <HeroSection
        name={data.name}
        recoveryPercent={data.recoveryPercent}
        tshCurrent={data.tsh.current}
        energyCurrent={data.energy}
        sleepHours={data.sleep}
      />
      
      {/* SECTION 2 — Weekly Victory Card (celebration moment) */}
      {data.tshImprovement > 0 && (
        <div className="py-8">
          <WeeklyVictory
            weekNumber={data.programWeek}
            mainVictory={`Your TSH dropped ${data.tshImprovement}% since you started`}
            tshDrop={data.tshImprovement}
            energyGain={Math.round((data.energy / 10) * 100)}
          />
        </div>
      )}

      {/* SECTION 3 — Coach Insight Card */}
      <div className="py-8">
        <CoachInsightCard
          coachName="Dr. Rashmi Sharma"
          coachRole="Thyroid Specialist · Reviewing your progress"
          insight={data.coachInsight}
          timestamp={data.insightTimestamp}
          isNew={data.isNewInsight}
        />
      </div>
      
      {/* SECTION 4 — Wellness Scorecard */}
      <div className="py-8">
        <WellnessScorecard
          score={data.wellnessScore.current}
          delta={data.wellnessScore.delta}
          subscores={[
            { label: "TSH Balance", value: data.subscores.tshBalance, color: "#2dd4bf" },
            { label: "Energy", value: data.subscores.energyLevels, color: "#f59e0b" },
            { label: "Sleep", value: data.subscores.sleepQuality, color: "#34d399" },
            { label: "Mental Clarity", value: data.subscores.mentalClarity, color: "#fb7185" }
          ]}
          insight="Great progress! Focus on sleep consistency to boost your score further."
        />
      </div>
      
      {/* SECTION 5 — Today's Focus Strip */}
      <div className="py-8">
        <TodaysFocus
          intention={data.dailyIntention}
          attribution="Dr. Rashmi Sharma"
          streakDays={data.streak.current}
        />
      </div>
      
      {/* SECTION 6 — Transformation Metrics (Bento Grid) */}
      <div className="py-8">
        <TransformationMetrics
          weight={data.weight}
        />
      </div>
      
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
        attribution="Dr. Rashmi Sharma, Your Coach"
      />
      
      {/* Floating Bottom Navigation */}
      <BottomNavPill />
    </div>
  )
}
