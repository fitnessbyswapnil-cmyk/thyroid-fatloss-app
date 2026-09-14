/**
 * Server component: pure composition of the Today screen once a client has
 * checked in at least once. It renders every candidate block and hands them to
 * TodayFocus, which picks the one to lead with from her state and her device's
 * clock (see components/dashboard/today/TodayFocus.tsx).
 */
import { Pill } from "lucide-react"
import { CoachInsightCard } from "@/components/dashboard/CoachInsightCard"
import { WeeklyVictory } from "@/components/dashboard/WeeklyVictory"
import { TransformationMetrics } from "@/components/dashboard/TransformationMetrics"
import { StreakAchievements } from "@/components/dashboard/StreakAchievements"
import { BottomNavPill } from "@/components/dashboard/BottomNavPill"
import { CoachFeedbackCard, type CoachFeedbackItem } from "@/components/dashboard/CoachFeedbackCard"
import { TodayLogCard } from "@/components/dashboard/TodayLogCard"
import { ReminderToggle } from "@/components/dashboard/ReminderToggle"
import { FirstOpenTour } from "@/components/dashboard/FirstOpenTour"
import { AccountButton } from "@/components/dashboard/AccountButton"
import { TodayFocus, type FocusState } from "@/components/dashboard/today/TodayFocus"
import {
  CheckInDueBlock, CheckInUpcoming, DoneBlock, LessonCard, MealsBlock, MovementBlock, NextMealBlock, PhotoDueCard,
} from "@/components/dashboard/today/blocks"
import type { TodayMeal } from "@/lib/plans/today"
import type { WorkoutItem } from "@/app/actions/plans"

interface DashboardData {
  name: string
  programWeek: number
  dayOfReset: number | null
  medication: { name: string | null; dose: string | null; timing: string | null } | null
  nextLesson: { slug: string; title: string; summary: string | null; minutes: number; category: string | null } | null
  today: { hasPlan: boolean; meals: TodayMeal[]; walk: WorkoutItem | null; exercises: WorkoutItem[] }
  streak: { current: number; best: number }
  monthlyGoal: { current: number; target: number }
  weight: { current: number; start: number; goal: number; lost: number }
  tsh: { before: number; current: number }
  tshImprovement: number
  energy: number
  coachInsight: string | null
  insightTimestamp: string
  isNewInsight: boolean
  coachFeedback: CoachFeedbackItem[]
  todayLog: { mealsDone: string[]; workoutDone: boolean; steps: number | null }
  focus: FocusState
  daysToCheckin: number
  photoDue: boolean
  hasPhotos: boolean
  serverHour: number | null
}

export function DashboardClient({ data }: { data: DashboardData }) {
  const now = new Date()
  const log = (
    <TodayLogCard
      initialMealsDone={data.todayLog.mealsDone}
      initialWorkoutDone={data.todayLog.workoutDone}
      initialSteps={data.todayLog.steps}
      hasExercises={data.today.exercises.length > 0}
      heading="Tap what you did today"
    />
  )
  const feedback = data.coachFeedback.length > 0 ? <div className="-mx-4"><CoachFeedbackCard feedback={data.coachFeedback} /></div> : null
  const plan = data.today.hasPlan
  const meals = plan
    ? {
        all: <MealsBlock meals={data.today.meals} />,
        next: Object.fromEntries(["Breakfast", "Lunch", "Dinner"].map((s) => [s, <NextMealBlock key={s} meals={data.today.meals} slot={s} />])),
        others: Object.fromEntries(["Breakfast", "Lunch", "Dinner"].map((s) => [s, <MealsBlock key={s} meals={data.today.meals} skip={s} />])),
      }
    : null

  return (
    <div className="min-h-screen" style={{ background: "#090c14", paddingBottom: "calc(84px + env(safe-area-inset-bottom, 24px))" }}>
      <FirstOpenTour />

      <header className="max-w-2xl mx-auto px-5 flex items-start justify-between gap-3" style={{ paddingTop: "calc(20px + env(safe-area-inset-top, 0px))" }}>
        <div className="min-w-0">
          <p className="text-[10.5px] uppercase font-semibold" style={{ color: "#7e8a9e", letterSpacing: "0.16em" }}>
            {data.dayOfReset ? `Day ${data.dayOfReset}` : `Week ${data.programWeek}`} · {now.toLocaleDateString("en-IN", { weekday: "long" })}
          </p>
          <h1 className="mt-0.5 truncate" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: "italic", fontSize: 27, lineHeight: 1.15, color: "#e8eaf0" }}>
            Hello, {data.name}
          </h1>
        </div>
        <AccountButton />
      </header>

      <main className="max-w-2xl mx-auto px-5 pt-4">
        <TodayFocus
          state={data.focus}
          serverHour={data.serverHour}
          meals={meals}
          primary={{
            checkin: <CheckInDueBlock first={false} />,
            feedback,
            done: <DoneBlock name={data.name} />,
            movement: plan ? <MovementBlock walk={data.today.walk} exercises={data.today.exercises} primary /> : null,
            log: <div className="-mx-4">{log}</div>,
          }}
          secondaryOrder={["feedback", "meal", "movement", "log"]}
          secondary={{
            feedback,
            movement: plan ? <MovementBlock walk={data.today.walk} exercises={data.today.exercises} /> : null,
            log: <div id="today-log" className="-mx-4">{log}</div>,
          }}
          footer={
            <>
              {data.photoDue && <PhotoDueCard first={!data.hasPhotos} />}
              {data.nextLesson && <LessonCard lesson={data.nextLesson} />}
              {!data.focus.checkinDue && <CheckInUpcoming days={data.daysToCheckin} />}
              {data.coachInsight && (
                <div className="-mx-4">
                  <CoachInsightCard coachRole="A note from your coach" insight={data.coachInsight} timestamp={data.insightTimestamp} isNew={data.isNewInsight} />
                </div>
              )}
              {data.medication?.name && (
                <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <Pill size={17} style={{ color: "#34d399" }} />
                  <p className="text-[13px]" style={{ color: "#a9b2c1" }}>
                    {[data.medication.name, data.medication.dose].filter(Boolean).join(" ")}
                    {data.medication.timing ? ` · ${data.medication.timing}` : ""}
                  </p>
                </div>
              )}
              <div className="-mx-4"><ReminderToggle hideWhenOn /></div>
              {data.weight.current > 0 && <div className="-mx-4"><TransformationMetrics weight={data.weight} /></div>}
              <div className="-mx-4">
                <StreakAchievements currentStreak={data.streak.current} bestStreak={data.streak.best} monthlyGoal={data.monthlyGoal} />
              </div>
              {data.tsh.current > 0 && data.tsh.before > 0 && (
                <div className="-mx-4">
                  <WeeklyVictory weekNumber={data.programWeek} mainVictory="Your TSH trend" tshCurrent={data.tsh.current} tshChangePct={data.tshImprovement} energyLevel={data.energy} />
                </div>
              )}
            </>
          }
        />
      </main>

      <BottomNavPill />
    </div>
  )
}
