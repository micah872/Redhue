import { NextResponse } from 'next/server'
import type { HistoricalFire } from '@/lib/types'

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

// Fire cause ID mapping from NIFC InFORM
const FIRE_CAUSES: Record<number, string> = {
  1: 'Lightning', 2: 'Equipment Use', 3: 'Smoking', 4: 'Campfire',
  5: 'Debris Burning', 6: 'Railroad', 7: 'Arson', 8: 'Children',
  9: 'Miscellaneous', 10: 'Fireworks', 11: 'Powerline', 12: 'Structure',
  13: 'Missing/Undefined', 14: 'Undetermined',
}

async function fetchNIFC(latitude: number, longitude: number): Promise<HistoricalFire[]> {
  const url = new URL(
    'https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/InFORM_FireOccurrence_Public/FeatureServer/0/query'
  )
  // Query all of California using statewide bounding box
  url.searchParams.set('geometry', '-124.5,32.5,-114.1,42.0')
  url.searchParams.set('geometryType', 'esriGeometryEnvelope')
  url.searchParams.set('spatialRel', 'esriSpatialRelIntersects')
  url.searchParams.set(
    'outFields',
    'IncidentName,CalculatedAcres,FinalAcres,IncidentSize,FireDiscoveryDateTime,ContainmentDateTime,FireCauseGeneralID,PredominantFuelModel,FireBehaviorGeneral,FireMgmtComplexity,PercentContained,POOCounty,POOState,InitialLatitude,InitialLongitude,CalendarYear'
  )
  url.searchParams.set('resultRecordCount', '100')
  url.searchParams.set('orderByFields', 'CalculatedAcres DESC')
  url.searchParams.set('f', 'geojson')

  const res = await fetch(url.toString())
  if (!res.ok) return []

  const data = await res.json()
  if (!data.features) return []

  return data.features
    .map((f: Record<string, unknown>) => {
      const props = f.properties as Record<string, unknown>
      const name = (props.IncidentName as string) || 'Unknown'
      const acres = (props.CalculatedAcres as number) || (props.FinalAcres as number) || (props.IncidentSize as number) || 0
      const discDateMs = props.FireDiscoveryDateTime as number | null
      const discDate = discDateMs ? new Date(discDateMs) : null
      const contDateMs = props.ContainmentDateTime as number | null
      const contDate = contDateMs ? new Date(contDateMs) : null
      const causeId = props.FireCauseGeneralID as number | null
      const fireLat = (props.InitialLatitude as number) || latitude
      const fireLon = (props.InitialLongitude as number) || longitude

      return {
        incident_name: name,
        year: (props.CalendarYear as number) || (discDate ? discDate.getFullYear() : 0),
        acres: Math.round(acres),
        latitude: fireLat,
        longitude: fireLon,
        discovery_date: discDate ? discDate.toISOString().split('T')[0] : 'Unknown',
        containment_date: contDate ? contDate.toISOString().split('T')[0] : undefined,
        cause: causeId ? FIRE_CAUSES[causeId] || undefined : undefined,
        fuel_model: (props.PredominantFuelModel as string) || undefined,
        fire_behavior: (props.FireBehaviorGeneral as string) || undefined,
        complexity: (props.FireMgmtComplexity as string) || undefined,
        percent_contained: (props.PercentContained as number) ?? undefined,
        county: (props.POOCounty as string) || undefined,
        state: (props.POOState as string) || undefined,
        distance_km: Math.round(haversineKm(latitude, longitude, fireLat, fireLon) * 10) / 10,
      }
    })
    .filter((f: HistoricalFire) => f.incident_name !== 'Unknown' && f.acres > 0)
}

async function fetchMTBS(latitude: number, longitude: number): Promise<HistoricalFire[]> {
  // California statewide bounding box
  const bbox = '-124.5,32.5,-114.1,42.0'

  const url = new URL(
    'https://apps.fs.usda.gov/arcx/rest/services/EDW/EDW_MTBS_01/MapServer/63/query'
  )
  url.searchParams.set('geometry', bbox)
  url.searchParams.set('geometryType', 'esriGeometryEnvelope')
  url.searchParams.set('spatialRel', 'esriSpatialRelIntersects')
  url.searchParams.set('outFields', 'Incid_Name,BurnBndAc,Ig_Date,Asmnt_Type,BurnBndLat,BurnBndLon')
  url.searchParams.set('returnGeometry', 'false')
  url.searchParams.set('resultRecordCount', '100')
  url.searchParams.set('orderByFields', 'BurnBndAc DESC')
  url.searchParams.set('f', 'json')

  const res = await fetch(url.toString())
  if (!res.ok) return []

  const data = await res.json()
  if (!data.features) return []

  return data.features
    .map((f: Record<string, unknown>) => {
      const attrs = f.attributes as Record<string, unknown>
      const name = (attrs.Incid_Name as string) || 'Unknown'
      const acres = (attrs.BurnBndAc as number) || 0
      const igDateMs = attrs.Ig_Date as number | null
      const igDate = igDateMs ? new Date(igDateMs) : null
      const severity = (attrs.Asmnt_Type as string) || undefined
      const fireLat = parseFloat((attrs.BurnBndLat as string) || String(latitude))
      const fireLon = parseFloat((attrs.BurnBndLon as string) || String(longitude))

      return {
        incident_name: name,
        year: igDate ? igDate.getFullYear() : 0,
        acres: Math.round(acres),
        latitude: fireLat,
        longitude: fireLon,
        discovery_date: igDate ? igDate.toISOString().split('T')[0] : 'Unknown',
        burn_severity: severity,
        distance_km: Math.round(haversineKm(latitude, longitude, fireLat, fireLon) * 10) / 10,
      }
    })
    .filter((f: HistoricalFire) => f.incident_name !== 'Unknown' && f.acres > 0)
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

    // Query NIFC and MTBS in parallel
    const [nifcFires, mtbsFires] = await Promise.all([
      fetchNIFC(latitude, longitude).catch((err) => {
        console.error('[HISTORICAL-FIRES] NIFC error:', err.message)
        return [] as HistoricalFire[]
      }),
      fetchMTBS(latitude, longitude).catch((err) => {
        console.error('[HISTORICAL-FIRES] MTBS error:', err.message)
        return [] as HistoricalFire[]
      }),
    ])

    // Merge and dedupe by incident name (prefer NIFC data, enrich with MTBS severity)
    const byName = new Map<string, HistoricalFire>()

    for (const fire of nifcFires) {
      const key = fire.incident_name.toLowerCase().trim()
      byName.set(key, fire)
    }

    for (const fire of mtbsFires) {
      const key = fire.incident_name.toLowerCase().trim()
      const existing = byName.get(key)
      if (existing) {
        // Enrich with MTBS severity
        existing.burn_severity = fire.burn_severity
      } else {
        byName.set(key, fire)
      }
    }

    const historicalFires = Array.from(byName.values())
      .sort((a, b) => b.acres - a.acres)
      .slice(0, 50)

    return NextResponse.json({ historicalFires })
  } catch (error) {
    console.error('[HISTORICAL-FIRES] Error:', (error as Error).message)
    return NextResponse.json(
      { error: 'Historical fires lookup failed', details: (error as Error).message },
      { status: 500 }
    )
  }
}
