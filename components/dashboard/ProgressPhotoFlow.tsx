'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, CheckCircle2, ChevronLeft } from 'lucide-react'
import { PhotoCapture } from './PhotoCapture'
import { saveProgressPhotoPaths } from '@/app/actions/upload-progress-photos'
import { uploadPhoto } from '@/lib/photos/prepare'

interface PhotoFlowProps {
  checkInWeek: number
}

type Step = 'purpose' | 'privacy' | 'consent' | 'tips' | 'capture' | 'aftercare'
type CaptureAngle = 'front' | 'side' | 'back'

export function ProgressPhotoFlow({ checkInWeek }: PhotoFlowProps) {
  const [step, setStep] = useState<Step>('purpose')
  const [consent, setConsent] = useState(false)
  const [currentAngle, setCurrentAngle] = useState<CaptureAngle>('front')
  const [photos, setPhotos] = useState<{ front?: Blob; side?: Blob; back?: Blob }>({})
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handlePhotoCapture = (blob: Blob) => {
    setPhotos((prev) => ({
      ...prev,
      [currentAngle]: blob,
    }))

    if (currentAngle === 'front') {
      setCurrentAngle('side')
    } else if (currentAngle === 'side') {
      setCurrentAngle('back')
    } else {
      // All photos captured, move to aftercare
      handleUploadPhotos(blob)
    }
  }

  const handleUploadPhotos = async (lastBlob: Blob) => {
    setIsUploading(true)
    setUploadError(null)

    try {
      // One request per photo, through the route handler. Each is shrunk in the
      // browser first — a 4000px photograph costs her mobile data and tells the
      // coach nothing a 1440px one doesn't.
      const [frontPath, sidePath, backPath] = await Promise.all([
        photos.front ? uploadPhoto(photos.front, 'front') : Promise.resolve(null),
        photos.side ? uploadPhoto(photos.side, 'side') : Promise.resolve(null),
        lastBlob ? uploadPhoto(lastBlob, 'back') : Promise.resolve(null),
      ])

      const result = await saveProgressPhotoPaths({
        frontPath,
        sidePath,
        backPath,
        weekNumber: checkInWeek,
        notes: 'First-time progress photos',
      })

      if (!result.success) {
        setUploadError(result.error || 'Upload failed')
        return
      }

      setStep('aftercare')
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSkip = () => {
    window.location.href = '/dashboard'
  }

  return (
    <AnimatePresence mode="wait">
      {/* 1. Purpose Reframe */}
      {step === 'purpose' && (
        <motion.div
          key="purpose"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex flex-col items-center justify-center h-full gap-8 px-6 py-12 text-center"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{
              background: 'radial-gradient(circle, rgba(45, 212, 191, 0.2) 0%, transparent 70%)',
              boxShadow: '0 0 40px rgba(45, 212, 191, 0.15)',
            }}
          >
            <div className="w-8 h-8 rounded-full" style={{ background: '#2dd4bf' }} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4 max-w-md"
          >
            <h2
              className="text-3xl font-bold"
              style={{
                fontFamily: "'Instrument Serif', Georgia, serif",
                fontStyle: 'italic',
                color: '#e8eaf0',
              }}
            >
              A Gift to Tomorrow
            </h2>
            <p className="text-lg leading-relaxed" style={{ color: '#8892a4' }}>
              These photos are for the you who's 8 weeks from here. You'll look back and see the changes you couldn't see along the way.
            </p>
            <p className="text-base" style={{ color: '#5a6578' }}>
              This is your baseline, not a verdict. No judgment, only progress.
            </p>
          </motion.div>

          <motion.div
            className="flex gap-3 w-full max-w-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <motion.button
              onClick={handleSkip}
              className="flex-1 py-3 rounded-full font-semibold"
              style={{
                background: 'rgba(255,255,255,0.05)',
                color: '#8892a4',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Skip for Now
            </motion.button>
            <motion.button
              onClick={() => setStep('privacy')}
              className="flex-1 py-3 rounded-full font-semibold text-white"
              style={{
                background: 'linear-gradient(135deg, #2dd4bf 0%, #22c55e 100%)',
                boxShadow: '0 0 32px rgba(45,212,191,0.3)',
              }}
              whileHover={{ transform: 'translateY(-2px)' }}
              whileTap={{ scale: 0.98 }}
            >
              Begin
            </motion.button>
          </motion.div>
        </motion.div>
      )}

      {/* 2. Privacy Assurance */}
      {step === 'privacy' && (
        <motion.div
          key="privacy"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex flex-col items-center justify-center h-full gap-8 px-6 py-12 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="p-4 rounded-full"
            style={{
              background: 'rgba(45, 212, 191, 0.1)',
            }}
          >
            <Lock size={48} style={{ color: '#2dd4bf' }} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6 max-w-md"
          >
            <h2
              className="text-3xl font-bold"
              style={{
                fontFamily: "'Instrument Serif', Georgia, serif",
                fontStyle: 'italic',
                color: '#e8eaf0',
              }}
            >
              Your Privacy Protected
            </h2>

            <div className="space-y-4">
              {['Only you and your coach see these.', 'Encrypted and private.', 'Never shared publicly.', 'Delete anytime you choose.'].map(
                (text, i) => (
                  <motion.div
                    key={text}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <div className="mt-1" style={{ color: '#2dd4bf' }}>
                      ✓
                    </div>
                    <p style={{ color: '#e8eaf0' }}>{text}</p>
                  </motion.div>
                )
              )}
            </div>
          </motion.div>

          <motion.button
            onClick={() => setStep('consent')}
            className="w-full max-w-sm py-4 rounded-full font-semibold text-white"
            style={{
              background: 'linear-gradient(135deg, #2dd4bf 0%, #22c55e 100%)',
              boxShadow: '0 0 32px rgba(45,212,191,0.3)',
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            whileHover={{ transform: 'translateY(-2px)' }}
            whileTap={{ scale: 0.98 }}
          >
            I Understand
          </motion.button>
        </motion.div>
      )}

      {/* 3. Consent Toggle */}
      {step === 'consent' && (
        <motion.div
          key="consent"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex flex-col items-center justify-center h-full gap-8 px-6 py-12 text-center"
        >
          <motion.h2
            className="text-3xl font-bold"
            style={{
              fontFamily: "'Instrument Serif', Georgia, serif",
              fontStyle: 'italic',
              color: '#e8eaf0',
            }}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Ready to Begin?
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-full max-w-sm space-y-4"
          >
            <label className="flex items-start gap-4 p-4 rounded-xl cursor-pointer" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="w-6 h-6 mt-1"
                style={{ accentColor: '#2dd4bf' }}
              />
              <span style={{ color: '#e8eaf0' }}>
                I consent to capture and store my progress photos securely, understand only my coach sees them, and can delete them anytime.
              </span>
            </label>
          </motion.div>

          <motion.button
            onClick={() => setStep('tips')}
            disabled={!consent}
            className="w-full max-w-sm py-4 rounded-full font-semibold text-white disabled:opacity-50"
            style={{
              background: consent ? 'linear-gradient(135deg, #2dd4bf 0%, #22c55e 100%)' : 'rgba(255,255,255,0.1)',
              boxShadow: consent ? '0 0 32px rgba(45,212,191,0.3)' : 'none',
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={consent ? { transform: 'translateY(-2px)' } : {}}
            whileTap={consent ? { scale: 0.98 } : {}}
          >
            Continue
          </motion.button>
        </motion.div>
      )}

      {/* 4. Anxiety-Lowering Tips */}
      {step === 'tips' && (
        <motion.div
          key="tips"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex flex-col items-center justify-center h-full gap-8 px-6 py-12 text-center"
        >
          <motion.h2
            className="text-3xl font-bold"
            style={{
              fontFamily: "'Instrument Serif', Georgia, serif",
              fontStyle: 'italic',
              color: '#e8eaf0',
            }}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            A Few Tips
          </motion.h2>

          <motion.div
            className="w-full max-w-md space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {[
              { icon: '👕', tip: 'Wear fitted clothing (sports bra/shorts recommended)' },
              { icon: '🌍', tip: 'Choose a quiet, private spot with good lighting' },
              { icon: '📸', tip: 'You can retake any photo. No pressure, no judgment.' },
            ].map(({ icon, tip }, i) => (
              <motion.div
                key={tip}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-4 p-4 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.03)' }}
              >
                <span className="text-2xl">{icon}</span>
                <p style={{ color: '#e8eaf0' }}>{tip}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.button
            onClick={() => setStep('capture')}
            className="w-full max-w-sm py-4 rounded-full font-semibold text-white"
            style={{
              background: 'linear-gradient(135deg, #2dd4bf 0%, #22c55e 100%)',
              boxShadow: '0 0 32px rgba(45,212,191,0.3)',
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            whileHover={{ transform: 'translateY(-2px)' }}
            whileTap={{ scale: 0.98 }}
          >
            Start Capturing
          </motion.button>
        </motion.div>
      )}

      {/* 5. Guided Capture */}
      {step === 'capture' && (
        <PhotoCapture
          angle={currentAngle}
          onCapture={handlePhotoCapture}
          onBack={() => setStep('tips')}
        />
      )}

      {/* 6. Aftercare Screen */}
      {step === 'aftercare' && (
        <motion.div
          key="aftercare"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex flex-col items-center justify-center h-full gap-8 px-6 py-12 text-center"
        >
          {isUploading ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-12 h-12 rounded-full border-2 border-transparent"
                style={{ borderTopColor: '#2dd4bf', borderRightColor: '#22c55e' }}
              />
              <p style={{ color: '#8892a4' }}>Securing your photos...</p>
            </>
          ) : uploadError ? (
            <>
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(239,68,68,0.2)' }}
              >
                <span className="text-2xl">⚠️</span>
              </div>
              <p style={{ color: '#ef4444' }}>{uploadError}</p>
              <motion.button
                onClick={() => {
                  setUploadError(null)
                  setStep('capture')
                }}
                className="px-6 py-2 rounded-full font-semibold"
                style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Try Again
              </motion.button>
            </>
          ) : (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 150 }}
                className="flex items-center justify-center w-16 h-16 rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(34, 197, 94, 0.3) 0%, transparent 70%)',
                  boxShadow: '0 0 40px rgba(34, 197, 94, 0.2)',
                }}
              >
                <CheckCircle2 size={40} style={{ color: '#22c55e' }} />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-4 max-w-md"
              >
                <h2
                  className="text-3xl font-bold"
                  style={{
                    fontFamily: "'Instrument Serif', Georgia, serif",
                    fontStyle: 'italic',
                    color: '#e8eaf0',
                  }}
                >
                  That Took Courage
                </h2>
                <p className="text-lg leading-relaxed" style={{ color: '#8892a4' }}>
                  Your photos are securely stored. This is your baseline, not a verdict.
                </p>
                <p className="text-base" style={{ color: '#5a6578' }}>
                  Come back in a few weeks to see what's changed. You'll be amazed.
                </p>
              </motion.div>

              <motion.button
                onClick={() => (window.location.href = '/dashboard')}
                className="w-full max-w-sm py-4 rounded-full font-semibold text-white"
                style={{
                  background: 'linear-gradient(135deg, #2dd4bf 0%, #22c55e 100%)',
                  boxShadow: '0 0 32px rgba(45,212,191,0.3)',
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                whileHover={{ transform: 'translateY(-2px)' }}
                whileTap={{ scale: 0.98 }}
              >
                Back to Dashboard
              </motion.button>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
