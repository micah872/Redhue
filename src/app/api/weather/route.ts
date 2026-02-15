import { NextResponse } from 'next/server'
import { fetchWeatherApi } from 'openmeteo'
import type { WeatherData, BiomeInfo, HourlyForecast } from '@/lib/types'

// Scott & Burgan FBFM40: code → { label, description }
const FBFM40: Record<number, { label: string; description: string }> = {
  91:  { label: 'Urban / Developed',       description: 'Buildings, roads, and developed areas — minimal wildland fuel' },
  92:  { label: 'Snow / Ice',              description: 'Snow or ice covered — no burnable fuel' },
  93:  { label: 'Agriculture',             description: 'Cropland or irrigated fields — low fire risk unless dry' },
  98:  { label: 'Water',                   description: 'Open water — no fuel present' },
  99:  { label: 'Barren',                  description: 'Bare rock, sand, or dirt — no vegetation to burn' },
  101: { label: 'Short Sparse Dry Grass',  description: 'Thin, patchy dry grass — fast-moving but low-intensity surface fire' },
  102: { label: 'Dry Grass',               description: 'Dry grass roughly 1 ft tall — expect rapid spread with low flame lengths' },
  103: { label: 'Tall Coarse Humid Grass', description: 'Tall coarse grass with some moisture — moderate spread, higher flames' },
  104: { label: 'Moderate Dry Grass',      description: 'Continuous dry grass ~2 ft — rapid spread, moderate flame lengths' },
  105: { label: 'Short Humid Grass',       description: 'Short grass with moisture — slower spread, lower intensity' },
  106: { label: 'Humid Grass',             description: 'Moderate grass with moisture — moderate fire behavior' },
  107: { label: 'Heavy Dry Grass',         description: 'Dense dry grass 2-3 ft — very fast spread, significant flame lengths' },
  108: { label: 'Tall Coarse Humid Grass', description: 'Heavy tall grass with some moisture — high flame lengths possible' },
  109: { label: 'Dense Humid Grass',       description: 'Very heavy grass load — extreme fire behavior when dry' },
  121: { label: 'Dry Grass-Shrub Mix',     description: 'Grass with scattered dry shrubs — fire spreads through grass, shrubs add intensity' },
  122: { label: 'Moderate Grass-Shrub',    description: 'Mix of grass and dry shrubs — moderate spread and flame length' },
  123: { label: 'Humid Grass-Shrub',       description: 'Grass-shrub mix with moisture — slower spread than dry types' },
  124: { label: 'Heavy Humid Grass-Shrub', description: 'Dense grass-shrub mix — high intensity possible when conditions dry out' },
  141: { label: 'Light Dry Brush',         description: 'Sparse dry brush — low-intensity fire, easy to suppress' },
  142: { label: 'Moderate Dry Brush',      description: 'Moderate dry brush — expect moderate flame lengths and spread' },
  143: { label: 'Moderate Green Brush',    description: 'Brush with live moisture — less flammable, slower spread' },
  144: { label: 'Light Green Brush',       description: 'Light brush with moisture — low fire intensity' },
  145: { label: 'Heavy Dry Brush',         description: 'Dense dry chaparral/brush — high intensity, difficult to suppress directly' },
  146: { label: 'Light Green Brush',       description: 'Sparse brush with moisture — low spread potential' },
  147: { label: 'Very Heavy Dry Brush',    description: 'Extremely dense dry chaparral — expect extreme fire behavior, long flame lengths, rapid spread' },
  148: { label: 'Heavy Green Brush',       description: 'Dense brush with live moisture — dangerous when moisture drops' },
  149: { label: 'Very Heavy Green Brush',  description: 'Very dense live brush — extreme behavior possible under Santa Ana or Diablo winds' },
  161: { label: 'Light Timber-Brush Mix',  description: 'Open forest with grass and brush understory — surface fire with moderate intensity' },
  162: { label: 'Moderate Timber-Shrub',   description: 'Forest with shrub understory — moderate spread, torching possible' },
  163: { label: 'Timber-Grass-Shrub Mix',  description: 'Forest with grass and shrubs — mixed fuel, fire can transition from surface to canopy' },
  164: { label: 'Dwarf Conifer Understory',description: 'Small conifers under larger trees — ladder fuels that can carry fire into canopy' },
  165: { label: 'Very Heavy Timber-Brush', description: 'Dense forest with heavy brush — extreme fire potential, crown fire likely' },
  181: { label: 'Compact Pine Litter',     description: 'Packed pine needle litter on forest floor — slow creeping surface fire' },
  182: { label: 'Hardwood Leaf Litter',    description: 'Oak or broadleaf litter — low-intensity surface fire, slow spread' },
  183: { label: 'Moderate Pine Litter',    description: 'Pine needle litter — steady surface fire, moderate intensity' },
  184: { label: 'Small Downed Logs',       description: 'Forest floor with small logs and debris — smoldering, moderate intensity' },
  185: { label: 'Heavy Pine Litter',       description: 'Deep pine needle bed — sustained surface fire, can produce heavy smoke' },
  186: { label: 'Moderate Hardwood Litter',description: 'Broadleaf litter with some depth — moderate surface fire' },
  187: { label: 'Large Downed Logs',       description: 'Heavy downed timber — long-burning, difficult to fully suppress' },
  188: { label: 'Long-Needle Pine Litter', description: 'Ponderosa/longleaf pine needles — fires spread readily, moderate flame lengths' },
  189: { label: 'Very Heavy Leaf Litter',  description: 'Deep hardwood litter — intense surface fire when dry' },
  201: { label: 'Light Slash',             description: 'Light logging debris — manageable fire intensity' },
  202: { label: 'Moderate Slash',          description: 'Moderate logging residue — higher flame lengths, faster spread' },
  203: { label: 'Heavy Slash',             description: 'Heavy logging debris — intense fire, difficult suppression' },
  204: { label: 'Very Heavy Slash',        description: 'Extremely heavy slash piles — extreme fire behavior, avoid direct attack' },
}

// Resolve an EVT pixel value to a human-readable name via the raster attribute table
async function resolveEvtName(evtCode: number): Promise<string | null> {
  try {
    const url = `https://lfps.usgs.gov/arcgis/rest/services/Landfire_LF230/US_230EVT/ImageServer/rasterAttributeTable?where=Value=${evtCode}&outFields=EVT_NAME,EVT_PHYS&f=json`
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return null
    const data = await res.json()
    const row = data.features?.[0]?.attributes
    if (row?.EVT_NAME && row.EVT_NAME !== 'Fill-NoData' && row.EVT_NAME !== 'NoData') {
      return row.EVT_NAME as string
    }
    if (row?.EVT_PHYS && row.EVT_PHYS !== 'Fill-NoData') {
      return row.EVT_PHYS as string
    }
    return null
  } catch {
    return null
  }
}

// Broad EVT code ranges → friendly descriptions when raster attribute table lookup fails
function describeEvtCode(code: number): string {
  if (code >= 7290 && code <= 7299) return 'Developed / Urban Area'
  if (code >= 7190 && code <= 7199) return 'Open Water'
  if (code >= 7180 && code <= 7189) return 'Snow / Ice'
  if (code >= 7100 && code <= 7179) return 'Agricultural Land'
  if (code >= 7060 && code <= 7099) return 'Recently Disturbed or Cleared'
  if (code >= 2000 && code <= 2999) return 'Conifer or Mixed Forest'
  if (code >= 3000 && code <= 3999) return 'Hardwood or Mixed Forest'
  if (code >= 4000 && code <= 4999) return 'Shrubland / Chaparral'
  if (code >= 5000 && code <= 5999) return 'Grassland or Herbaceous'
  if (code >= 6000 && code <= 6999) return 'Sparse or Barren Ground'
  return 'Wildland Vegetation'
}

async function fetchLandfireBiome(latitude: number, longitude: number): Promise<BiomeInfo | null> {
  const geom = JSON.stringify({ x: longitude, y: latitude, spatialReference: { wkid: 4326 } })

  const [evtRes, fbfmRes] = await Promise.all([
    fetch(
      `https://lfps.usgs.gov/arcgis/rest/services/Landfire_LF230/US_230EVT/ImageServer/identify?geometry=${encodeURIComponent(geom)}&geometryType=esriGeometryPoint&f=json`,
      { signal: AbortSignal.timeout(8000) }
    ).catch(() => null),
    fetch(
      `https://lfps.usgs.gov/arcgis/rest/services/Landfire_LF230/US_230FBFM40/ImageServer/identify?geometry=${encodeURIComponent(geom)}&geometryType=esriGeometryPoint&f=json`,
      { signal: AbortSignal.timeout(8000) }
    ).catch(() => null),
  ])

  let vegetationZone = ''
  let fuelModel = ''
  let fuelDescription = ''

  if (evtRes?.ok) {
    const evtData = await evtRes.json()
    const evtValue = evtData.value
    // Try to get name from identify response first
    const evtName = evtData.properties?.EVT_NAME || evtData.properties?.ClassName || evtData.attributes?.EVT_NAME || evtData.attributes?.ClassName
    if (evtName && evtName !== 'NoData' && evtName !== 'Fill-NoData') {
      vegetationZone = evtName
    } else if (evtValue && evtValue !== 'NoData' && evtValue !== '-9999') {
      // Resolve via raster attribute table, fall back to broad category
      const code = parseInt(evtValue, 10)
      if (!isNaN(code)) {
        const resolved = await resolveEvtName(code).catch(() => null)
        vegetationZone = resolved || describeEvtCode(code)
      }
    }
  }

  if (fbfmRes?.ok) {
    const fbfmData = await fbfmRes.json()
    const fbfmValue = parseInt(fbfmData.value, 10)
    if (!isNaN(fbfmValue) && FBFM40[fbfmValue]) {
      fuelModel = FBFM40[fbfmValue].label
      fuelDescription = FBFM40[fbfmValue].description
    } else if (fbfmData.value && fbfmData.value !== 'NoData' && fbfmData.value !== '-9999') {
      fuelModel = `Fuel type ${fbfmData.value}`
      fuelDescription = 'Fuel model data available but not in standard classification'
    }
  }

  if (!vegetationZone && !fuelModel) return null

  return {
    vegetation_zone: vegetationZone || 'Unknown',
    fuel_model: fuelModel || 'Unknown',
    fuel_description: fuelDescription || 'No detailed fuel description available',
  }
}

// Fallback heuristic when LANDFIRE is unavailable or outside CONUS
function deriveBiomeFallback(lat: number, lon: number, weather: WeatherData): BiomeInfo {
  const { temperature_f, relative_humidity, wind_speed_mph, precipitation_in } = weather

  if (wind_speed_mph > 25 && relative_humidity < 15) {
    return { vegetation_zone: 'Dry Chaparral (Santa Ana conditions)', fuel_model: 'Very Heavy Dry Brush', fuel_description: 'Extremely dense dry chaparral — expect extreme fire behavior, long flame lengths, rapid spread' }
  }
  if (lon > -118 && temperature_f > 86 && relative_humidity < 20) {
    return { vegetation_zone: 'Desert Scrub', fuel_model: 'Light Dry Brush', fuel_description: 'Sparse dry brush — low-intensity fire, easy to suppress' }
  }
  if (lon < -121 && relative_humidity > 50) {
    return { vegetation_zone: 'Coastal Sage Scrub / Maritime Chaparral', fuel_model: 'Heavy Dry Brush', fuel_description: 'Dense dry chaparral/brush — high intensity, difficult to suppress directly' }
  }
  if (temperature_f < 59 && precipitation_in > 0.08) {
    return { vegetation_zone: 'Mixed Conifer Forest', fuel_model: 'Moderate Hardwood Litter', fuel_description: 'Broadleaf litter with some depth — moderate surface fire' }
  }
  if (temperature_f < 50) {
    return { vegetation_zone: 'Subalpine Forest', fuel_model: 'Moderate Pine Litter', fuel_description: 'Pine needle litter — steady surface fire, moderate intensity' }
  }
  if (temperature_f > 77 && relative_humidity > 20 && relative_humidity < 40) {
    return { vegetation_zone: 'Annual Grassland', fuel_model: 'Moderate Dry Grass', fuel_description: 'Continuous dry grass ~2 ft — rapid spread, moderate flame lengths' }
  }
  return { vegetation_zone: 'Interior Chaparral / Oak Woodland', fuel_model: 'Heavy Dry Brush', fuel_description: 'Dense dry chaparral/brush — high intensity, difficult to suppress directly' }
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

    const params = {
      latitude,
      longitude,
      current: [
        'temperature_2m',
        'relative_humidity_2m',
        'apparent_temperature',
        'precipitation',
        'wind_speed_10m',
        'wind_direction_10m',
        'wind_gusts_10m',
      ],
      hourly: [
        'temperature_2m',
        'relative_humidity_2m',
        'wind_speed_10m',
        'wind_gusts_10m',
        'precipitation',
      ],
      forecast_hours: 24,
      wind_speed_unit: 'mph' as const,
      precipitation_unit: 'inch' as const,
      temperature_unit: 'fahrenheit' as const,
    }

    // Fetch weather and LANDFIRE biome in parallel
    const [responses, landfireBiome] = await Promise.all([
      fetchWeatherApi('https://api.open-meteo.com/v1/forecast', params),
      fetchLandfireBiome(latitude, longitude).catch((err) => {
        console.error('[WEATHER] LANDFIRE error:', err.message)
        return null
      }),
    ])

    const response = responses[0]
    const current = response.current()!

    const weather: WeatherData = {
      temperature_f: Math.round(current.variables(0)!.value() * 10) / 10,
      relative_humidity: Math.round(current.variables(1)!.value()),
      apparent_temperature_f: Math.round(current.variables(2)!.value() * 10) / 10,
      precipitation_in: Math.round(current.variables(3)!.value() * 100) / 100,
      wind_speed_mph: Math.round(current.variables(4)!.value() * 10) / 10,
      wind_direction_deg: Math.round(current.variables(5)!.value()),
      wind_gusts_mph: Math.round(current.variables(6)!.value() * 10) / 10,
    }

    const biome = landfireBiome || deriveBiomeFallback(latitude, longitude, weather)

    // Parse hourly forecast
    let hourlyForecast: HourlyForecast[] = []
    try {
      const hourly = response.hourly()
      if (hourly) {
        const temps = hourly.variables(0)!.valuesArray()!
        const rhs = hourly.variables(1)!.valuesArray()!
        const winds = hourly.variables(2)!.valuesArray()!
        const gusts = hourly.variables(3)!.valuesArray()!
        const precips = hourly.variables(4)!.valuesArray()!
        const count = Math.min(temps.length, 24)
        for (let i = 0; i < count; i++) {
          const time = new Date((Number(hourly.time()) + i * hourly.interval()) * 1000)
          const rh = Math.round(rhs[i])
          const ws = Math.round(winds[i] * 10) / 10
          const gs = Math.round(gusts[i] * 10) / 10
          hourlyForecast.push({
            hour: time.getHours(),
            temperature_f: Math.round(temps[i] * 10) / 10,
            relative_humidity: rh,
            wind_speed_mph: ws,
            wind_gusts_mph: gs,
            precipitation_in: Math.round(precips[i] * 100) / 100,
            isDangerous: rh < 20 || ws > 25 || gs > 35,
          })
        }
      }
    } catch (e) {
      console.error('[WEATHER] Hourly forecast parse error:', (e as Error).message)
    }

    return NextResponse.json({ weather, biome, hourlyForecast })
  } catch (error) {
    console.error('[WEATHER] Error:', (error as Error).message)
    return NextResponse.json(
      { error: 'Weather fetch failed', details: (error as Error).message },
      { status: 500 }
    )
  }
}
