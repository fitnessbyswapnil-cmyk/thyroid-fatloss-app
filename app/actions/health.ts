'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { guard, failed } from '@/lib/errors'

export interface HealthProfile {
  client_id: string
  diagnosis: string | null
  diagnosis_year: number | null
  medication: string | null
  medication_dose: string | null
  medication_timing: string | null
  menopause_status: string | null
  conditions: string | null
  allergies: string | null
  notes: string | null
}

export interface LabExtra {
  name: string
  value: number
  unit: string | null
  low: number | null
  high: number | null
}

export interface LabResult {
  id: string
  client_id: string
  taken_on: string
  tsh: number | null
  t3: number | null
  t4: number | null
  vitamin_d: number | null
  b12: number | null
  ferritin: number | null
  weight_kg: number | null
  notes: string | null
  extras: LabExtra[] | null
  source: string | null
}

const num = (v: unknown) => {
  if (v === '' || v === null || v === undefined) return null
  const n = Number(v)
  return Number.isNaN(n) ? null : n
}

/** The target client: an explicit id (coach editing a client) or the caller. */
async function resolveClientId(explicit?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, clientId: null as string | null }
  return { supabase, clientId: explicit || user.id }
}

export async function getHealthProfile(clientId?: string): Promise<HealthProfile | null> {
  return guard('health.getHealthProfile', null, async () => {
    const { supabase, clientId: id } = await resolveClientId(clientId)
    if (!id) return null
    const { data } = await supabase.from('health_profiles').select('*').eq('client_id', id).maybeSingle()
    return (data as HealthProfile) || null
  })
}

export async function saveHealthProfile(input: Partial<HealthProfile> & { clientId?: string }) {
  return guard('health.saveHealthProfile', failed('Could not save your profile.'), async () => {
    const { supabase, clientId } = await resolveClientId(input.clientId)
    if (!clientId) return { success: false, error: 'Not authenticated' }
    const row = {
      client_id: clientId,
      diagnosis: input.diagnosis?.trim() || null,
      diagnosis_year: num(input.diagnosis_year),
      medication: input.medication?.trim() || null,
      medication_dose: input.medication_dose?.trim() || null,
      medication_timing: input.medication_timing?.trim() || null,
      menopause_status: input.menopause_status?.trim() || null,
      conditions: input.conditions?.trim() || null,
      allergies: input.allergies?.trim() || null,
      notes: input.notes?.trim() || null,
      updated_at: new Date().toISOString(),
    }
    const { error } = await supabase.from('health_profiles').upsert(row, { onConflict: 'client_id' })
    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/health')
    revalidatePath(`/coach/client/${clientId}`)
    return { success: true }
  })
}

export async function listLabs(clientId?: string): Promise<LabResult[]> {
  return guard('health.listLabs', [], async () => {
    const { supabase, clientId: id } = await resolveClientId(clientId)
    if (!id) return []
    const { data } = await supabase
      .from('lab_results')
      .select('*')
      .eq('client_id', id)
      .order('taken_on', { ascending: true })
    return (data || []) as LabResult[]
  })
}

export async function addLab(input: Partial<LabResult> & { clientId?: string; taken_on: string }) {
  return guard('health.addLab', failed('Could not save these lab values.'), async () => {
    const { supabase, clientId } = await resolveClientId(input.clientId)
    if (!clientId) return { success: false, error: 'Not authenticated' }
    const { data: { user } } = await supabase.auth.getUser()
    if (!input.taken_on) return { success: false, error: 'Date is required' }
    // Sanitize extras: numeric values only, capped list, plain fields.
    const extras = Array.isArray(input.extras)
      ? input.extras
          .filter((e) => e && typeof e.name === "string" && e.name.trim() && num(e.value) !== null)
          .slice(0, 40)
          .map((e) => ({
            name: e.name.trim().slice(0, 60),
            value: num(e.value)!,
            unit: e.unit?.toString().trim().slice(0, 20) || null,
            low: num(e.low),
            high: num(e.high),
          }))
      : null

    const row = {
      client_id: clientId,
      taken_on: input.taken_on,
      tsh: num(input.tsh), t3: num(input.t3), t4: num(input.t4),
      vitamin_d: num(input.vitamin_d), b12: num(input.b12), ferritin: num(input.ferritin),
      weight_kg: num(input.weight_kg),
      notes: input.notes?.trim() || null,
      extras: extras && extras.length ? extras : null,
      source: input.source === "upload" ? "upload" : "manual",
      created_by: user?.id ?? null,
    }
    const { error } = await supabase.from('lab_results').insert(row)
    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/health')
    revalidatePath(`/coach/client/${clientId}`)
    return { success: true }
  })
}

export async function deleteLab(id: string, clientId?: string) {
  return guard('health.deleteLab', failed('Could not delete that entry.'), async () => {
    const { supabase } = await resolveClientId(clientId)
    const { error } = await supabase.from('lab_results').delete().eq('id', id)
    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/health')
    if (clientId) revalidatePath(`/coach/client/${clientId}`)
    return { success: true }
  })
}
