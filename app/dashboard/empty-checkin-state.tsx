'use client'

import { useState } from 'react'
import { ArrowRight, Camera, Check, ChevronDown, ChevronRight, FlaskConical, BookOpen, MessageSquare, Pill, Dumbbell, Footprints, UtensilsCrossed } from 'lucide-react'
import Link from 'next/link'
import { BottomNavPill } from '@/components/dashboard/BottomNavPill'
import { ReminderToggle } from '@/components/dashboard/ReminderToggle'
import { TodayLogCard } from '@/components/dashboard/TodayLogCard'

export interface Week0Status {
  hasPlan: boolean
  hasLabs: boolean
  hasMedication: boolean
  hasMessaged: boolean
  hasReadLesson: boolean
  hasBaselinePhotos: boolean
  firstLessonSlug: string | null
}

export interface TodayMeal {
  slot: 'Breakfast' | 'Lunch' | 'Dinner'
  pick: { label: string; items: string[]; kcal: number; protein: number } | null
  total: number
}

export interface TodayExercise {
  name: string
  sets: number | null
  reps: string | null
}

/**
 * Week one — the screen a client sees every day until her first check-in exists.
 *
 * It used to be a setup checklist with a weekly check-in as the main button.
 * That is backwards for the first seven days: what she needs on day one is
 * what to eat today, what to do today, and somewhere to tap that she did it.
 * Those three things were on the normal dashboard she could not reach yet, so
 * for her whole first week the daily log did not exist as far as she could see.
 *
 * Now it leads with today. Setup is one card for the only time-sensitive item
 * (photos), with the rest folded away. The check-in is named for when it
 * actually applies — the end of the week — rather than shouted on day one.
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
  todayWorkout: TodayExercise[]
  todayLog: { workoutDone: boolean; mealsFollowed: number; steps: number | null }
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
      style={{ background: '#090c14', paddingBottom: 'calc(100px + env(safe-area-inset-bottom, 24px))' }}
    >
      <main className="max-w-2xl mx-auto px-5 relative" style={{ paddingTop: 'calc(48px + env(safe-area-inset-top, 0px))' }}>
        {/* ── Header: where she is, in one line ─────────────────────────── */}
        <p className="text-[10.5px] uppercase font-semibold" style={{ color: '#7e8a9e', letterSpacing: '0.16em' }}>
          Day {dayNumber} · {weekday}
        </p>
        <h1
          className="mt-1"
          style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: 'italic', fontSize: 30, lineHeight: 1.15, color: '#e8eaf0' }}
        >
          {dayNumber === 1 ? `Welcome, ${name}` : `Hello, ${name}`}
        </h1>
        <p className="text-sm mt-1.5" style={{ color: '#a9b2c1', lineHeight: 1.55 }}>
          {s.hasPlan
            ? 'Three things today. Eat, move, tap. That is the whole job.'
            : 'Your coach is building your plan. It will appear here — the photos below matter most right now.'}
        </p>

        {/* ── TODAY: what to eat ─────────────────────────────────────────── */}
        {s.hasPlan && (
          <section className="mt-6">
            <div className="flex items-baseline justify-between mb-2.5">
              <p className="text-[10.5px] uppercase font-semibold inline-flex items-center gap-1.5" style={{ color: '#7e8a9e', letterSpacing: '0.16em' }}>
                <UtensilsCrossed size={12} /> Today&apos;s food
              </p>
              <Link href="/dashboard/plans" className="text-[11px] font-medium" style={{ color: '#2dd4bf' }}>
                See all options
              </Link>
            </div>
            <div className="space-y-2">
              {todayMeals.map((m) => (
                <Link key={m.slot} href="/dashboard/plans" className="block p-4 rounded-2xl" style={card}>
                  <div className="flex items-baseline justify-between">
                    <span className="text-[11px] font-semibold uppercase" style={{ color: '#7e8a9e', letterSpacing: '0.1em' }}>{m.slot}</span>
                    {m.pick && (
                      <span className="text-[11px] tabular-nums" style={{ color: '#5a6578' }}>
                        {m.pick.kcal} kcal · {m.pick.protein}g protein
                      </span>
                    )}
                  </div>
                  {m.pick ? (
                    <>
                      <p className="text-[15px] font-medium mt-1" style={{ color: '#e8eaf0', lineHeight: 1.4 }}>
                        {m.pick.items.join(' · ')}
                      </p>
                      <p className="text-[11px] mt-1.5" style={{ color: '#5a6578' }}>
                        Suggested for today · or pick any of the other {Math.max(0, m.total - 1)}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm mt-1" style={{ color: '#7e8a9e' }}>Not set yet</p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── TODAY: what to do ──────────────────────────────────────────── */}
        {s.hasPlan && (
          <section className="mt-6">
            <div className="flex items-baseline justify-between mb-2.5">
              <p className="text-[10.5px] uppercase font-semibold inline-flex items-center gap-1.5" style={{ color: '#7e8a9e', letterSpacing: '0.16em' }}>
                <Dumbbell size={12} /> Today&apos;s movement
              </p>
              <Link href="/dashboard/plans" className="text-[11px] font-medium" style={{ color: '#2dd4bf' }}>
                Open with demos
              </Link>
            </div>
            <Link href="/dashboard/plans" className="block p-4 rounded-2xl" style={card}>
              <div className="flex items-center gap-3 pb-3 mb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <Footprints size={18} style={{ color: '#2dd4bf' }} />
                <div>
                  <p className="text-[15px] font-medium" style={{ color: '#e8eaf0' }}>Walk 30 minutes</p>
                  <p className="text-[11px] mt-0.5" style={{ color: '#7e8a9e' }}>Split it if you like — 15 after lunch, 15 after dinner</p>
                </div>
              </div>
              {todayWorkout.length > 0 ? (
                <ul className="space-y-1.5">
                  {todayWorkout.filter((w) => w.name !== 'Brisk Walk').map((w) => (
                    <li key={w.name} className="flex items-baseline justify-between text-sm">
                      <span style={{ color: '#e8eaf0' }}>{w.name}</span>
                      <span className="text-[11px] tabular-nums shrink-0 ml-3" style={{ color: '#7e8a9e' }}>
                        {w.sets ? `${w.sets} × ` : ''}{w.reps || ''}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm" style={{ color: '#7e8a9e' }}>Rest day — the walk still counts.</p>
              )}
            </Link>
          </section>
        )}

        {/* ── TODAY: tap what you did ────────────────────────────────────── */}
        {s.hasPlan && (
          <div className="mt-7 -mx-1">
            <TodayLogCard
              initialWorkoutDone={todayLog.workoutDone}
              initialMealsFollowed={todayLog.mealsFollowed}
              initialSteps={todayLog.steps}
            />
          </div>
        )}

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
            Once a week, five minutes: weight, energy, sleep. It is how your coach sees the week, and it unlocks your trends.
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
