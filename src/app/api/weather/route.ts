import { NextResponse } from 'next/server'
import type { WeatherData, BiomeInfo } from '@/lib/types'

function deriveBiome(lat: number, lon: number, weather: WeatherData): BiomeInfo {
  const { temperature_c, relative_humidity, wind_speed_kmh, precipitation_mm } = weather

  // Santa Ana / extreme fire weather conditions
  if (wind_speed_kmh > 40 && relative_humidity < 15) {
    return {
      vegetation_zone: 'Dry Chaparral (Santa Ana conditions)',
      fuel_model: 'SH7 - Very High Load Dry Shrub',
    }
  }

  // Desert regions (inland, hot, dry)
  if (lon > -118 && temperature_c > 30 && relative_humidity < 20) {
    return {
      vegetation_zone: 'Desert Scrub',
      fuel_model: 'SH1 - Low Load Dry Shrub',
    }
  }

  // Coastal regions
  if (lon < -121 && relative_humidity > 50) {
    return {
      vegetation_zone: 'Coastal Sage Scrub / Maritime Chaparral',
      fuel_model: 'SH5 - High Load Dry Shrub',
    }
  }

  // Cooler, wetter — forest
  if (temperature_c < 15 && precipitation_mm > 2) {
    return {
      vegetation_zone: 'Mixed Conifer Forest',
      fuel_model: 'TL6 - Moderate Load Broadleaf Litter',
    }
  }

  // High elevation / cold
  if (temperature_c < 10) {
    return {
      vegetation_zone: 'Subalpine Forest',
      fuel_model: 'TL3 - Moderate Load Conifer Litter',
    }
  }

  // Grassland (hot, moderate humidity)
  if (temperature_c > 25 && relative_humidity > 20 && relative_humidity < 40) {
    return {
      vegetation_zone: 'Annual Grassland',
      fuel_model: 'GR4 - Moderate Load Dry Grass',
    }
  }

  // Default
  return {
    vegetation_zone: 'Interior Chaparral / Oak Woodland',
    fuel_model: 'SH5 - High Load Dry Shrub',
  }
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

    const params = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      current:
        'temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,precipitation',
    })

    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?${params}`
    )

    if (!res.ok) {
      throw new Error(`Open-Meteo API error: ${res.status}`)
    }

    const data = await res.json()
    const current = data.current

    const weather: WeatherData = {
      temperature_c: current.temperature_2m,
      relative_humidity: current.relative_humidity_2m,
      wind_speed_kmh: current.wind_speed_10m,
      wind_direction_deg: current.wind_direction_10m,
      precipitation_mm: current.precipitation,
    }

    const biome = deriveBiome(latitude, longitude, weather)

    return NextResponse.json({ weather, biome })
  } catch (error) {
    console.error('[WEATHER] Error:', (error as Error).message)
    return NextResponse.json(
      { error: 'Weather fetch failed', details: (error as Error).message },
      { status: 500 }
    )
  }
}
