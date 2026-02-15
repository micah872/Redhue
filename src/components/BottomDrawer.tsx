'use client'

import { useState, useRef, useCallback, type ReactNode } from 'react'

type Tab = 'alerts' | 'wx' | 'lces' | 'intel'

interface BottomDrawerProps {
  alertsContent: ReactNode
  weatherContent: ReactNode
  lcesContent: ReactNode
  intelContent: ReactNode
  alertCount?: number
}

const TABS: { key: Tab; label: string }[] = [
  { key: 'alerts', label: 'Alerts' },
  { key: 'wx', label: 'Wx' },
  { key: 'lces', label: 'LCES' },
  { key: 'intel', label: 'Intel' },
]

// Snap points as percentage of viewport height
const SNAP_COLLAPSED = 0  // just tab bar visible
const SNAP_HALF = 40      // 40vh
const SNAP_FULL = 75      // 75vh

export default function BottomDrawer({
  alertsContent,
  weatherContent,
  lcesContent,
  intelContent,
  alertCount = 0,
}: BottomDrawerProps) {
  const [activeTab, setActiveTab] = useState<Tab>('alerts')
  const [drawerHeight, setDrawerHeight] = useState(SNAP_COLLAPSED)
  const dragRef = useRef<{ startY: number; startH: number } | null>(null)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    dragRef.current = {
      startY: e.touches[0].clientY,
      startH: drawerHeight,
    }
  }, [drawerHeight])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragRef.current) return
    const deltaY = dragRef.current.startY - e.touches[0].clientY
    const deltaVh = (deltaY / window.innerHeight) * 100
    const newH = Math.max(0, Math.min(SNAP_FULL, dragRef.current.startH + deltaVh))
    setDrawerHeight(newH)
  }, [])

  const handleTouchEnd = useCallback(() => {
    dragRef.current = null
    // Snap to nearest point
    setDrawerHeight((h) => {
      const points = [SNAP_COLLAPSED, SNAP_HALF, SNAP_FULL]
      return points.reduce((closest, p) => Math.abs(p - h) < Math.abs(closest - h) ? p : closest)
    })
  }, [])

  const toggleDrawer = useCallback(() => {
    setDrawerHeight((h) => (h > 10 ? SNAP_COLLAPSED : SNAP_HALF))
  }, [])

  const content: Record<Tab, ReactNode> = {
    alerts: alertsContent,
    wx: weatherContent,
    lces: lcesContent,
    intel: intelContent,
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[1000] flex flex-col bg-bg-primary/95 backdrop-blur-sm border-t border-border/50 transition-[height] duration-200 ease-out"
      style={{ height: `calc(48px + ${drawerHeight}vh)` }}
    >
      {/* Drag handle */}
      <div
        className="flex justify-center py-1.5 cursor-grab active:cursor-grabbing touch-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={toggleDrawer}
      >
        <div className="h-1 w-10 rounded-full bg-border" />
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-border/50 px-2 shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key)
              if (drawerHeight < SNAP_HALF) setDrawerHeight(SNAP_HALF)
            }}
            className={`flex-1 py-2 text-xs font-semibold transition-colors relative ${
              activeTab === tab.key ? 'text-accent' : 'text-text-secondary'
            }`}
          >
            {tab.label}
            {tab.key === 'alerts' && alertCount > 0 && (
              <span className="absolute -top-0.5 right-1/4 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-score-red text-[8px] font-bold text-white">
                {alertCount}
              </span>
            )}
            {activeTab === tab.key && (
              <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-accent rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-2">
        {content[activeTab]}
      </div>
    </div>
  )
}
