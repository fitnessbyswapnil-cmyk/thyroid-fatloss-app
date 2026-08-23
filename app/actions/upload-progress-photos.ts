'use server'

import { createClient } from '@/lib/supabase/server'

export interface PhotoPathsInput {
  frontPath?: string | null
  sidePath?: string | null
  backPath?: string | null
  weekNumber: number
  notes?: string
}

/**
 * Record a set of progress photos that are ALREADY in blob storage.
 *
 * The blobs themselves no longer travel through this server action. Next.js caps
 * a server action body at 1 MB unless configured otherwise, and this took three
 * photographs at once — so on a real phone, where each is 2-5 MB, the guided
 * flow could never complete an upload. They now go one at a time through
 * /api/upload, which is a route handler and accepts a far larger body, and a
 * failure costs her one retake instead of all three.
 *
 * The `${user.id}/...` path prefix is preserved because /api/file's ownership
 * check depends on it.
 */
export async function saveProgressPhotoPaths(input: PhotoPathsInput) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    const owns = (p?: string | null) => !p || p.startsWith(`${user.id}/`)
    if (!owns(input.frontPath) || !owns(input.sidePath) || !owns(input.backPath)) {
      return { success: false, error: 'Those photos do not belong to this account' }
    }

    if (!input.frontPath && !input.sidePath && !input.backPath) {
      return { success: false, error: 'No photos to save' }
    }

    const { data, error } = await supabase
      .from('progress_photos')
      .insert({
        client_id: user.id,
        front_photo: input.frontPath || null,
        side_photo: input.sidePath || null,
        back_photo: input.backPath || null,
        week_number: input.weekNumber,
        notes: input.notes || null,
      })
      .select()
      .single()

    if (error) {
      console.error('[progress-photos] insert failed:', error)
      return { success: false, error: 'Your photos uploaded but we could not record them. Please try again.' }
    }

    return { success: true, data }
  } catch (error) {
    console.error('[progress-photos] save failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Could not save your photos' }
  }
}
