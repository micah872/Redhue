import { NextResponse } from 'next/server'
import type { WeatherData, BiomeInfo, ActiveFire, HistoricalFire, FireDangerScore } from '@/lib/types'

// FBFM40 fuel labels → danger score
const HEAVY_FUEL_LABELS = new Set([
  'Very Heavy Dry Brush', 'Very Heavy Green Brush', 'Very Heavy Timber-Brush',
  'Very Heavy Slash', 'Heavy Slash',
])
const MODERATE_FUEL_LABELS = new Set([
  'Heavy Dry Brush', 'Heavy Green Brush', 'Heavy Dry Grass',
  'Moderate Timber-Shrub', 'Heavy Pine Litter', 'Moderate Slash',
  'Heavy Humid Grass-Shrub', 'Tall Coarse Humid Grass',
])
const LIGHT_FUEL_LABELS = new Set([
  'Moderate Dry Brush', 'Moderate Green Brush', 'Moderate Dry Grass',
  'Light Timber-Brush Mix', 'Moderate Pine Litter', 'Light Slash',
  'Moderate Grass-Shrub', 'Dry Grass-Shrub Mix',
])

function scoreFuel(fuelModel: string): number {
  if (HEAVY_FUEL_LABELS.has(fuelModel)) return 25
  if (MODERATE_FUEL_LABELS.has(fuelModel)) return 15
  if (LIGHT_FUEL_LABELS.has(fuelModel)) return 10
  // Non-burnable (Urban, Water, Barren, Snow, Agriculture)
  if (['Urban / Developed', 'Water', 'Barren', 'Snow / Ice', 'Agriculture'].includes(fuelModel)) return 0
  return 5
}

export async function POST(request: Request) {
  try {
    const { weather, biome, activeFires = [], historicalFires = [] } = (await request.json()) as {
      weather: WeatherData
      biome: BiomeInfo
      activeFires: ActiveFire[]
      historicalFires: HistoricalFire[]
    }

    if (!weather || !biome) {
      return NextResponse.json({ error: 'weather and biome required' }, { status: 400 })
    }

    const factors = { weather: 0, fuel: 0, activeFires: 0, historical: 0 }

    // Weather (0-30)
    if (weather.temperature_f > 95) factors.weather += 5
    else if (weather.temperature_f > 86) factors.weather += 3
    if (weather.relative_humidity < 15) factors.weather += 10
    else if (weather.relative_humidity < 25) factors.weather += 5
    if (weather.wind_speed_mph > 25) factors.weather += 10
    else if (weather.wind_speed_mph > 15) factors.weather += 5
    if (weather.wind_gusts_mph > 35) factors.weather += 5

    // Fuel (0-25)
    factors.fuel = scoreFuel(biome.fuel_model)

    // Active fires (0-25)
    const within5 = activeFires.filter((f) => f.distance_km <= 5)
    const within25 = activeFires.filter((f) => f.distance_km <= 25)
    if (within5.length > 0) factors.activeFires += 15
    if (within25.some((f) => f.frp > 100)) factors.activeFires += 10
    if (within25.length >= 10) factors.activeFires += 10
    else if (within25.length >= 5) factors.activeFires += 5
    else if (within25.length >= 1) factors.activeFires += 3
    factors.activeFires = Math.min(25, factors.activeFires)

    // Historical (0-20)
    if (historicalFires.some((f) => f.acres > 100000 && f.distance_km <= 50)) factors.historical += 10
    if (historicalFires.some((f) => f.acres > 10000 && f.distance_km <= 25)) factors.historical += 5
    if (historicalFires.some((f) => f.fire_behavior?.toLowerCase().includes('extreme') || f.fire_behavior?.toLowerCase().includes('erratic')))
      factors.historical += 5

    const score = Math.min(100, factors.weather + factors.fuel + factors.activeFires + factors.historical)

    let rating: FireDangerScore['rating']
    let incidentType: FireDangerScore['incidentType']

    if (score <= 20) { rating = 'Low'; incidentType = 'Type 5' }
    else if (score <= 40) { rating = 'Moderate'; incidentType = 'Type 4' }
    else if (score <= 60) { rating = 'High'; incidentType = 'Type 3' }
    else if (score <= 80) { rating = 'Very High'; incidentType = 'Type 2' }
    else { rating = 'Extreme'; incidentType = 'Type 1' }

    const fireDanger: FireDangerScore = {
      score,
      rating,
      incidentType,
      factors,
      reasoning: `Weather ${factors.weather}/30 | Fuel ${factors.fuel}/25 | Active fires ${factors.activeFires}/25 | Historical ${factors.historical}/20`,
    }

    return NextResponse.json({ fireDanger })
  } catch (error) {
    console.error('[FIRE-DANGER] Error:', (error as Error).message)
    return NextResponse.json(
      { error: 'Fire danger scoring failed', details: (error as Error).message },
      { status: 500 }
    )
  }
}
