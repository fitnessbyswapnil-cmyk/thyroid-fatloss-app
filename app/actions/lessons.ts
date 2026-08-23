'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { guard, failed } from '@/lib/errors'

export interface Lesson {
  id: string
  slug: string
  title: string
  summary: string | null
  body: string
  category: string | null
  week_number: number
  read_minutes: number
}

export interface LessonWithRead extends Lesson {
  read: boolean
  /** Locked until the client reaches that program week. */
  locked: boolean
}

/**
 * Lessons unlock with the client's program week so the library feels paced
 * rather than like a wall of content on day one. The coach sees everything.
 */
export async function listLessons(): Promise<LessonWithRead[]> {
  return guard('lessons.listLessons', [], async () => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const [{ data: lessons }, { data: me }, { data: reads }] = await Promise.all([
      supabase.from('lessons').select('*').eq('published', true).order('week_number'),
      supabase.from('clients').select('role, start_date').eq('id', user.id).single(),
      supabase.from('lesson_reads').select('lesson_id').eq('client_id', user.id),
    ])

    const isCoach = me?.role === 'coach' || me?.role === 'admin'
    const start = me?.start_date ? new Date(me.start_date) : null
    const programWeek = start
      ? Math.max(1, Math.ceil((Date.now() - start.getTime()) / (7 * 24 * 60 * 60 * 1000)))
      : 1
    const readIds = new Set((reads || []).map((r) => r.lesson_id))

    return (lessons || []).map((l) => ({
      ...(l as Lesson),
      read: readIds.has(l.id),
      locked: !isCoach && l.week_number > programWeek,
    }))
  })
}

export async function getLesson(slug: string): Promise<LessonWithRead | null> {
  const all = await listLessons()
  return all.find((l) => l.slug === slug) || null
}

/** Idempotent — unique(client_id, lesson_id) makes re-reads a no-op. */
export async function markLessonRead(lessonId: string) {
  return guard('lessons.markLessonRead', failed('Could not save your progress.'), async () => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }
    const { error } = await supabase
      .from('lesson_reads')
      .upsert({ client_id: user.id, lesson_id: lessonId }, { onConflict: 'client_id,lesson_id' })
    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/learn')
    revalidatePath('/dashboard')
    return { success: true }
  })
}

/** The next unread, unlocked lesson — powers the home screen card. */
export async function nextLesson(): Promise<LessonWithRead | null> {
  const all = await listLessons()
  return all.find((l) => !l.read && !l.locked) || null
}
