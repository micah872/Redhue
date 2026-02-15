'use client'

import { useState, useEffect } from 'react'
import { formatFreshness, freshnessColor } from '@/lib/polling'

interface StatusBarProps {
  firesUpdatedAt: number
  weatherUpdatedAt: number
  criticalAlertCount: number
  onRefresh: () => void
}

export default function StatusBar({ firesUpdatedAt, weatherUpdatedAt, criticalAlertCount, onRefresh }: StatusBarProps) {
  const [, setTick] = useState(0)

  // Re-render every second to update freshness
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="fixed top-0 left-0 right-0 z-1000 flex items-center px-3 py-2 bg-bg-primary/85 backdrop-blur-sm border-b border-border/50">
      {/* Left: SAT / WX freshness */}
      <div className="flex items-center gap-2.5 text-[10px] font-mono">
        <FreshnessChip label="SAT" updatedAt={firesUpdatedAt} />
        <FreshnessChip label="WX" updatedAt={weatherUpdatedAt} />
      </div>

      {/* Center: Logo (absolutely positioned for true center) */}
      <div className="absolute left-1/2 -translate-x-1/2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/redhue-logo.png" alt="Redhue" width={110} height={110} className="object-contain" />
      </div>

      {/* Right: Alert badge + refresh */}
      <div className="ml-auto flex items-center gap-2">
        {criticalAlertCount > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-score-red/20 px-2 py-0.5 text-[10px] font-bold text-score-red">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L1 21h22L12 2zm0 4l7.53 13H4.47L12 6z"/><rect x="11" y="10" width="2" height="4"/><rect x="11" y="16" width="2" height="2"/></svg>
            {criticalAlertCount}
          </span>
        )}

        <button
          onClick={onRefresh}
          className="flex items-center justify-center rounded-full p-1.5 hover:bg-bg-secondary active:bg-bg-tertiary"
          aria-label="Refresh data"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-secondary">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function FreshnessChip({ label, updatedAt }: { label: string; updatedAt: number }) {
  if (!updatedAt) return null
  const color = freshnessColor(updatedAt)
  return (
    <span className="flex items-center gap-1">
      <span className="text-text-secondary">{label}</span>
      <span className={`font-semibold ${color}`}>{formatFreshness(updatedAt)}</span>
    </span>
  )
}
