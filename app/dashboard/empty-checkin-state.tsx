'use client'

import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

export function EmptyCheckInState({ name }: { name: string }) {
  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ 
        background: "#090c14",
      }}
    >
      <motion.div
        className="flex flex-col items-center gap-6 max-w-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Empty State Illustration */}
        <motion.div
          className="w-24 h-24 rounded-full flex items-center justify-center mb-2"
          style={{
            background: 'radial-gradient(circle, rgba(45, 212, 191, 0.1) 0%, transparent 70%)',
            boxShadow: '0 0 60px rgba(45, 212, 191, 0.1)',
          }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 100, delay: 0.2 }}
        >
          <div 
            className="w-12 h-12 rounded-full"
            style={{ background: 'rgba(45, 212, 191, 0.2)' }}
          />
        </motion.div>

        {/* Heading */}
        <motion.h1
          className="text-3xl font-bold text-center"
          style={{
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontStyle: 'italic',
            color: '#e8eaf0',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          Your first check-in unlocks your trends
        </motion.h1>

        {/* Subtext */}
        <motion.p
          className="text-base text-center leading-relaxed"
          style={{ color: '#8892a4' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          Once you complete your first weekly check-in, we'll start tracking your energy, sleep, mood, and wellness trends here.
        </motion.p>

        {/* CTA Button */}
        <motion.div
          className="w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <Link href="/dashboard/check-in">
            <motion.button
              className="w-full py-4 rounded-full font-semibold text-base text-white flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #2dd4bf 0%, #22c55e 100%)',
                boxShadow: '0 0 32px rgba(45, 212, 191, 0.3)',
              }}
              whileHover={{ transform: 'translateY(-2px)', boxShadow: '0 0 48px rgba(45, 212, 191, 0.4)' }}
              whileTap={{ scale: 0.98 }}
            >
              Start Your First Check-In
              <ArrowRight size={18} />
            </motion.button>
          </Link>
        </motion.div>

        {/* Secondary info */}
        <motion.p
          className="text-sm text-center pt-4"
          style={{ color: '#5a6578' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          Takes about 5 minutes • Your data is secure
        </motion.p>
      </motion.div>
    </div>
  )
}
