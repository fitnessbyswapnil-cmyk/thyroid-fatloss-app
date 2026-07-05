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
