import { NextResponse } from 'next/server'
import type { CalFireIncident } from '@/lib/types'

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export async function POST(request: Request) {
  try {
    const { latitude, longitude } = await request.json()

    if (latitude == null || longitude == null) {
      return NextResponse.json(
        { error: 'latitude and longitude are required' },
        { status: 400 }
      )
    }

    // CAL FIRE active incidents — California-specific ArcGIS FeatureServer
    // This covers all active and recent California wildfires with detailed incident info
    const url = new URL(
      'https://services1.arcgis.com/jUJYIo9tSA7EHvfZ/arcgis/rest/services/CAL_FIRE_Incidents/FeatureServer/0/query'
    )
    url.searchParams.set('where', '1=1') // All incidents statewide
    url.searchParams.set(
      'outFields',
      'incident_name,incident_latitude,incident_longitude,incident_acres_burned,incident_containment,incident_date_created,incident_county,incident_administrative_unit,is_active'
    )
    url.searchParams.set('resultRecordCount', '200')
    url.searchParams.set('orderByFields', 'incident_acres_burned DESC')
    url.searchParams.set('f', 'json')

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(12000) })
    if (!res.ok) {
      return NextResponse.json({ calFireIncidents: [] })
    }

    const data = await res.json()
    if (!data.features) {
      return NextResponse.json({ calFireIncidents: [] })
    }

    const incidents: CalFireIncident[] = data.features
      .map((f: Record<string, unknown>) => {
        const attrs = f.attributes as Record<string, unknown>
        const lat = (attrs.incident_latitude as number) || 0
        const lon = (attrs.incident_longitude as number) || 0
        if (!lat || !lon) return null

        const startMs = attrs.incident_date_created as number | null
        const startDate = startMs ? new Date(startMs) : null

        return {
          incident_name: (attrs.incident_name as string) || 'Unknown',
          latitude: lat,
          longitude: lon,
          acres: Math.round((attrs.incident_acres_burned as number) || 0),
          containment: Math.round((attrs.incident_containment as number) || 0),
          start_date: startDate ? startDate.toISOString().split('T')[0] : 'Unknown',
          county: (attrs.incident_county as string) || 'Unknown',
          admin_unit: (attrs.incident_administrative_unit as string) || '',
          is_active: Boolean(attrs.is_active),
          distance_km: Math.round(haversineKm(latitude, longitude, lat, lon) * 10) / 10,
        }
      })
      .filter((f: CalFireIncident | null): f is CalFireIncident => f !== null)
      .sort((a: CalFireIncident, b: CalFireIncident) => a.distance_km - b.distance_km)

    return NextResponse.json({ calFireIncidents: incidents })
  } catch (error) {
    console.error('[CALFIRE] Error:', (error as Error).message)
    return NextResponse.json({ calFireIncidents: [] })
  }
}
