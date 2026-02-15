'use client'

import dynamic from 'next/dynamic'
import type { ActiveFire, HistoricalFire, SpreadCone, InfrastructureData, CalFireIncident, FirePerimeter } from '@/lib/types'

const MapViewClient = dynamic(() => import('./MapViewClient'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-bg-tertiary">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-accent" />
    </div>
  ),
})

export interface MapViewProps {
  userLat: number
  userLon: number
  activeFires: ActiveFire[]
  historicalFires: HistoricalFire[]
  windDirectionDeg: number
  windSpeedMph: number
  spreadCones?: SpreadCone[]
  infrastructure?: InfrastructureData
  calFireIncidents?: CalFireIncident[]
  firePerimeters?: FirePerimeter[]
  fullScreen?: boolean
  deviceHeading?: number | null
  compassPermissionNeeded?: boolean
  onRequestCompassPermission?: () => Promise<void>
}

export default function MapView(props: MapViewProps) {
  return <MapViewClient {...props} />
}
