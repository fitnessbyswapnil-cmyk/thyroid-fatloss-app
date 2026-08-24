'use client'

import { useEffect, useRef, useState } from 'react'
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

  /**
   * The live stream, held outside React state because the cleanup path must be
   * able to stop it without waiting for a re-render.
   *
   * Nothing stopped it before. retakePhoto() called startCamera() again on top
   * of the running stream, and on most Android devices the second getUserMedia
   * then fails with NotReadableError — so "Retake" answered with "Camera access
   * denied" and the flow was over. The camera also stayed live after she left
   * the screen, with the indicator lit.
   */
  const streamRef = useRef<MediaStream | null>(null)

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
  }

  const startCamera = async () => {
    stopCamera()
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1080 }, height: { ideal: 1920 } },
      })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      else stream.getTracks().forEach((t) => t.stop())
    } catch (err) {
      setError('Camera access denied. Please allow camera access in settings.')
      console.error('[PhotoCapture] camera error:', err)
    }
  }

  const capturePhoto = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    // A stream that has not delivered a frame yet reports 0x0, which produced a
    // 0x0 canvas and a null blob — and the null was swallowed, so Confirm did
    // nothing at all and the screen looked stuck.
    if (!video.videoWidth || !video.videoHeight) {
      setError('The camera is still starting. Give it a second and tap again.')
      return
    }

    const context = canvas.getContext('2d')
    if (!context) return
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0)
    setError(null)
    setCaptured(true)
  }

  const confirmPhoto = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.toBlob((blob) => {
      if (!blob) {
        setError("That photo didn't save. Tap Retake and try once more.")
        return
      }
      onCapture(blob)
      // THE THREE-IDENTICAL-PHOTOS BUG.
      //
      // This never reset, and the parent renders one PhotoCapture instance for
      // all three angles, so `captured` stayed true from front through side to
      // back. The <video> was unmounted, the canvas still held the FRONT frame,
      // and each further Confirm ran toBlob over that same unchanged canvas.
      // She tapped Confirm three times and uploaded the front photo three
      // times, labelled front, side and back — and neither she nor the coach
      // could tell, because the preview was hidden. That is the single record
      // the whole photo-review feature is built on.
      setCaptured(false)
      setError(null)
      void startCamera()
    }, 'image/jpeg', 0.9)
  }

  const retakePhoto = () => {
    setCaptured(false)
    setError(null)
    void startCamera()
  }

  // useState(() => startCamera()) stood in for this — a side effect in the
  // render phase, which double-fires under StrictMode and never cleans up.
  useEffect(() => {
    void startCamera()
    return stopCamera
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [angle])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col h-full bg-[#090c14] text-white"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-medium"
          style={{ color: '#2dd4bf' }}
        >
          <ChevronLeft size={20} />
          Back
        </button>
        <h2
          className="text-lg font-semibold"
          style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: 'italic' }}
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
                  style={{ background: 'rgba(239,68,68,0.2)' }}
                >
                  <Smartphone size={24} style={{ color: '#ef4444' }} />
                </div>
                <p className="text-center" style={{ color: '#ef4444' }}>
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
                  <circle cx="150" cy="80" r="30" fill="#2dd4bf" />
                  {/* Body */}
                  <rect x="120" y="120" width="60" height="120" fill="#2dd4bf" />
                  {/* Arms */}
                  <rect x="60" y="140" width="60" height="20" fill="#2dd4bf" />
                  <rect x="180" y="140" width="60" height="20" fill="#2dd4bf" />
                  {/* Legs */}
                  <rect x="110" y="250" width="25" height="120" fill="#2dd4bf" />
                  <rect x="165" y="250" width="25" height="120" fill="#2dd4bf" />
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
          // Was className="hidden". She was shown a black box and asked to
          // confirm a photo she had no way of checking.
          <canvas ref={canvasRef} className="w-full h-full object-cover" />
        )}
      </div>

      {/* Instructions & Tips */}
      <div className="px-6 py-6 space-y-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <div>
          <p className="text-sm font-medium mb-2" style={{ color: '#8892a4' }}>
            {config.instructions}
          </p>
          <div className="flex gap-2 flex-wrap">
            {config.tips.map((tip) => (
              <span key={tip} className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(45,212,191,0.1)', color: '#2dd4bf' }}>
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
                  background: 'rgba(45,212,191,0.15)',
                  color: '#2dd4bf',
                  border: '1px solid rgba(45,212,191,0.3)',
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
                  background: 'linear-gradient(135deg, #2dd4bf 0%, #22c55e 100%)',
                  boxShadow: '0 0 32px rgba(45,212,191,0.3)',
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
                background: 'linear-gradient(135deg, #2dd4bf 0%, #22c55e 100%)',
                boxShadow: '0 0 48px rgba(45,212,191,0.4)',
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
