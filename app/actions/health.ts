'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthUser } from '@/lib/supabase/auth'
import { after } from 'next/server'
import { pushToUsers } from '@/lib/push/send'
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

    // lab_results_has_a_value (migration 023) rejects a row carrying only a
    // date. Without this the client would read the raw constraint violation,
    // so say the same thing the upload sheet already says. notes is excluded
    // on purpose, matching the constraint: a note plots nothing.
    const hasAValue =
      row.tsh !== null || row.t3 !== null || row.t4 !== null ||
      row.vitamin_d !== null || row.b12 !== null || row.ferritin !== null ||
      row.weight_kg !== null || row.extras !== null
    if (!hasAValue) return { success: false, error: 'Add at least one value before saving.' }

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

// ── Lab report files ─────────────────────────────────────────────────────────
//
// The client uploads a photo or PDF of her report; the coach reads it and types
// the values into lab_results. The file lives in private Blob (served only
// through /api/file, which checks owner-or-coach); lab_reports records that it
// exists and whether its values have been entered yet.

export interface LabReport {
  id: string
  client_id: string
  pathname: string
  content_type: string | null
  uploaded_at: string
  entered_at: string | null
}

/** Record a report she has just uploaded, and tell the coach. */
export async function registerLabReport(input: { pathname: string; contentType?: string | null }) {
  return guard('health.registerLabReport', failed('Your report uploaded, but we could not record it. Please try again.'), async () => {
    const supabase = await createClient()
    const user = await getAuthUser(supabase)
    if (!user) return { success: false, error: 'Not authenticated' }
    // Only a file in her own lab-report folder; the table enforces the same rule.
    if (!input.pathname?.startsWith(`${user.id}/lab-report/`)) return { success: false, error: 'That file is not yours.' }

    const { error } = await supabase.from('lab_reports').insert({
      client_id: user.id,
      pathname: input.pathname,
      content_type: input.contentType?.slice(0, 60) ?? null,
    })
    if (error) return { success: false, error: error.message }

    after(async () => {
      const db = createAdminClient()
      const [{ data: coaches }, { data: me }] = await Promise.all([
        db.from('clients').select('id').in('role', ['coach', 'admin']),
        db.from('clients').select('full_name').eq('id', user.id).maybeSingle(),
      ])
      await pushToUsers((coaches || []).map((c) => c.id), {
        title: 'New blood report',
        body: `${me?.full_name?.split(' ')[0] || 'A client'} uploaded a report. Enter the values when you can.`,
        url: `/coach/client/${user.id}#health`,
        tag: 'lab_report',
      })
    })

    revalidatePath('/dashboard/progress')
    revalidatePath('/dashboard/health')
    revalidatePath('/coach')
    return { success: true }
  })
}

export async function listLabReports(clientId?: string): Promise<LabReport[]> {
  return guard('health.listLabReports', [], async () => {
    const { supabase, clientId: id } = await resolveClientId(clientId)
    if (!id) return []
    const { data } = await supabase
      .from('lab_reports')
      .select('id, client_id, pathname, content_type, uploaded_at, entered_at')
      .eq('client_id', id)
      .order('uploaded_at', { ascending: false })
      .limit(20)
    return (data || []) as LabReport[]
  })
}

/** Coach: this report's values are now in lab_results (or it needs none). */
export async function markLabReportEntered(id: string, entered = true) {
  return guard('health.markLabReportEntered', failed('Could not update that report.'), async () => {
    const supabase = await createClient()
    const user = await getAuthUser(supabase)
    if (!user) return { success: false, error: 'Not authenticated' }
    const { data: me } = await supabase.from('clients').select('role').eq('id', user.id).maybeSingle()
    if (me?.role !== 'coach' && me?.role !== 'admin') return { success: false, error: 'Only your coach can do that.' }

    const { data, error } = await supabase
      .from('lab_reports')
      .update({ entered_at: entered ? new Date().toISOString() : null, entered_by: entered ? user.id : null })
      .eq('id', id)
      .select('client_id')
      .maybeSingle()
    if (error) return { success: false, error: error.message }
    if (data?.client_id) revalidatePath(`/coach/client/${data.client_id}/health`)
    revalidatePath('/coach')
    return { success: true }
  })
}
