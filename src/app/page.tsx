'use client'

import { useState, useCallback } from 'react'
import CameraView from '@/components/CameraView'
import ProcessingView from '@/components/ProcessingView'
import ResultsView from '@/components/ResultsView'
import type { CaptureData, FullAnalysisResult } from '@/lib/types'

type AppPhase = 'camera' | 'processing' | 'results' | 'error'

export default function Home() {
  const [phase, setPhase] = useState<AppPhase>('camera')
  const [captureData, setCaptureData] = useState<CaptureData | null>(null)
  const [processingStep, setProcessingStep] = useState('')
  const [results, setResults] = useState<FullAnalysisResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  const handleCapture = useCallback(async (data: CaptureData) => {
    setCaptureData(data)
    setPhase('processing')

    try {
      // Step 1: Weather + Fire Analysis in parallel
      setProcessingStep('Fetching weather data...')
      const [weatherRes, fireRes] = await Promise.all([
        fetch('/api/weather', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            latitude: data.latitude,
            longitude: data.longitude,
          }),
        }),
        fetch('/api/analyze-fire', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: data.imageBase64 }),
        }),
      ])

      if (!weatherRes.ok) throw new Error('Weather fetch failed')
      if (!fireRes.ok) throw new Error('Fire analysis failed')

      const { weather, biome } = await weatherRes.json()
      const fireAnalysis = await fireRes.json()

      // Step 2: Search historical fires
      setProcessingStep('Searching historical fires...')
      const searchRes = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weather, biome, fireAnalysis }),
      })

      if (!searchRes.ok) throw new Error('Historical fire search failed')
      const { matches } = await searchRes.json()

      // Step 3: Generate tactical suggestions
      setProcessingStep('Generating tactical suggestions...')
      const suggestRes = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weather,
          biome,
          fireAnalysis,
          matchedFires: matches,
        }),
      })

      if (!suggestRes.ok) throw new Error('Suggestion generation failed')
      const { suggestions } = await suggestRes.json()

      setResults({ weather, biome, fireAnalysis, matchedFires: matches, suggestions })
      setPhase('results')
    } catch (err) {
      console.error('Processing error:', err)
      setErrorMsg((err as Error).message || 'Something went wrong')
      setPhase('error')
    }
  }, [])

  const handleReset = useCallback(() => {
    setPhase('camera')
    setCaptureData(null)
    setResults(null)
    setErrorMsg('')
    setProcessingStep('')
  }, [])

  if (phase === 'camera') {
    return <CameraView onCapture={handleCapture} />
  }

  if (phase === 'processing') {
    return (
      <ProcessingView
        currentStep={processingStep}
        image={captureData?.imageBase64}
      />
    )
  }

  if (phase === 'error') {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="rounded-full bg-score-red/20 p-4">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-score-red">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <p className="text-lg font-medium">Analysis Failed</p>
        <p className="text-sm text-text-secondary">{errorMsg}</p>
        <button
          onClick={handleReset}
          className="mt-2 rounded-xl bg-accent px-6 py-3 font-semibold text-white"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (phase === 'results' && results) {
    return (
      <ResultsView
        data={results}
        image={captureData?.imageBase64}
        onReset={handleReset}
      />
    )
  }

  return null
}
