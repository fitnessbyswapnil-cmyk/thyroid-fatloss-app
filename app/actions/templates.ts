'use server'

import { createClient } from '@/lib/supabase/server'
import type { PlanContent, PlanType } from '@/app/actions/plans'
import { revalidatePath } from 'next/cache'
import { guard, failed } from '@/lib/errors'

export interface PlanTemplate {
  id: string
  type: PlanType
  title: string
  content: PlanContent
  updated_at: string
  /** How many clients' current plans were started from this template. */
  usage: number
}

// RLS (templates_coach_all) restricts to the owning coach.
export async function listTemplates(type: PlanType): Promise<PlanTemplate[]> {
  return guard('templates.listTemplates', [], async () => {
    const supabase = await createClient()
    const [{ data }, { data: used }] = await Promise.all([
      supabase
        .from('plan_templates')
        .select('id, type, title, content, updated_at')
        .eq('type', type)
        .order('updated_at', { ascending: false }),
      // Plans record their template in content.templateId; count per template.
      supabase.from('plans').select('templateId:content->>templateId').eq('type', type),
    ])
    const counts = new Map<string, number>()
    for (const row of (used || []) as { templateId: string | null }[]) {
      if (row.templateId) counts.set(row.templateId, (counts.get(row.templateId) || 0) + 1)
    }
    return ((data || []) as Omit<PlanTemplate, 'usage'>[])
      .map((t) => ({ ...t, usage: counts.get(t.id) || 0 }))
      // Most-used first, so the templates that work are the ones in reach.
      .sort((a, b) => b.usage - a.usage || b.updated_at.localeCompare(a.updated_at))
  })
}

export async function saveTemplate(input: { type: PlanType; title: string; content: PlanContent }) {
  return guard('templates.saveTemplate', failed('Could not save that template.'), async () => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }
    const { error } = await supabase.from('plan_templates').insert({
      coach_id: user.id,
      type: input.type,
      title: input.title.trim() || 'Untitled template',
      content: input.content,
    })
    if (error) return { success: false, error: error.message }
    revalidatePath('/coach')
    return { success: true }
  })
}

export async function deleteTemplate(id: string) {
  return guard('templates.deleteTemplate', failed('Could not delete that template.'), async () => {
    const supabase = await createClient()
    const { error } = await supabase.from('plan_templates').delete().eq('id', id)
    if (error) return { success: false, error: error.message }
    return { success: true }
  })
}
