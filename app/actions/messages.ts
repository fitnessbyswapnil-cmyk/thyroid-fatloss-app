'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface Message {
  id: string
  client_id: string
  sender_id: string
  from_coach: boolean
  body: string
  created_at: string
}

async function ctx() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, isCoach: false }
  const { data: me } = await supabase.from('clients').select('role').eq('id', user.id).single()
  const isCoach = me?.role === 'coach' || me?.role === 'admin'
  return { supabase, user, isCoach }
}

/** clientId is required for the coach; a client always uses their own thread. */
export async function listMessages(clientId?: string): Promise<Message[]> {
  const { supabase, user, isCoach } = await ctx()
  if (!user) return []
  const threadId = isCoach ? clientId : user.id
  if (!threadId) return []
  const { data } = await supabase
    .from('messages')
    .select('*')
    .eq('client_id', threadId)
    .order('created_at', { ascending: true })

  // Mark the other side's messages as read for this viewer.
  const unread = (data || []).filter((m) => (isCoach ? !m.read_by_coach && m.from_coach === false : !m.read_by_client && m.from_coach === true))
  if (unread.length) {
    await supabase.from('messages').update(isCoach ? { read_by_coach: true } : { read_by_client: true }).in('id', unread.map((m) => m.id))
  }
  return (data || []) as Message[]
}

export async function sendMessage(body: string, clientId?: string) {
  const { supabase, user, isCoach } = await ctx()
  if (!user) return { success: false, error: 'Not authenticated' }
  const text = body.trim()
  if (!text) return { success: false, error: 'Empty message' }
  const threadId = isCoach ? clientId : user.id
  if (!threadId) return { success: false, error: 'No client selected' }

  const { error } = await supabase.from('messages').insert({
    client_id: threadId,
    sender_id: user.id,
    from_coach: isCoach,
    body: text.slice(0, 4000),
    read_by_coach: isCoach,
    read_by_client: !isCoach,
  })
  if (error) return { success: false, error: error.message }
  revalidatePath('/dashboard/messages')
  revalidatePath(`/coach/client/${threadId}/messages`)
  return { success: true }
}

/** Unread count for the current viewer (client: coach msgs; coach: all client msgs). */
export async function unreadCount(clientId?: string): Promise<number> {
  const { supabase, user, isCoach } = await ctx()
  if (!user) return 0
  let q = supabase.from('messages').select('id', { count: 'exact', head: true })
  if (isCoach) {
    q = q.eq('from_coach', false).eq('read_by_coach', false)
    if (clientId) q = q.eq('client_id', clientId)
  } else {
    q = q.eq('client_id', user.id).eq('from_coach', true).eq('read_by_client', false)
  }
  const { count } = await q
  return count || 0
}
