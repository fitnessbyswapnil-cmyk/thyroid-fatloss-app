"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Camera, Calendar, Check, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PhotoUpload } from '@/components/dashboard/PhotoUpload'

export default function ProgressPhotosPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [weekNumber, setWeekNumber] = useState(1)
  const [photos, setPhotos] = useState({
    front: null as string | null,
    side: null as string | null,
    back: null as string | null })
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    // Calculate current week number based on start date
    async function getWeekNumber() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: client } = await supabase
          .from('clients')
          .select('start_date')
          .eq('id', user.id)
          .single()
        
        if (client?.start_date) {
          const startDate = new Date(client.start_date)
          const today = new Date()
          const diffTime = Math.abs(today.getTime() - startDate.getTime())
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          setWeekNumber(Math.ceil(diffDays / 7))
        }
      }
    }
    getWeekNumber()
  }, [])

  const handleSubmit = async () => {
    if (!photos.front && !photos.side && !photos.back) {
      setError('Please upload at least one photo')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('Not authenticated')
      }

      const { error: insertError } = await supabase
        .from('progress_photos')
        .insert({
          client_id: user.id,
          front_photo: photos.front,
          side_photo: photos.side,
          back_photo: photos.back,
          week_number: weekNumber,
          notes: notes || null })

      if (insertError) throw insertError

      setSuccess(true)
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit photos')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-6"
        style={{ background: '#F4F0E8' }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
            style={{ background: 'rgba(21, 94, 86, 0.15)' }}
          >
            <Check className="w-10 h-10" style={{ color: '#155e56' }} />
          </motion.div>
          <h2 
            className="text-2xl font-semibold mb-2"
            style={{ color: '#1c1d20' }}
          >
            Photos Submitted!
          </h2>
          <p style={{ color: '#8b867c' }}>
            Your coach will review them soon
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen pb-32"
      style={{ background: '#F4F0E8' }}
    >
      {/* Header */}
      <div 
        className="sticky top-0 z-50 px-4 py-4"
        style={{
          background: 'rgba(253, 251, 247, 0.92)', 
          borderBottom: '1px solid #e2dbcd' }}
      >
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: '#e2dbcd' }}
            >
              <ArrowLeft className="w-5 h-5" style={{ color: '#1c1d20' }} />
            </motion.div>
          </Link>
          <div>
            <h1 
              className="text-xl font-semibold"
              style={{ color: '#1c1d20' }}
            >
              Progress Photos
            </h1>
            <p className="text-sm" style={{ color: '#8b867c' }}>
              Week {weekNumber} Check-in
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-8">
        {/* Week indicator */}
        <div 
          className="flex items-center gap-3 p-4 rounded-2xl"
          style={{ background: '#FDFBF7' }}
        >
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(21, 94, 86, 0.15)' }}
          >
            <Calendar className="w-6 h-6" style={{ color: '#155e56' }} />
          </div>
          <div>
            <p className="text-sm" style={{ color: '#8b867c' }}>
              Submitting for
            </p>
            <p 
              className="text-lg font-semibold"
              style={{ color: '#1c1d20' }}
            >
              Week {weekNumber}
            </p>
          </div>
        </div>

        {/* Photo uploads */}
        <div>
          <h2 
            className="text-sm font-medium uppercase mb-4"
            style={{ color: '#8b867c', letterSpacing: '0.08em' }}
          >
            Your Progress Photos
          </h2>
          
          <div className="grid grid-cols-3 gap-3">
            <PhotoUpload
              type="progress-front"
              currentPhoto={photos.front}
              onUploadComplete={(pathname) => setPhotos(prev => ({ ...prev, front: pathname }))}
              label="Front"
            />
            <PhotoUpload
              type="progress-side"
              currentPhoto={photos.side}
              onUploadComplete={(pathname) => setPhotos(prev => ({ ...prev, side: pathname }))}
              label="Side"
            />
            <PhotoUpload
              type="progress-back"
              currentPhoto={photos.back}
              onUploadComplete={(pathname) => setPhotos(prev => ({ ...prev, back: pathname }))}
              label="Back"
            />
          </div>

          <p className="text-xs mt-3" style={{ color: '#a09a8e' }}>
            Tip: Take photos in good lighting, wearing fitted clothing
          </p>
        </div>

        {/* Notes */}
        <div>
          <h2 
            className="text-sm font-medium uppercase mb-3"
            style={{ color: '#8b867c', letterSpacing: '0.08em' }}
          >
            Notes (Optional)
          </h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How are you feeling this week? Any changes you've noticed?"
            rows={4}
            className="w-full rounded-2xl px-4 py-4 text-sm resize-none focus:outline-none"
            style={{
              background: '#FDFBF7',
              border: '1px solid #e2dbcd',
              color: '#1c1d20' }}
          />
        </div>

        {/* Error message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl text-center"
            style={{ background: 'rgba(154, 59, 46, 0.15)', color: '#A32B23' }}
          >
            {error}
          </motion.div>
        )}
      </div>

      {/* Submit button */}
      <div 
        className="fixed bottom-0 left-0 right-0 p-4"
        style={{
          background: 'linear-gradient(to top, rgba(10, 13, 20, 1) 0%, rgba(10, 13, 20, 0) 100%)',
          paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        <motion.button
          onClick={handleSubmit}
          disabled={isSubmitting || (!photos.front && !photos.side && !photos.back)}
          whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
          whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
          className="w-full py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          style={{
            background: 'linear-gradient(135deg, #155e56 0%, #7FA196 100%)',
            color: '#F6F3ED' }}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Camera className="w-5 h-5" />
              Submit Progress Photos
            </>
          )}
        </motion.button>
      </div>
    </div>
  )
}
