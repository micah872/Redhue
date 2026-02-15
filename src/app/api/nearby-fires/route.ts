import { NextResponse } from 'next/server'
import type { ActiveFire } from '@/lib/types'

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

function parseCSV(csv: string): Record<string, string>[] {
  const lines = csv.trim().split('\n')
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map((h) => h.trim())
  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim())
    const obj: Record<string, string> = {}
    headers.forEach((h, i) => {
      obj[h] = values[i] || ''
    })
    return obj
  })
}

function parseFirmsRows(
  rows: Record<string, string>[],
  userLat: number,
  userLon: number,
  defaultSatellite: string
): ActiveFire[] {
  return rows
    .map((row) => ({
      latitude: parseFloat(row.latitude || row.Latitude || '0'),
      longitude: parseFloat(row.longitude || row.Longitude || '0'),
      brightness: parseFloat(row.bright_ti4 || row.brightness || row.Temp_BB || '0'),
      frp: parseFloat(row.frp || row.FRP || '0'),
      confidence: row.confidence || row.Confidence || 'unknown',
      satellite: row.satellite || row.Satellite || defaultSatellite,
      acq_date: row.acq_date || row.Acq_Date || '',
      acq_time: row.acq_time || row.Acq_Time || '',
      distance_km: 0,
    }))
    .filter((f) => f.latitude !== 0 && f.longitude !== 0)
    .map((f) => ({
      ...f,
      distance_km: Math.round(haversineKm(userLat, userLon, f.latitude, f.longitude) * 10) / 10,
    }))
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

    const mapKey = process.env.NASA_FIRMS_MAP_KEY
    if (!mapKey) {
      return NextResponse.json(
        { error: 'NASA_FIRMS_MAP_KEY not configured' },
        { status: 500 }
      )
    }

    // California-wide bounding box (lat 32.5-42.0, lon -124.5 to -114.1)
    const CA_BBOX = '-124.5,32.5,-114.1,42.0'

    // Query VIIRS (polar-orbit, high-res ~375m) and GOES (geostationary, ~2km, ~10-15min refresh) in parallel
    // Covering all of California for statewide awareness
    const [viirsRes, goesRes] = await Promise.all([
      fetch(
        `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${mapKey}/VIIRS_SNPP_NRT/${CA_BBOX}/5`,
        { signal: AbortSignal.timeout(15000) }
      ).catch(() => null),
      fetch(
        `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${mapKey}/GOES_NRT/${CA_BBOX}/2`,
        { signal: AbortSignal.timeout(15000) }
      ).catch(() => null),
    ])

    let allFires: ActiveFire[] = []

    // Parse VIIRS detections (past 5 days, higher spatial resolution)
    if (viirsRes?.ok) {
      const csvText = await viirsRes.text()
      const rows = parseCSV(csvText)
      allFires.push(...parseFirmsRows(rows, latitude, longitude, 'VIIRS'))
    }

    // Parse GOES detections (past 2 days, near-real-time ~10-15 min refresh)
    if (goesRes?.ok) {
      const csvText = await goesRes.text()
      const rows = parseCSV(csvText)
      allFires.push(...parseFirmsRows(rows, latitude, longitude, 'GOES'))
    }

    // Sort by distance from user
    const activeFires = allFires
      .sort((a, b) => a.distance_km - b.distance_km)

    return NextResponse.json({ activeFires })
  } catch (error) {
    console.error('[NEARBY-FIRES] Error:', (error as Error).message)
    return NextResponse.json(
      { error: 'Nearby fires lookup failed', details: (error as Error).message },
      { status: 500 }
    )
  }
}
