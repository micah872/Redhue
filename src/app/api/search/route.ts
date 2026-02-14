import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { generateEmbedding } from '@/lib/openai'
import type { WeatherData, BiomeInfo, FireAnalysis } from '@/lib/types'

function buildSearchNarrative(
  weather: WeatherData,
  biome: BiomeInfo,
  fireAnalysis: FireAnalysis
): string {
  return [
    `Fuel: ${biome.vegetation_zone}, ${fireAnalysis.fuel_type_visible}`,
    `Behavior: ${fireAnalysis.behavior}`,
    `Intensity: ${fireAnalysis.intensity}`,
    `Flame length: ${fireAnalysis.flame_length}`,
    `Wind: ${weather.wind_speed_kmh} km/h from ${weather.wind_direction_deg}°`,
    `Humidity: ${weather.relative_humidity}%`,
    `Temperature: ${weather.temperature_c}°C`,
    `Estimated size: ${fireAnalysis.estimated_size}`,
  ].join('. ')
}

export async function POST(request: Request) {
  try {
    const { weather, biome, fireAnalysis } = await request.json()

    if (!weather || !biome || !fireAnalysis) {
      return NextResponse.json(
        { error: 'weather, biome, and fireAnalysis are required' },
        { status: 400 }
      )
    }

    const narrative = buildSearchNarrative(weather, biome, fireAnalysis)
    const embedding = await generateEmbedding(narrative)

    const { data, error } = await getSupabase().rpc('match_fires', {
      query_embedding: embedding,
      match_count: 5,
      match_threshold: 0.5,
    })

    if (error) throw error

    return NextResponse.json({ matches: data })
  } catch (error) {
    console.error('[SEARCH] Error:', (error as Error).message)
    return NextResponse.json(
      { error: 'Search failed', details: (error as Error).message },
      { status: 500 }
    )
  }
}
