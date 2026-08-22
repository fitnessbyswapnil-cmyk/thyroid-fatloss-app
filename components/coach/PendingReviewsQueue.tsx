'use client'

import { motion } from 'framer-motion'
import { AlertCircle, ChevronRight, Clock } from 'lucide-react'
import { PendingReview } from '@/app/actions/coach-reviews'
import { useState } from 'react'
import { CheckInReviewScreen } from './CheckInReviewScreen'

interface PendingReviewsQueueProps {
  reviews: PendingReview[]
  onReviewComplete?: () => void
}

export function PendingReviewsQueue({ reviews, onReviewComplete }: PendingReviewsQueueProps) {
  const [selectedReview, setSelectedReview] = useState<PendingReview | null>(null)

  if (selectedReview) {
    return (
      <CheckInReviewScreen
        review={selectedReview}
        onClose={() => {
          setSelectedReview(null)
          onReviewComplete?.()
        }}
      />
    )
  }

  if (reviews.length === 0) {
    return (
      <motion.div
        className="rounded-2xl p-8 text-center"
        style={{
          background: '#ffffff',
          border: '1px solid #e2dbcd',
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(21, 94, 86, 0.1)' }}>
            <AlertCircle size={24} style={{ color: '#155e56' }} />
          </div>
        </div>
        <p className="text-lg font-semibold mb-2" style={{ color: '#1c1d20' }}>
          All caught up!
        </p>
        <p style={{ color: '#8b867c' }}>
          No pending reviews. Check back soon.
        </p>
      </motion.div>
    )
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold mb-4" style={{ color: '#1c1d20', fontFamily: "'Newsreader', Georgia, serif", fontStyle: 'italic' }}>
        Pending Reviews ({reviews.length})
      </h3>

      {reviews.map((review, idx) => (
        <motion.button
          key={review.id}
          onClick={() => setSelectedReview(review)}
          className="w-full text-left p-4 rounded-xl border transition-all hover:border-[#155e56]"
          style={{
            background: '#ffffff',
            border: '1px solid #e2dbcd',
          }}
          whileHover={{
            background: 'rgba(21, 94, 86, 0.08)',
            borderColor: 'rgba(21, 94, 86, 0.3)',
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Name & Week */}
              <div className="flex items-center gap-3 mb-2">
                <p className="font-semibold truncate" style={{ color: '#1c1d20' }}>
                  {review.client_name}
                </p>
                <span className="text-sm px-2 py-1 rounded-md" style={{ background: 'rgba(21, 94, 86, 0.1)', color: '#155e56' }}>
                  Week {review.week_number}
                </span>
              </div>

              {/* Summary Score + Delta */}
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold" style={{ color: '#155e56' }}>
                    {Math.round((review.energy + (10 - review.stress) + review.sleep_quality) / 3)}
                  </span>
                  <span className="text-xs" style={{ color: '#8b867c' }}>
                    /10
                  </span>
                </div>

                {/* Deltas */}
                {review.energy_delta !== undefined && (
                  <div className="flex items-center gap-4 text-xs">
                    <span style={{ color: review.energy_delta > 0 ? '#155e56' : '#9a3b2e' }}>
                      Energy {review.energy_delta > 0 ? '+' : ''}{review.energy_delta}
                    </span>
                    <span style={{ color: review.sleep_delta && review.sleep_delta > 0 ? '#155e56' : '#9a3b2e' }}>
                      Sleep {review.sleep_delta && review.sleep_delta > 0 ? '+' : ''}{review.sleep_delta}
                    </span>
                  </div>
                )}
              </div>

              {/* Flag Chip & Time Waiting */}
              <div className="flex items-center gap-2">
                {review.is_flagged && (
                  <span className="text-xs px-2 py-1 rounded-md font-semibold" style={{ background: 'rgba(154, 59, 46, 0.15)', color: '#9a3b2e' }}>
                    🚩 {review.flag_reason}
                  </span>
                )}
                <span className="text-xs flex items-center gap-1" style={{ color: '#8b867c' }}>
                  <Clock size={12} />
                  {review.weeks_ago === 0 ? 'This week' : `${review.weeks_ago}w ago`}
                </span>
              </div>
            </div>

            <ChevronRight size={20} style={{ color: '#8b867c', flexShrink: 0 }} />
          </div>
        </motion.button>
      ))}
    </div>
  )
}
