'use server'

import { put } from '@vercel/blob'
import { createClient } from '@/lib/supabase/server'

export interface PhotoUploadInput {
  frontPhotoBlob?: Blob
  sidePhotoBlob?: Blob
  backPhotoBlob?: Blob
  weekNumber: number
  notes?: string
}

export async function uploadProgressPhotos(input: PhotoUploadInput) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Upload a blob straight to Vercel Blob (private store). We keep the same
    // `${user.id}/...` path prefix that /api/file's ownership check relies on
    // (pathname.startsWith(user.id)), and return the pathname — not a URL —
    // since the store is private and files are served via /api/file.
    const uploadPhotoToBlob = async (blob: Blob | undefined, angle: string) => {
      if (!blob) return null

      const pathname = `${user.id}/progress-${angle}/${Date.now()}.jpg`
      const result = await put(pathname, blob, { access: 'private' })
      return result.pathname
    }

    // Upload all photos in parallel
    const [frontPath, sidePath, backPath] = await Promise.all([
      uploadPhotoToBlob(input.frontPhotoBlob, 'front'),
      uploadPhotoToBlob(input.sidePhotoBlob, 'side'),
      uploadPhotoToBlob(input.backPhotoBlob, 'back'),
    ])

    // Save metadata to progress_photos table
    const { data, error } = await supabase
      .from('progress_photos')
      .insert({
        client_id: user.id,
        front_photo: frontPath,
        side_photo: sidePath,
        back_photo: backPath,
        week_number: input.weekNumber,
        notes: input.notes || null })
      .select()
      .single()

    if (error) {
      console.error('[v0] Progress photo insert error:', error)
      return { success: false, error: 'Failed to save photo metadata' }
    }

    return { success: true, data }
  } catch (error) {
    console.error('[v0] Photo upload error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed' }
  }
}
