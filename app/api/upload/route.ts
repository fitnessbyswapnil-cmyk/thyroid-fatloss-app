"use server"

import { put } from '@vercel/blob'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string // 'profile', 'progress-front', 'progress-side', 'progress-back'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type (images for photos, PDF for coach plans)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only JPEG, PNG, WebP, and PDF are allowed.' }, { status: 400 })
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 400 })
    }

    // Generate unique filename with user ID prefix for organization
    const timestamp = Date.now()
    const extension = file.name.split('.').pop()
    // `type` becomes a folder name, so only a plain slug is allowed — it must
    // never be able to climb out of the caller's own `${user.id}/` prefix.
    const folder = /^[a-z0-9-]{1,40}$/.test(type || '') ? type : 'uploads'
    const ext = (extension || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5) || 'bin'
    const pathname = `${user.id}/${folder}/${timestamp}.${ext}`

    // Upload to Vercel Blob (private store)
    const blob = await put(pathname, file, {
      access: 'private',
    })

    // Return the pathname (not the URL since it's private)
    return NextResponse.json({ 
      pathname: blob.pathname,
      success: true 
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
