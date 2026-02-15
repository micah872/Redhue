import { NextResponse } from 'next/server'
import type { PowerLine, Structure, Road, InfrastructureData } from '@/lib/types'

export async function POST(request: Request) {
  try {
    const { south, west, north, east } = await request.json()

    if (south == null || west == null || north == null || east == null) {
      return NextResponse.json({ error: 'Bounding box (south, west, north, east) required' }, { status: 400 })
    }

    // Split into two queries: (1) power lines + roads (lightweight) and (2) buildings (heavier, smaller bbox)
    // This prevents Overpass from timing out on large building queries
    const infraQuery = `
[out:json][timeout:25];
(
  way["power"="line"](${south},${west},${north},${east});
  way["power"="minor_line"](${south},${west},${north},${east});
  way["highway"~"motorway|trunk|primary|secondary|tertiary"](${south},${west},${north},${east});
);
out geom;
`
    // Smaller bbox for buildings (±0.03° ~3.3km) to avoid timeout
    const midLat = (south + north) / 2
    const midLon = (west + east) / 2
    const bldgOffset = 0.03
    const buildingQuery = `
[out:json][timeout:15];
(
  way["building"](${midLat - bldgOffset},${midLon - bldgOffset},${midLat + bldgOffset},${midLon + bldgOffset});
);
out center;
`

    const [infraRes, bldgRes] = await Promise.all([
      fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(infraQuery)}`,
        signal: AbortSignal.timeout(30000),
      }).catch(() => null),
      fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(buildingQuery)}`,
        signal: AbortSignal.timeout(20000),
      }).catch(() => null),
    ])

    const res = infraRes

    if (!res?.ok) {
      console.error('[INFRA] Overpass returned', res?.status || 'no response')
      return NextResponse.json(emptyInfra(), { status: 200 })
    }

    const json = await res.json()
    const elements = [...(json.elements || [])]

    // Merge building results if available
    if (bldgRes?.ok) {
      const bldgJson = await bldgRes.json()
      elements.push(...(bldgJson.elements || []))
    }

    const powerLines: PowerLine[] = []
    const structures: Structure[] = []
    const roads: Road[] = []

    for (const el of elements) {
      const tags = el.tags || {}

      if (tags.power === 'line' || tags.power === 'minor_line') {
        if (el.geometry) {
          powerLines.push({
            id: el.id,
            voltage: tags.voltage,
            coordinates: el.geometry.map((g: { lat: number; lon: number }) => [g.lat, g.lon] as [number, number]),
            operator: tags.operator,
          })
        }
      } else if (tags.building) {
        const lat = el.center?.lat ?? el.lat
        const lon = el.center?.lon ?? el.lon
        if (lat && lon) {
          structures.push({
            id: el.id,
            center: [lat, lon],
            type: tags.building === 'yes' ? 'unknown' : tags.building,
          })
        }
      } else if (tags.highway) {
        if (el.geometry) {
          roads.push({
            id: el.id,
            name: tags.name,
            type: tags.highway,
            coordinates: el.geometry.map((g: { lat: number; lon: number }) => [g.lat, g.lon] as [number, number]),
          })
        }
      }
    }

    const result: InfrastructureData = {
      powerLines,
      structures: structures.slice(0, 200), // cap to prevent performance issues
      roads,
      structuresInPath: 0,
      powerLinesInPath: 0,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[INFRA] Error:', (error as Error).message)
    // Graceful degradation — return empty data, don't fail the dashboard
    return NextResponse.json(emptyInfra(), { status: 200 })
  }
}

function emptyInfra(): InfrastructureData {
  return { powerLines: [], structures: [], roads: [], structuresInPath: 0, powerLinesInPath: 0 }
}
