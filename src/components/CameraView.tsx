'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import type { CaptureData } from '@/lib/types'

interface CameraViewProps {
  onCapture: (data: CaptureData) => void
}

const MAX_IMAGE_SIZE = 1024

function resizeImage(
  source: HTMLVideoElement | HTMLImageElement,
  canvas: HTMLCanvasElement,
  sourceWidth: number,
  sourceHeight: number
): string {
  let w = sourceWidth
  let h = sourceHeight
  if (w > MAX_IMAGE_SIZE || h > MAX_IMAGE_SIZE) {
    const scale = MAX_IMAGE_SIZE / Math.max(w, h)
    w = Math.round(w * scale)
    h = Math.round(h * scale)
  }
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(source, 0, 0, w, h)
  return canvas.toDataURL('image/jpeg', 0.8)
}

export default function CameraView({ onCapture }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [capturing, setCapturing] = useState(false)

  useEffect(() => {
    let mounted = true
    async function startCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        })
        if (!mounted) {
          mediaStream.getTracks().forEach((t) => t.stop())
          return
        }
        setStream(mediaStream)
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
        }
      } catch {
        if (mounted) {
          setError('Camera access denied. Please allow camera permissions or upload a photo.')
        }
      }
    }
    startCamera()
    return () => {
      mounted = false
      stream?.getTracks().forEach((t) => t.stop())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const finishWithImage = useCallback(
    (imageBase64: string) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          stream?.getTracks().forEach((t) => t.stop())
          onCapture({
            imageBase64,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            timestamp: new Date().toISOString(),
          })
        },
        () => {
          setCapturing(false)
          setError('Location access denied. GPS is required to fetch weather data for your area.')
        },
        { enableHighAccuracy: true, timeout: 10000 }
      )
    },
    [stream, onCapture]
  )

  const handleCapture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || capturing) return
    setCapturing(true)

    const video = videoRef.current
    const imageBase64 = resizeImage(
      video,
      canvasRef.current,
      video.videoWidth,
      video.videoHeight
    )
    finishWithImage(imageBase64)
  }, [capturing, finishWithImage])

  const handleUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file || capturing) return
      setCapturing(true)

      const img = new Image()
      img.onload = () => {
        if (!canvasRef.current) return
        const imageBase64 = resizeImage(img, canvasRef.current, img.width, img.height)
        finishWithImage(imageBase64)
      }
      img.onerror = () => {
        setCapturing(false)
        setError('Failed to load image. Please try a different file.')
      }
      img.src = URL.createObjectURL(file)
    },
    [capturing, finishWithImage]
  )

  if (error) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="rounded-full bg-score-red/20 p-4">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-score-red">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <p className="text-lg font-medium">{error}</p>
        <div className="flex gap-3">
          <button
            onClick={() => window.location.reload()}
            className="rounded-xl bg-bg-tertiary border border-border px-6 py-3 font-semibold text-text-primary"
          >
            Retry Camera
          </button>
          <label className="cursor-pointer rounded-xl bg-accent px-6 py-3 font-semibold text-white">
            Upload Photo
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
            />
          </label>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="h-full w-full object-cover"
      />
      <canvas ref={canvasRef} className="hidden" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUpload}
      />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-center bg-gradient-to-b from-black/60 to-transparent px-4 pt-safe-top pb-8">
        <div className="flex items-center gap-2 pt-4">
          <svg width="28" height="28" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Red flame top */}
            <path d="M32 2C28 6 20 14 18 20c-1 3 0 6 2 8l12-14 12 14c2-2 3-5 2-8C44 14 36 6 32 2z" fill="#C0392B" />
            {/* Dark left petal */}
            <path d="M20 28c-2 2-4 5-5 9-1 5 0 10 3 14l10-11-8-12z" fill="#3D3D3D" />
            {/* Dark right petal */}
            <path d="M44 28l-8 12 10 11c3-4 4-9 3-14-1-4-3-7-5-9z" fill="#3D3D3D" />
            {/* Dark bottom */}
            <path d="M28 49l-10 2c3 5 8 9 14 11 6-2 11-6 14-11l-10-2-4 5-4-5z" fill="#4A4A4A" />
            {/* Orange center circle */}
            <circle cx="32" cy="38" r="7" fill="#E67E22" />
          </svg>
          <h1 className="text-xl font-bold tracking-tight">
            <span className="text-accent">Red</span>hue
          </h1>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-6 bg-gradient-to-t from-black/60 to-transparent pt-8 pb-10">
        {/* Upload button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={capturing}
          className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/30 bg-bg-tertiary/80 backdrop-blur transition-transform active:scale-95 disabled:opacity-50"
          aria-label="Upload photo"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </button>

        {/* Capture button */}
        <button
          onClick={handleCapture}
          disabled={capturing}
          className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-accent bg-bg-tertiary/80 backdrop-blur transition-transform active:scale-95 disabled:opacity-50"
        >
          {capturing ? (
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-accent" />
          ) : (
            <div className="h-14 w-14 rounded-full bg-accent" />
          )}
        </button>

        {/* Spacer to balance layout */}
        <div className="h-14 w-14" />
      </div>

      {/* Instruction text */}
      <div className="absolute bottom-28 left-0 right-0 text-center">
        <p className="text-sm text-text-secondary">
          Capture a photo or upload an aerial image
        </p>
      </div>
    </div>
  )
}
