import { NextResponse } from 'next/server'
import type { FirePerimeter } from '@/lib/types'

export async function POST() {
  try {
    // NIFC Active Fire Perimeters — nationwide but we filter to California bbox
    // This provides actual fire boundary polygons for active incidents
    const url = new URL(
      'https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/WFIGS_Interagency_Perimeters/FeatureServer/0/query'
    )
    // California bounding box envelope
    url.searchParams.set('geometry', '-124.5,32.5,-114.1,42.0')
    url.searchParams.set('geometryType', 'esriGeometryEnvelope')
    url.searchParams.set('spatialRel', 'esriSpatialRelIntersects')
    url.searchParams.set('outFields', 'poly_IncidentName,poly_GISAcres,irwin_IrwinID')
    url.searchParams.set('returnGeometry', 'true')
    url.searchParams.set('outSR', '4326')
    url.searchParams.set('resultRecordCount', '50')
    url.searchParams.set('orderByFields', 'poly_GISAcres DESC')
    url.searchParams.set('f', 'geojson')

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(15000) })
    if (!res.ok) {
      return NextResponse.json({ firePerimeters: [] })
    }

    const data = await res.json()
    if (!data.features) {
      return NextResponse.json({ firePerimeters: [] })
    }

    const perimeters: FirePerimeter[] = data.features
      .map((f: Record<string, unknown>) => {
        const props = f.properties as Record<string, unknown>
        const geo = f.geometry as { type: string; coordinates: number[][][][] } | null
        if (!geo || (geo.type !== 'Polygon' && geo.type !== 'MultiPolygon')) return null

        // Normalize to array of polygon rings (each ring is [lat,lon][])
        let rings: [number, number][][] = []
        const coords = geo.coordinates as unknown
        if (geo.type === 'Polygon') {
          for (const ring of coords as number[][][]) {
            rings.push(ring.map(coord => [coord[1], coord[0]] as [number, number]))
          }
        } else {
          // MultiPolygon — flatten to list of rings
          for (const polygon of coords as number[][][][]) {
            for (const ring of polygon) {
              rings.push(ring.map(coord => [coord[1], coord[0]] as [number, number]))
            }
          }
        }

        return {
          incident_name: (props.poly_IncidentName as string) || 'Unknown',
          gis_acres: Math.round((props.poly_GISAcres as number) || 0),
          coordinates: rings,
          irwin_id: (props.irwin_IrwinID as string) || undefined,
        }
      })
      .filter((p: FirePerimeter | null): p is FirePerimeter => p !== null && p.coordinates.length > 0)

    return NextResponse.json({ firePerimeters: perimeters })
  } catch (error) {
    console.error('[FIRE-PERIMETERS] Error:', (error as Error).message)
    return NextResponse.json({ firePerimeters: [] })
  }
}
