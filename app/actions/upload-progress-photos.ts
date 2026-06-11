'use server'

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

    // Convert blobs to form data for upload endpoint
    const uploadPhotoToBlob = async (blob: Blob, filename: string) => {
      if (!blob) return null

      const formData = new FormData()
      formData.append('file', blob, filename)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Photo upload failed')
      }

      const { url } = await response.json()
      return url
    }

    // Upload all photos in parallel
    const [frontUrl, sideUrl, backUrl] = await Promise.all([
      input.frontPhotoBlob ? uploadPhotoToBlob(input.frontPhotoBlob, `front-${Date.now()}.jpg`) : Promise.resolve(null),
      input.sidePhotoBlob ? uploadPhotoToBlob(input.sidePhotoBlob, `side-${Date.now()}.jpg`) : Promise.resolve(null),
      input.backPhotoBlob ? uploadPhotoToBlob(input.backPhotoBlob, `back-${Date.now()}.jpg`) : Promise.resolve(null),
    ])

    // Save metadata to progress_photos table
    const { data, error } = await supabase
      .from('progress_photos')
      .insert({
        client_id: user.id,
        front_photo: frontUrl,
        side_photo: sideUrl,
        back_photo: backUrl,
        week_number: input.weekNumber,
        notes: input.notes || null,
      })
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
      error: error instanceof Error ? error.message : 'Upload failed' 
    }
  }
}
