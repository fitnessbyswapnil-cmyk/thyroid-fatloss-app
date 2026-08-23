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
}

// RLS (templates_coach_all) restricts to the owning coach.
export async function listTemplates(type: PlanType): Promise<PlanTemplate[]> {
  return guard('templates.listTemplates', [], async () => {
    const supabase = await createClient()
    const { data } = await supabase
      .from('plan_templates')
      .select('id, type, title, content, updated_at')
      .eq('type', type)
      .order('updated_at', { ascending: false })
    return (data || []) as PlanTemplate[]
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
