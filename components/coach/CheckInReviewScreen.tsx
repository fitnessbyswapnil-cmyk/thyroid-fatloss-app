'use client'

import { motion } from 'framer-motion'
import { ChevronLeft, AlertCircle, Send } from 'lucide-react'
import { PendingReview, getCheckInDetail, submitCheckInFeedback } from '@/app/actions/coach-reviews'
import { useState, useEffect } from 'react'

interface CheckInReviewScreenProps {
  review: PendingReview
  onClose: () => void
}

export function CheckInReviewScreen({ review, onClose }: CheckInReviewScreenProps) {
  const [detail, setDetail] = useState<any>(null)
  const [feedback, setFeedback] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchDetail = async () => {
      const result = await getCheckInDetail(review.id)
      if (result.error) {
        setSubmitError(result.error)
      } else {
        setDetail(result)
      }
      setIsLoading(false)
    }
    fetchDetail()
  }, [review.id])

  const handleSubmitFeedback = async () => {
    if (!feedback.trim()) return

    setIsSubmitting(true)
    setSubmitError(null)

    const result = await submitCheckInFeedback(review.id, feedback)
    if (!result.success) {
      setSubmitError(result.error || 'Failed to submit feedback')
      setIsSubmitting(false)
    } else {
      setFeedback('')
      setIsSubmitting(false)
      // Show success and close after brief delay
      setTimeout(() => onClose(), 1500)
    }
  }

  if (isLoading) {
    return (
      <motion.div
        className="flex items-center justify-center h-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="text-center">
          <div className="w-8 h-8 rounded-full border-2 border-[#155e56] border-t-transparent animate-spin mx-auto mb-3" />
          <p style={{ color: '#8b867c' }}>Loading review...</p>
        </div>
      </motion.div>
    )
  }

  const weekScore = Math.round((review.energy + (10 - review.stress) + review.sleep_quality) / 3)

  return (
    <motion.div
      className="flex flex-col h-full overflow-y-auto pb-safe"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
    >
      {/* Header with back button */}
      <div className="sticky top-0 z-40 px-6 py-4 flex items-center justify-between border-b" style={{ background: 'rgba(28, 29, 32, 0.45)', borderColor: '#e2dbcd' }}>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-white/10 transition"
        >
          <ChevronLeft size={24} style={{ color: '#155e56' }} />
        </button>
        <div className="text-center flex-1">
          <h2 className="font-semibold" style={{ color: '#1c1d20', fontFamily: "'Newsreader', Georgia, serif", fontStyle: 'italic' }}>
            {review.client_name}
          </h2>
          <p className="text-xs" style={{ color: '#8b867c' }}>
            Week {review.week_number}
          </p>
        </div>
        <div className="w-10" />
      </div>

      <div className="flex-1 px-6 py-6 space-y-6 overflow-y-auto">
        {/* Score + Key Deltas */}
        <motion.div
          className="rounded-xl p-4 border"
          style={{
            background: 'rgba(21, 94, 86, 0.08)',
            border: '1px solid rgba(21, 94, 86, 0.25)',
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-baseline justify-between mb-3">
            <span className="text-4xl font-bold" style={{ color: '#155e56' }}>
              {weekScore}
            </span>
            <span style={{ color: '#8b867c', fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              This Week
            </span>
          </div>

          {/* Deltas */}
          <div className="space-y-2">
            {review.energy_delta !== undefined && (
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: '#1c1d20' }}>Energy</span>
                <span style={{ color: review.energy_delta > 0 ? '#155e56' : '#9a3b2e', fontWeight: 600 }}>
                  {review.energy} {review.energy_delta > 0 ? '+' : ''}{review.energy_delta}
                </span>
              </div>
            )}
            {review.sleep_delta !== undefined && (
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: '#1c1d20' }}>Sleep</span>
                <span style={{ color: review.sleep_delta > 0 ? '#155e56' : '#9a3b2e', fontWeight: 600 }}>
                  {review.sleep_quality} {review.sleep_delta > 0 ? '+' : ''}{review.sleep_delta}
                </span>
              </div>
            )}
            {review.weight_delta !== undefined && review.weight !== undefined && (
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: '#1c1d20' }}>Weight</span>
                <span style={{ color: review.weight_delta < 0 ? '#155e56' : '#9a3b2e', fontWeight: 600 }}>
                  {review.weight.toFixed(1)}kg {review.weight_delta < 0 ? '' : '+'}{review.weight_delta.toFixed(1)}
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Client Reflection - Highlighted */}
        {review.reflection && (
          <motion.div
            className="rounded-xl p-4 border"
            style={{
              background: '#ffffff',
              border: '1px solid #e2dbcd',
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <label className="text-xs uppercase font-medium mb-2 block" style={{ color: '#8b867c', letterSpacing: '0.08em' }}>
              Client's Reflection
            </label>
            <p className="leading-relaxed" style={{ color: '#1c1d20' }}>
              {review.reflection}
            </p>
          </motion.div>
        )}

        {/* Photos Side by Side */}
        {detail?.photos && detail.photos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <label className="text-xs uppercase font-medium mb-3 block" style={{ color: '#8b867c', letterSpacing: '0.08em' }}>
              Progress Photos ({detail.photos.length})
            </label>
            <div className="grid grid-cols-2 gap-3">
              {detail.photos.map((photo: any, idx: number) => (
                <div
                  key={photo.id}
                  className="aspect-square rounded-lg overflow-hidden border"
                  style={{ background: '#ffffff', border: '1px solid #e2dbcd' }}
                >
                  <img
                    src={`/api/file?pathname=${encodeURIComponent(photo.file_path)}`}
                    alt={`Photo ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Most Changed Metrics */}
        {detail?.prevWeek && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <label className="text-xs uppercase font-medium mb-3 block" style={{ color: '#8b867c', letterSpacing: '0.08em' }}>
              Most Changed
            </label>
            <div className="space-y-2">
              {/* Digestion */}
              {detail.checkin?.digestion_score && (
                <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: '#ffffff' }}>
                  <span style={{ color: '#1c1d20' }}>Digestion</span>
                  <span style={{ color: '#155e56', fontWeight: 600 }}>
                    {detail.checkin.digestion_score}/10
                  </span>
                </div>
              )}
              {/* Stress */}
              {review.stress !== undefined && (
                <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: '#ffffff' }}>
                  <span style={{ color: '#1c1d20' }}>Stress Level</span>
                  <span style={{ color: review.stress > 7 ? '#9a3b2e' : '#155e56', fontWeight: 600 }}>
                    {review.stress}/10
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Error Alert */}
        {submitError && (
          <motion.div
            className="p-3 rounded-lg border flex items-start gap-3"
            style={{ background: 'rgba(154, 59, 46, 0.1)', border: '1px solid rgba(154, 59, 46, 0.2)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <AlertCircle size={16} style={{ color: '#9a3b2e', marginTop: '2px', flexShrink: 0 }} />
            <p className="text-sm" style={{ color: '#9a3b2e' }}>
              {submitError}
            </p>
          </motion.div>
        )}
      </div>

      {/* Feedback Box - Sticky Bottom */}
      <div
        className="border-t p-4"
        style={{
          background: 'rgba(28, 29, 32, 0.45)',
          borderColor: '#e2dbcd',
        }}
      >
        <label className="text-xs uppercase font-medium mb-2 block" style={{ color: '#8b867c', letterSpacing: '0.08em' }}>
          Your Feedback
        </label>
        <div className="flex gap-3">
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Send your feedback to the client..."
            disabled={isSubmitting}
            className="flex-1 p-3 rounded-lg text-sm bg-[#ffffff] border border-[#e2dbcd] text-white placeholder-[#a09a8e] focus:outline-none focus:border-[#155e56] resize-none"
            style={{ minHeight: '80px' }}
          />
          <button
            onClick={handleSubmitFeedback}
            disabled={isSubmitting || !feedback.trim()}
            className="px-4 py-3 rounded-lg flex items-center justify-center disabled:opacity-50 transition"
            style={{
              background: 'linear-gradient(135deg, #155e56 0%, #155e56 100%)',
              boxShadow: '0 0 24px rgba(21, 94, 86, 0.2)',
            }}
          >
            <Send size={18} style={{ color: 'white' }} />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
