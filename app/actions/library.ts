'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface Exercise {
  id: string
  name: string
  muscle_group: string | null
  equipment: string | null
  video_url: string | null
  cues: string | null
  image_start: string | null
  image_end: string | null
}

export interface Food {
  id: string
  name: string
  portion: string
  calories: number | null
  protein: number | null
  carbs: number | null
  fats: number | null
  is_veg: boolean
  tags: string | null
}

// RLS (exercises_coach_all / foods_coach_all) already restricts everything to
// coach/admin — these actions just add friendly errors on top.
async function requireCoach() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null }
  const { data: me } = await supabase.from('clients').select('role').eq('id', user.id).single()
  if (!me || (me.role !== 'coach' && me.role !== 'admin')) return { supabase, user: null }
  return { supabase, user }
}

// ---------- exercises ----------
export async function listExercises(): Promise<Exercise[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('exercises').select('*').order('name')
  return (data || []) as Exercise[]
}

export async function upsertExercise(input: Partial<Exercise> & { name: string }) {
  const { supabase, user } = await requireCoach()
  if (!user) return { success: false, error: 'Only the coach can edit the library' }
  const row = {
    name: input.name.trim(),
    muscle_group: input.muscle_group?.trim() || null,
    equipment: input.equipment?.trim() || null,
    video_url: input.video_url?.trim() || null,
    cues: input.cues?.trim() || null,
    image_start: input.image_start?.trim() || null,
    image_end: input.image_end?.trim() || null,
    updated_at: new Date().toISOString(),
  }
  const { error } = input.id
    ? await supabase.from('exercises').update(row).eq('id', input.id)
    : await supabase.from('exercises').insert({ ...row, created_by: user.id })
  if (error) return { success: false, error: error.message }
  revalidatePath('/coach/library')
  return { success: true }
}

export async function deleteExercise(id: string) {
  const { supabase, user } = await requireCoach()
  if (!user) return { success: false, error: 'Only the coach can edit the library' }
  const { error } = await supabase.from('exercises').delete().eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/coach/library')
  return { success: true }
}

// ---------- foods ----------
export async function listFoods(): Promise<Food[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('foods').select('*').order('name')
  return (data || []) as Food[]
}

export async function upsertFood(input: Partial<Food> & { name: string; portion: string }) {
  const { supabase, user } = await requireCoach()
  if (!user) return { success: false, error: 'Only the coach can edit the library' }
  const num = (v: unknown) => (v === '' || v === null || v === undefined ? null : Number(v))
  const row = {
    name: input.name.trim(),
    portion: input.portion.trim() || '1 serving',
    calories: num(input.calories),
    protein: num(input.protein),
    carbs: num(input.carbs),
    fats: num(input.fats),
    is_veg: input.is_veg ?? true,
    tags: input.tags?.trim() || null,
    updated_at: new Date().toISOString(),
  }
  const { error } = input.id
    ? await supabase.from('foods').update(row).eq('id', input.id)
    : await supabase.from('foods').insert({ ...row, created_by: user.id })
  if (error) return { success: false, error: error.message }
  revalidatePath('/coach/library')
  return { success: true }
}

export async function deleteFood(id: string) {
  const { supabase, user } = await requireCoach()
  if (!user) return { success: false, error: 'Only the coach can edit the library' }
  const { error } = await supabase.from('foods').delete().eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/coach/library')
  return { success: true }
}

// ---------- CSV bulk import ----------
// Rows are pre-parsed client-side; this validates, caps, and inserts in one batch.
export async function importExercises(rows: Array<Partial<Exercise> & { name: string }>) {
  const { supabase, user } = await requireCoach()
  if (!user) return { success: false, error: 'Only the coach can import' }
  const clean = rows
    .filter((r) => r.name?.trim())
    .slice(0, 500)
    .map((r) => ({
      name: r.name.trim(),
      muscle_group: r.muscle_group?.trim() || null,
      equipment: r.equipment?.trim() || null,
      video_url: r.video_url?.trim() || null,
      cues: r.cues?.trim() || null,
      image_start: r.image_start?.trim() || null,
      image_end: r.image_end?.trim() || null,
      created_by: user.id,
    }))
  if (!clean.length) return { success: false, error: 'No valid rows found' }
  const { error } = await supabase.from('exercises').insert(clean)
  if (error) return { success: false, error: error.message }
  revalidatePath('/coach/library')
  return { success: true, count: clean.length }
}

export async function importFoods(rows: Array<Partial<Food> & { name: string }>) {
  const { supabase, user } = await requireCoach()
  if (!user) return { success: false, error: 'Only the coach can import' }
  const num = (v: unknown) => {
    const n = Number(v)
    return v === '' || v === null || v === undefined || Number.isNaN(n) ? null : n
  }
  const clean = rows
    .filter((r) => r.name?.trim())
    .slice(0, 500)
    .map((r) => ({
      name: r.name.trim(),
      portion: (r.portion || '1 serving').toString().trim(),
      calories: num(r.calories),
      protein: num(r.protein),
      carbs: num(r.carbs),
      fats: num(r.fats),
      is_veg: String(r.is_veg).toLowerCase() !== 'false' && String(r.is_veg).toLowerCase() !== 'no',
      tags: r.tags?.toString().trim() || null,
      created_by: user.id,
    }))
  if (!clean.length) return { success: false, error: 'No valid rows found' }
  const { error } = await supabase.from('foods').insert(clean)
  if (error) return { success: false, error: error.message }
  revalidatePath('/coach/library')
  return { success: true, count: clean.length }
}
