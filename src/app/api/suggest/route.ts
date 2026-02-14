import { NextResponse } from 'next/server'
import { anthropic } from '@/lib/anthropic'
import type {
  WeatherData,
  BiomeInfo,
  FireAnalysis,
  MatchedFire,
} from '@/lib/types'

export async function POST(request: Request) {
  try {
    const { weather, biome, fireAnalysis, matchedFires } = await request.json()

    if (!weather || !biome || !fireAnalysis || !matchedFires) {
      return NextResponse.json(
        {
          error:
            'weather, biome, fireAnalysis, and matchedFires are required',
        },
        { status: 400 }
      )
    }

    const situationSummary = buildSituationSummary(
      weather,
      biome,
      fireAnalysis
    )
    const historicalSummary = buildHistoricalSummary(matchedFires)

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-6-20250925',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: `You are an expert wildfire tactical advisor. Based on the current fire situation and historical fire data, provide actionable tactical suggestions.

## Current Fire Situation
${situationSummary}

## Similar Historical Fires
${historicalSummary}

Generate 3-5 tactical suggestions. For each, cite specific historical fires that inform the recommendation. Return ONLY a JSON array:

[
  {
    "priority": "critical" | "high" | "medium",
    "action": "specific tactical action to take",
    "reasoning": "why this action is recommended given current conditions",
    "historical_basis": "which historical fire(s) inform this, and what happened"
  }
]

Return ONLY valid JSON, no markdown or explanation.`,
        },
      ],
    })

    const text =
      response.content[0].type === 'text' ? response.content[0].text : '[]'
    const suggestions = JSON.parse(text)

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error('[SUGGEST] Error:', (error as Error).message)
    return NextResponse.json(
      { error: 'Suggestion generation failed', details: (error as Error).message },
      { status: 500 }
    )
  }
}

function buildSituationSummary(
  weather: WeatherData,
  biome: BiomeInfo,
  fire: FireAnalysis
): string {
  return `- Vegetation: ${biome.vegetation_zone} (${biome.fuel_model})
- Fire size: ${fire.estimated_size}, intensity: ${fire.intensity}
- Flame length: ${fire.flame_length}
- Behavior: ${fire.behavior}
- Fuel visible: ${fire.fuel_type_visible}
- Smoke/flames: ${fire.color_description}
- Temperature: ${weather.temperature_c}°C
- Humidity: ${weather.relative_humidity}%
- Wind: ${weather.wind_speed_kmh} km/h from ${weather.wind_direction_deg}°
- Precipitation: ${weather.precipitation_mm} mm`
}

function buildHistoricalSummary(fires: MatchedFire[]): string {
  if (!fires.length) return 'No similar historical fires found.'

  return fires
    .map(
      (f, i) =>
        `${i + 1}. ${f.incident_name} (${f.year}) — ${f.final_size_acres} acres
   Fuel: ${f.fuel}, Wind: ${f.wind_speed}, Terrain: ${f.terrain}
   Behavior: ${f.behavior}
   Tactics: ${f.tactics_used}
   Outcome: ${f.outcome}
   Similarity: ${(f.similarity * 100).toFixed(0)}%`
    )
    .join('\n')
}
