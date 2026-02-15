import type { WeatherData, ActiveFire } from './types'

// Polling intervals in milliseconds
export const POLL_FIRES = 150_000   // 2.5 min — GOES refreshes every 10-15min
export const POLL_WEATHER = 300_000 // 5 min — Open-Meteo updates hourly

// Format seconds since last update into human-readable string
export function formatFreshness(updatedAt: number): string {
  const seconds = Math.floor((Date.now() - updatedAt) / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  return `${Math.floor(minutes / 60)}h`
}

// Freshness color class based on age
export function freshnessColor(updatedAt: number): string {
  const seconds = (Date.now() - updatedAt) / 1000
  if (seconds < 30) return 'text-score-green'
  if (seconds < 120) return 'text-score-yellow'
  return 'text-score-red'
}

// Determine if AI suggestions should be refreshed based on material changes
export function shouldRefreshAI(
  prev: { weather: WeatherData; fires: ActiveFire[] } | null,
  current: { weather: WeatherData; fires: ActiveFire[] }
): boolean {
  if (!prev) return true

  // Wind direction changed by more than 20 degrees
  const windDelta = Math.abs(prev.weather.wind_direction_deg - current.weather.wind_direction_deg)
  const normalizedWindDelta = Math.min(windDelta, 360 - windDelta)
  if (normalizedWindDelta > 20) return true

  // Wind speed changed by more than 5 mph
  if (Math.abs(prev.weather.wind_speed_mph - current.weather.wind_speed_mph) > 5) return true

  // Humidity crossed critical threshold (15%)
  const prevBelow = prev.weather.relative_humidity < 15
  const currBelow = current.weather.relative_humidity < 15
  if (prevBelow !== currBelow) return true

  // New fire detection appeared within 10km that wasn't there before
  const prevClose = prev.fires.filter((f) => f.distance_km <= 10).length
  const currClose = current.fires.filter((f) => f.distance_km <= 10).length
  if (currClose > prevClose) return true

  return false
}
