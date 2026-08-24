'use client'

import { motion } from 'framer-motion'
import { AlertCircle, ChevronRight, Clock } from 'lucide-react'
import { PendingReview } from '@/app/actions/coach-reviews'
import { useState } from 'react'
import { CheckInReviewScreen } from './CheckInReviewScreen'
import { deltaTone } from "@/lib/coach/delta-tone"
import { useStaggeredEntrance } from "@/components/ui/stagger"

interface PendingReviewsQueueProps {
  reviews: PendingReview[]
  onReviewComplete?: () => void
}

export function PendingReviewsQueue({ reviews, onReviewComplete }: PendingReviewsQueueProps) {
  const [selectedReview, setSelectedReview] = useState<PendingReview | null>(null)

  // Was idx * 0.05 uncapped: a Monday queue of 15 check-ins took 750ms to
  // finish appearing before the coach could click the first one.
  const entrance = useStaggeredEntrance(0.04, 10)

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
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(45, 212, 191, 0.1)' }}>
            <AlertCircle size={24} style={{ color: '#2dd4bf' }} />
          </div>
        </div>
        <p className="text-lg font-semibold mb-2" style={{ color: '#e8eaf0' }}>
          All caught up!
        </p>
        <p style={{ color: '#8892a4' }}>
          No pending reviews. Check back soon.
        </p>
      </motion.div>
    )
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold mb-4" style={{ color: '#e8eaf0', fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: 'italic' }}>
        Pending Reviews ({reviews.length})
      </h3>

      {reviews.map((review, idx) => (
        <motion.button
          key={review.id}
          onClick={() => setSelectedReview(review)}
          className="w-full text-left p-4 rounded-xl border transition-all hover:border-[#2dd4bf]"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
          whileHover={{
            background: 'rgba(45, 212, 191, 0.08)',
            borderColor: 'rgba(45, 212, 191, 0.3)',
          }}
          {...entrance(idx)}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Name & Week */}
              <div className="flex items-center gap-3 mb-2">
                <p className="font-semibold truncate" style={{ color: '#e8eaf0' }}>
                  {review.client_name}
                </p>
                <span className="text-sm px-2 py-1 rounded-md" style={{ background: 'rgba(45, 212, 191, 0.1)', color: '#2dd4bf' }}>
                  {review.programme_week ? `Week ${review.programme_week}` : new Date(review.submitted_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>
              </div>

              {/* Summary Score + Delta */}
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold" style={{ color: '#2dd4bf' }}>
                    {Math.round((review.energy + (10 - review.stress) + review.sleep_quality) / 3)}
                  </span>
                  <span className="text-xs" style={{ color: '#8892a4' }}>
                    /10
                  </span>
                </div>

                {/* Deltas */}
                {review.energy_delta !== undefined && (
                  <div className="flex items-center gap-4 text-xs">
                    <span style={{ color: deltaTone(review.energy_delta, 'up').color }}>
                      Energy {review.energy_delta > 0 ? '+' : ''}{review.energy_delta}
                    </span>
                    <span style={{ color: deltaTone(review.sleep_delta, 'up').color }}>
                      Sleep {review.sleep_delta && review.sleep_delta > 0 ? '+' : ''}{review.sleep_delta}
                    </span>
                  </div>
                )}
              </div>

              {/* Flag Chip & Time Waiting */}
              <div className="flex items-center gap-2">
                {review.is_flagged && (
                  <span className="text-xs px-2 py-1 rounded-md font-semibold" style={{ background: 'rgba(245, 158, 11, 0.14)', color: '#f59e0b' }}>
                    {review.flag_reason}
                  </span>
                )}
                <span className="text-xs flex items-center gap-1" style={{ color: '#8892a4' }}>
                  <Clock size={12} />
                  {review.weeks_ago === 0 ? 'This week' : `${review.weeks_ago}w ago`}
                </span>
              </div>
            </div>

            <ChevronRight size={20} style={{ color: '#8892a4', flexShrink: 0 }} />
          </div>
        </motion.button>
      ))}
    </div>
  )
}
