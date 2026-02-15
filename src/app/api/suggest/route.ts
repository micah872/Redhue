import { NextResponse } from 'next/server'
import { anthropic } from '@/lib/anthropic'
import type {
  WeatherData,
  BiomeInfo,
  HistoricalFire,
  ActiveFire,
  LCESOutput,
  TacticalAlert,
} from '@/lib/types'

function compassDir(deg: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  return dirs[Math.round(deg / 45) % 8]
}

function parseJson(raw: string) {
  const cleaned = raw
    .replace(/^```(?:json)?\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim()
  return JSON.parse(cleaned)
}

export async function POST(request: Request) {
  try {
    const {
      weather,
      biome,
      historicalFires = [],
      activeFires = [],
      structuresInPath = 0,
      powerLinesInPath = 0,
    } = await request.json()

    if (!weather || !biome) {
      return NextResponse.json({ error: 'weather and biome are required' }, { status: 400 })
    }

    const sitSum = buildSituation(weather, biome, activeFires, historicalFires, structuresInPath, powerLinesInPath)
    const upwind = compassDir((weather.wind_direction_deg + 180) % 360)
    const perpA = compassDir((weather.wind_direction_deg + 90) % 360)
    const perpB = compassDir((weather.wind_direction_deg - 90 + 360) % 360)
    const windFrom = compassDir(weather.wind_direction_deg)

    // Run LCES and tactical alerts in parallel
    const [lcesResponse, alertResponse] = await Promise.all([
      anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `You are a wildfire safety officer. Generate LCES for this incident.

Location weather: ${weather.temperature_f}°F, ${weather.relative_humidity}% RH, wind ${weather.wind_speed_mph} mph from ${windFrom} (${weather.wind_direction_deg}°), gusts ${weather.wind_gusts_mph} mph
Fuel: ${biome.fuel_model} — ${biome.fuel_description}
Terrain: ${biome.vegetation_zone}
Active fires: ${activeFires.length} detections (closest ${activeFires[0]?.distance_km || 'N/A'} km)

Wind blows FROM ${windFrom}. Fire spreads ${compassDir(weather.wind_direction_deg)} (downwind).
Upwind (safe): ${upwind}. Perpendicular: ${perpA} or ${perpB}.

Return ONLY this JSON:
{
  "lookouts": ["2-3 specific lookout position recommendations"],
  "communications": ["2-3 comm directives"],
  "escapeRoutes": ["2-3 escape routes with compass bearings, referencing upwind=${upwind} or perpendicular=${perpA}/${perpB}"],
  "safetyZones": ["2-3 safety zone types appropriate for this fuel/terrain"],
  "hazards": ["2-3 terrain/fuel hazards specific to ${biome.fuel_model}"]
}

Be specific to this fuel type and wind direction. No generic advice.`,
        }],
      }),

      anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 512,
        messages: [{
          role: 'user',
          content: `You are an IC's radio operator. Generate SHORT tactical alerts for the dashboard.

## SITUATION
${sitSum}

## FORMAT RULES
- headline: MAX 8 words. Radio callout style. Example: "Wind shift NW expected 14:30"
- detail: ONE sentence, MAX 15 words. Include specific numbers.
- icon: one of "wind" | "fire" | "evacuate" | "structure" | "power" | "terrain"
- Think ALERTS on a dashboard, not paragraphs. No explanations.
- 4-6 alerts, sorted critical first.

Return ONLY JSON array:
[{"priority":"critical"|"high"|"medium","icon":"wind","headline":"8 words max","detail":"one sentence max 15 words","actionable":true|false}]`,
        }],
      }),
    ])

    // Parse LCES
    let lces: LCESOutput | undefined
    try {
      const lcesRaw = lcesResponse.content[0].type === 'text' ? lcesResponse.content[0].text : '{}'
      lces = parseJson(lcesRaw) as LCESOutput
    } catch (e) {
      console.error('[SUGGEST] LCES parse error:', (e as Error).message)
    }

    // Parse tactical alerts
    const alertRaw = alertResponse.content[0].type === 'text' ? alertResponse.content[0].text : '[]'
    const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2 }
    const alerts: TacticalAlert[] = parseJson(alertRaw).sort(
      (a: { priority: string }, b: { priority: string }) =>
        (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3)
    )

    return NextResponse.json({ alerts, lces })
  } catch (error) {
    console.error('[SUGGEST] Error:', (error as Error).message)
    return NextResponse.json(
      { error: 'Suggestion generation failed', details: (error as Error).message },
      { status: 500 }
    )
  }
}

function buildSituation(
  w: WeatherData,
  b: BiomeInfo,
  active: ActiveFire[],
  historical: HistoricalFire[],
  structuresInPath: number,
  powerLinesInPath: number
): string {
  let s = `Fuel: ${b.fuel_model} (${b.vegetation_zone})
Wx: ${w.temperature_f}°F, ${w.relative_humidity}% RH, wind ${w.wind_speed_mph}mph ${compassDir(w.wind_direction_deg)}, gusts ${w.wind_gusts_mph}mph, precip ${w.precipitation_in}in`

  if (active.length) {
    const closest = active.slice(0, 5)
    s += `\nActive detections: ${active.length} total`
    closest.forEach((f) => {
      s += `\n  ${f.distance_km}km ${f.satellite} FRP:${f.frp}MW conf:${f.confidence} (${f.acq_date})`
    })
  } else {
    s += `\nNo active satellite detections nearby`
  }

  if (structuresInPath > 0) {
    s += `\nINFRASTRUCTURE THREAT: ${structuresInPath} structures in projected fire path`
  }
  if (powerLinesInPath > 0) {
    s += `\nPOWER LINES: ${powerLinesInPath} power line segments in projected fire path`
  }

  if (historical.length) {
    s += `\nHistorical fires:`
    historical.slice(0, 3).forEach((f) => {
      s += `\n  ${f.incident_name} (${f.year}) ${f.acres.toLocaleString()}ac ${f.distance_km}km`
    })
  }

  return s
}
