'use client'

import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, Smartphone, RotateCcw } from 'lucide-react'

type AngleType = 'front' | 'side' | 'back'

interface PhotoCaptureProps {
  angle: AngleType
  onCapture: (blob: Blob) => void
  onBack: () => void
}

const ANGLE_CONFIG: Record<AngleType, { title: string; instructions: string; tips: string[] }> = {
  front: {
    title: 'Front Photo',
    instructions: 'Stand facing the camera, feet shoulder-width apart. Full body in frame.',
    tips: ['Keep arms at sides', 'Neutral expression', 'Let your light shine'],
  },
  side: {
    title: 'Side Photo',
    instructions: 'Turn to your side (right side recommended). Full body visible.',
    tips: ['Look forward', 'Natural posture', 'Shoulders relaxed'],
  },
  back: {
    title: 'Back Photo',
    instructions: 'Face away from camera, feet shoulder-width apart. Full body visible.',
    tips: ['Keep arms relaxed', 'Slight tension OK', 'You\'re capturing progress'],
  },
}

export function PhotoCapture({ angle, onCapture, onBack }: PhotoCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [captured, setCaptured] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const config = ANGLE_CONFIG[angle]

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1080 }, height: { ideal: 1920 } },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      setError('Camera access denied. Please allow camera access in settings.')
      console.error('[v0] Camera error:', err)
    }
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')

      if (context) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        context.drawImage(video, 0, 0)
        setCaptured(true)
      }
    }
  }

  const confirmPhoto = () => {
    if (canvasRef.current) {
      canvasRef.current.toBlob((blob) => {
        if (blob) {
          onCapture(blob)
        }
      }, 'image/jpeg', 0.9)
    }
  }

  const retakePhoto = () => {
    setCaptured(false)
    setError(null)
    startCamera()
  }

  // Start camera on mount
  useState(() => {
    startCamera()
  })

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col h-full bg-[#fdfbf7] text-white"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#e2dbcd' }}>
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-medium"
          style={{ color: '#155e56' }}
        >
          <ChevronLeft size={20} />
          Back
        </button>
        <h2
          className="text-lg font-semibold"
          style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: 'italic' }}
        >
          {config.title}
        </h2>
        <div className="w-12" />
      </div>

      {/* Camera or Canvas */}
      <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden bg-black">
        {!captured ? (
          <>
            {error ? (
              <div className="flex flex-col items-center gap-4 px-6">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(154, 59, 46,0.2)' }}
                >
                  <Smartphone size={24} style={{ color: '#9a3b2e' }} />
                </div>
                <p className="text-center" style={{ color: '#9a3b2e' }}>
                  {error}
                </p>
              </div>
            ) : (
              <>
                {/* Semi-transparent silhouette overlay */}
                <svg
                  className="absolute inset-0 w-full h-full opacity-20"
                  viewBox="0 0 300 600"
                  preserveAspectRatio="xMidYMid slice"
                  style={{ pointerEvents: 'none' }}
                >
                  {/* Head */}
                  <circle cx="150" cy="80" r="30" fill="#155e56" />
                  {/* Body */}
                  <rect x="120" y="120" width="60" height="120" fill="#155e56" />
                  {/* Arms */}
                  <rect x="60" y="140" width="60" height="20" fill="#155e56" />
                  <rect x="180" y="140" width="60" height="20" fill="#155e56" />
                  {/* Legs */}
                  <rect x="110" y="250" width="25" height="120" fill="#155e56" />
                  <rect x="165" y="250" width="25" height="120" fill="#155e56" />
                </svg>

                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              </>
            )}
          </>
        ) : (
          <canvas ref={canvasRef} className="hidden" />
        )}
      </div>

      {/* Instructions & Tips */}
      <div className="px-6 py-6 space-y-4 border-t" style={{ borderColor: '#e2dbcd' }}>
        <div>
          <p className="text-sm font-medium mb-2" style={{ color: '#8b867c' }}>
            {config.instructions}
          </p>
          <div className="flex gap-2 flex-wrap">
            {config.tips.map((tip) => (
              <span key={tip} className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(21, 94, 86,0.1)', color: '#155e56' }}>
                {tip}
              </span>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          {captured ? (
            <>
              <motion.button
                onClick={retakePhoto}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full font-semibold"
                style={{
                  background: 'rgba(21, 94, 86,0.15)',
                  color: '#155e56',
                  border: '1px solid rgba(21, 94, 86,0.3)',
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <RotateCcw size={18} />
                Retake
              </motion.button>
              <motion.button
                onClick={confirmPhoto}
                className="flex-1 py-3 rounded-full font-semibold text-white"
                style={{
                  background: 'linear-gradient(135deg, #155e56 0%, #155e56 100%)',
                  boxShadow: '0 0 32px rgba(21, 94, 86,0.3)',
                }}
                whileHover={{ transform: 'translateY(-2px)' }}
                whileTap={{ scale: 0.98 }}
              >
                Confirm
              </motion.button>
            </>
          ) : (
            <motion.button
              onClick={capturePhoto}
              className="w-20 h-20 rounded-full mx-auto flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #155e56 0%, #155e56 100%)',
                boxShadow: '0 0 48px rgba(21, 94, 86,0.4)',
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            />
          )}
        </div>
      </div>
    </motion.div>
  )
}
