'use client'

import { useState } from 'react'
import { ArrowRight, Camera, Check, ChevronDown, ChevronRight, FlaskConical, BookOpen, MessageSquare, Pill } from 'lucide-react'
import Link from 'next/link'
import { BottomNavPill } from '@/components/dashboard/BottomNavPill'
import { ReminderToggle } from '@/components/dashboard/ReminderToggle'
import { TodayCard, type TodayLogState } from '@/components/dashboard/TodayCard'
import { FirstOpenTour } from '@/components/dashboard/FirstOpenTour'
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
 * Week one — the screen a client sees every day until her first check-in exists.
 *
 * Leads with today (eat, move, tap) through the same TodayCard the normal
 * dashboard uses, so nothing changes shape the day her first check-in lands.
 * Setup is one card for the only time-sensitive item (photos), with the rest
 * folded away. The check-in is named for when it applies — the end of the
 * week — rather than shouted on day one.
 */
export function EmptyCheckInState({
  name,
  dayNumber,
  todayMeals,
  todayWorkout,
  todayLog,
  status,
}: {
  name: string
  dayNumber: number
  todayMeals: TodayMeal[]
  todayWorkout: { hasPlan: boolean; walk: WorkoutItem | null; exercises: WorkoutItem[] }
  todayLog: TodayLogState
  status?: Week0Status
}) {
  const s: Week0Status = status ?? {
    hasPlan: false, hasLabs: false, hasMedication: false,
    hasMessaged: false, hasReadLesson: false, hasBaselinePhotos: false, firstLessonSlug: null,
  }
  const [moreOpen, setMoreOpen] = useState(false)

  const weekday = new Date().toLocaleDateString('en-IN', { weekday: 'long' })
  const daysToCheckin = Math.max(0, 7 - dayNumber)

  const setup = [
    { done: s.hasMedication, icon: Pill, title: 'Add your thyroid tablet', detail: 'So the app knows your timing', href: '/dashboard/health' },
    { done: s.hasLabs, icon: FlaskConical, title: 'Add your blood report', detail: 'Optional, but useful', href: '/dashboard/health' },
    { done: s.hasReadLesson, icon: BookOpen, title: 'Read your first lesson', detail: 'Two minutes', href: s.firstLessonSlug ? `/dashboard/learn/${s.firstLessonSlug}` : '/dashboard/learn' },
    { done: s.hasMessaged, icon: MessageSquare, title: 'Say hello to your coach', detail: 'Any question, any time', href: '/dashboard/messages' },
  ]
  const setupDone = setup.filter((x) => x.done).length

  const card = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' } as const

  return (
    <div
      className="min-h-screen relative"
      style={{ background: '#090c14', paddingBottom: 'calc(90px + env(safe-area-inset-bottom, 24px))' }}
    >
      <FirstOpenTour />

      <header className="max-w-2xl mx-auto px-5" style={{ paddingTop: 'calc(48px + env(safe-area-inset-top, 0px))' }}>
        <p className="text-[10.5px] uppercase font-semibold" style={{ color: '#7e8a9e', letterSpacing: '0.16em' }}>
          Day {dayNumber} · {weekday}
        </p>
        <h1
          className="mt-1"
          style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: 'italic', fontSize: 30, lineHeight: 1.15, color: '#e8eaf0' }}
        >
          {dayNumber === 1 ? `Welcome, ${name}` : `Hello, ${name}`}
        </h1>
        <p className="text-sm mt-1.5 mb-6" style={{ color: '#a9b2c1', lineHeight: 1.55 }}>
          {s.hasPlan
            ? 'Three things today. Eat, move, tap. That is the whole job.'
            : 'Your coach is building your plan. It will appear here — the photos below matter most right now.'}
        </p>
      </header>

      <TodayCard
        hasPlan={s.hasPlan}
        meals={todayMeals}
        walk={todayWorkout.walk}
        exercises={todayWorkout.exercises}
        log={todayLog}
      />

      <main className="max-w-2xl mx-auto px-5">
        {/* ── The one setup task that cannot wait ───────────────────────── */}
        {!s.hasBaselinePhotos && (
          <Link
            href="/dashboard/progress-photos"
            className="flex items-center gap-3 p-4 rounded-2xl mt-7"
            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}
          >
            <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(245,158,11,0.16)' }}>
              <Camera size={18} style={{ color: '#f59e0b' }} />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: '#e8eaf0' }}>Take your day-one photos</p>
              <p className="text-[11.5px] mt-0.5" style={{ color: '#a9b2c1' }}>
                The only thing here that cannot be done later. Two minutes.
              </p>
            </div>
            <ChevronRight size={16} className="shrink-0" style={{ color: '#f59e0b' }} />
          </Link>
        )}

        {/* ── Reminders — offered in the week she is most willing ───────── */}
        <div className="mt-5">
          <ReminderToggle />
        </div>

        {/* ── Everything else, folded away ──────────────────────────────── */}
        <div className="mt-6">
          <button
            onClick={() => setMoreOpen((v) => !v)}
            className="w-full flex items-center justify-between px-1 py-2"
            aria-expanded={moreOpen}
          >
            <span className="text-[10.5px] uppercase font-semibold" style={{ color: '#7e8a9e', letterSpacing: '0.16em' }}>
              More setup · {setupDone}/{setup.length} done
            </span>
            <ChevronDown size={16} style={{ color: '#5a6578', transform: moreOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
          </button>
          {moreOpen && (
            <div className="space-y-2 mt-1">
              {setup.map((step) => (
                <Link key={step.title} href={step.href} className="flex items-center gap-3 p-3.5 rounded-2xl" style={card}>
                  <span
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: step.done ? 'rgba(52,211,153,0.14)' : 'rgba(255,255,255,0.05)' }}
                  >
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

        {/* ── Check-in, named for when it applies ───────────────────────── */}
        <div className="mt-8 p-4 rounded-2xl" style={card}>
          <p className="text-sm font-medium" style={{ color: '#e8eaf0' }}>
            {daysToCheckin > 0 ? `Your first check-in opens in ${daysToCheckin} day${daysToCheckin === 1 ? '' : 's'}` : 'Your first check-in is ready'}
          </p>
          <p className="text-[12px] mt-1" style={{ color: '#7e8a9e', lineHeight: 1.5 }}>
            Once a week, three minutes: weight, energy, sleep. It is how your coach sees the week and adjusts your plan.
          </p>
          <Link
            href="/dashboard/check-in"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold"
            style={{ color: '#2dd4bf' }}
          >
            {daysToCheckin > 0 ? 'Do it early if you like' : 'Start your check-in'} <ArrowRight size={15} />
          </Link>
        </div>
      </main>

      <BottomNavPill />
    </div>
  )
}
