"use client"

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Upload, X, Check, Loader2 } from 'lucide-react'

interface PhotoUploadProps {
  type: 'profile' | 'progress-front' | 'progress-side' | 'progress-back'
  currentPhoto?: string | null
  onUploadComplete: (pathname: string) => void
  label?: string
  className?: string
}

export function PhotoUpload({ 
  type, 
  currentPhoto, 
  onUploadComplete, 
  label,
  className = '' 
}: PhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setError('Please select a JPEG, PNG, or WebP image')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be less than 10MB')
      return
    }

    setError(null)
    setIsUploading(true)
    setUploadProgress(0)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Upload failed')
      }

      const { pathname } = await response.json()
      setUploadProgress(100)
      
      // Wait a moment to show completion
      setTimeout(() => {
        onUploadComplete(pathname)
        setIsUploading(false)
        setUploadProgress(0)
      }, 500)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      setIsUploading(false)
      setUploadProgress(0)
      setPreviewUrl(null)
    }
  }

  const displayImage = previewUrl || (currentPhoto ? `/api/file?pathname=${encodeURIComponent(currentPhoto)}` : null)

  return (
    <div className={`relative ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />

      <motion.button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden"
        style={{
          background: displayImage ? 'transparent' : '#ffffff',
          border: '1px dashed #cfc7b6',
        }}
        whileHover={{ scale: isUploading ? 1 : 1.02 }}
        whileTap={{ scale: isUploading ? 1 : 0.98 }}
      >
        {displayImage ? (
          <img
            src={displayImage}
            alt={label || type}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(21, 94, 86, 0.15)' }}
            >
              <Camera className="w-6 h-6" style={{ color: '#155e56' }} />
            </div>
            <span className="text-sm" style={{ color: '#8b867c' }}>
              {label || 'Add Photo'}
            </span>
          </div>
        )}

        {/* Upload overlay */}
        <AnimatePresence>
          {isUploading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-3"
              style={{ background: 'rgba(28, 29, 32, 0.45)' }}
            >
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#155e56' }} />
              <div className="w-32 h-1.5 rounded-full overflow-hidden" style={{ background: '#cfc7b6' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: '#155e56' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <span className="text-xs" style={{ color: '#8b867c' }}>
                {uploadProgress < 100 ? 'Uploading...' : 'Complete!'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success indicator */}
        {displayImage && !isUploading && (
          <div 
            className="absolute bottom-2 right-2 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(21, 94, 86, 0.9)' }}
          >
            <Check className="w-4 h-4 text-white" />
          </div>
        )}
      </motion.button>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute -bottom-8 left-0 right-0 text-center text-xs"
            style={{ color: '#9a3b2e' }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
