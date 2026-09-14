'use client'

import { useState } from 'react'
import { Check, ChevronDown, ChevronRight, FlaskConical, BookOpen, MessageSquare, Pill } from 'lucide-react'
import Link from 'next/link'
import { BottomNavPill } from '@/components/dashboard/BottomNavPill'
import { ReminderToggle } from '@/components/dashboard/ReminderToggle'
import { TodayLogCard } from '@/components/dashboard/TodayLogCard'
import { FirstOpenTour } from '@/components/dashboard/FirstOpenTour'
import { AccountButton } from '@/components/dashboard/AccountButton'
import { TodayFocus } from '@/components/dashboard/today/TodayFocus'
import {
  CheckInDueBlock, CheckInUpcoming, DoneBlock, LessonCard, MealsBlock, MovementBlock, NextMealBlock, PhotoDueCard,
} from '@/components/dashboard/today/blocks'
import type { TodayMeal } from '@/lib/plans/today'
import type { WorkoutItem } from '@/app/actions/plans'

export interface Week0Status {
  hasPlan: boolean
  hasLabs: boolean
  hasMedication: boolean
  hasMessaged: boolean
  hasReadLesson: boolean
  hasBaselinePhotos: boolean
  firstLessonSlug: string | null
}

/**
 * Week one — every day until her first check-in exists.
 *
 * Same lead-with-one-thing logic as the normal Today screen, plus the pieces
 * only a new client needs: day-one photos, and the setup list folded away.
 * Her first check-in becomes the lead block from day 7.
 */
export function EmptyCheckInState({
  name,
  dayNumber,
  todayMeals,
  todayWorkout,
  todayLog,
  logComplete,
  lesson,
  status,
  serverHour,
}: {
  name: string
  dayNumber: number
  todayMeals: TodayMeal[]
  todayWorkout: { hasPlan: boolean; walk: WorkoutItem | null; exercises: WorkoutItem[] }
  todayLog: { workoutDone: boolean; mealsFollowed: number; steps: number | null }
  logComplete: boolean
  lesson: { slug: string; title: string; summary: string | null; minutes: number } | null
  status?: Week0Status
  serverHour: number | null
}) {
  const s: Week0Status = status ?? {
    hasPlan: false, hasLabs: false, hasMedication: false,
    hasMessaged: false, hasReadLesson: false, hasBaselinePhotos: false, firstLessonSlug: null,
  }
  const [moreOpen, setMoreOpen] = useState(false)

  const weekday = new Date().toLocaleDateString('en-IN', { weekday: 'long' })
  const daysToCheckin = Math.max(0, 7 - dayNumber)
  const checkinDue = daysToCheckin === 0

  const setup = [
    { done: s.hasMedication, icon: Pill, title: 'Add your thyroid tablet', detail: 'So the app knows your timing', href: '/dashboard/progress#health' },
    { done: s.hasLabs, icon: FlaskConical, title: 'Add your blood report', detail: 'Optional, but useful', href: '/dashboard/progress#health' },
    { done: s.hasReadLesson, icon: BookOpen, title: 'Read your first lesson', detail: 'Two minutes', href: s.firstLessonSlug ? `/dashboard/learn/${s.firstLessonSlug}` : '/dashboard/learn' },
    { done: s.hasMessaged, icon: MessageSquare, title: 'Say hello to your coach', detail: 'Any question, any time', href: '/dashboard/messages' },
  ]
  const setupDone = setup.filter((x) => x.done).length
  const card = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' } as const

  const log = (
    <TodayLogCard
      initialWorkoutDone={todayLog.workoutDone}
      initialMealsFollowed={todayLog.mealsFollowed}
      initialSteps={todayLog.steps}
      heading="Tap what you did today"
    />
  )
  const meals = s.hasPlan
    ? {
        all: <MealsBlock meals={todayMeals} />,
        next: Object.fromEntries(['Breakfast', 'Lunch', 'Dinner'].map((k) => [k, <NextMealBlock key={k} meals={todayMeals} slot={k} />])),
        others: Object.fromEntries(['Breakfast', 'Lunch', 'Dinner'].map((k) => [k, <MealsBlock key={k} meals={todayMeals} skip={k} />])),
      }
    : null

  return (
    <div className="min-h-screen relative" style={{ background: '#090c14', paddingBottom: 'calc(84px + env(safe-area-inset-bottom, 24px))' }}>
      <FirstOpenTour />

      <header className="max-w-2xl mx-auto px-5 flex items-start justify-between gap-3" style={{ paddingTop: 'calc(20px + env(safe-area-inset-top, 0px))' }}>
        <div className="min-w-0">
          <p className="text-[10.5px] uppercase font-semibold" style={{ color: '#7e8a9e', letterSpacing: '0.16em' }}>
            Day {dayNumber} · {weekday}
          </p>
          <h1 className="mt-0.5 truncate" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: 'italic', fontSize: 27, lineHeight: 1.15, color: '#e8eaf0' }}>
            {dayNumber === 1 ? `Welcome, ${name}` : `Hello, ${name}`}
          </h1>
        </div>
        <AccountButton />
      </header>

      <main className="max-w-2xl mx-auto px-5 pt-4">
        {!s.hasPlan && (
          <div className="p-5 rounded-3xl mb-6" style={card}>
            <p className="text-sm font-medium" style={{ color: '#e8eaf0' }}>Your coach is building your plan</p>
            <p className="text-[12.5px] mt-1" style={{ color: '#7e8a9e', lineHeight: 1.55 }}>
              Your food and exercises will appear here. Until then, take your day-one photos below.
            </p>
          </div>
        )}

        <TodayFocus
          state={{ checkinDue, unreadFeedback: false, logComplete: s.hasPlan && logComplete }}
          serverHour={serverHour}
          meals={meals}
          primary={{
            checkin: <CheckInDueBlock first />,
            done: <DoneBlock name={name} />,
            movement: s.hasPlan ? <MovementBlock walk={todayWorkout.walk} exercises={todayWorkout.exercises} primary /> : null,
            log: s.hasPlan ? <div className="-mx-4">{log}</div> : null,
          }}
          secondaryOrder={['meal', 'movement', 'log']}
          secondary={{
            movement: s.hasPlan ? <MovementBlock walk={todayWorkout.walk} exercises={todayWorkout.exercises} /> : null,
            log: s.hasPlan ? <div id="today-log" className="-mx-4">{log}</div> : null,
          }}
          footer={
            <>
              {!s.hasBaselinePhotos && <PhotoDueCard first />}
              {lesson && <LessonCard lesson={lesson} />}
              {!checkinDue && <CheckInUpcoming days={daysToCheckin} />}
              <div className="-mx-4"><ReminderToggle /></div>

              <div>
                <button onClick={() => setMoreOpen((v) => !v)} className="w-full flex items-center justify-between px-1 py-2" aria-expanded={moreOpen}>
                  <span className="text-[10.5px] uppercase font-semibold" style={{ color: '#7e8a9e', letterSpacing: '0.16em' }}>
                    More setup · {setupDone}/{setup.length} done
                  </span>
                  <ChevronDown size={16} style={{ color: '#5a6578', transform: moreOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
                </button>
                {moreOpen && (
                  <div className="space-y-2 mt-1">
                    {setup.map((step) => (
                      <Link key={step.title} href={step.href} className="flex items-center gap-3 p-3.5 rounded-2xl" style={card}>
                        <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: step.done ? 'rgba(52,211,153,0.14)' : 'rgba(255,255,255,0.05)' }}>
                          {step.done ? <Check size={15} style={{ color: '#34d399' }} strokeWidth={3} /> : <step.icon size={15} style={{ color: '#7e8a9e' }} />}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm" style={{ color: step.done ? '#7e8a9e' : '#e8eaf0' }}>{step.title}</p>
                          <p className="text-[11px] mt-0.5" style={{ color: '#5a6578' }}>{step.detail}</p>
                        </div>
                        {!step.done && <ChevronRight size={15} style={{ color: '#404858' }} />}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </>
          }
        />
      </main>

      <BottomNavPill />
    </div>
  )
}
