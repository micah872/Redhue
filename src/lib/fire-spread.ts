import type { ActiveFire, WeatherData, SpreadCone } from './types'

// Simplified Rothermel elliptical fire spread model
// Base Rate of Spread (chains/hour) by FBFM40 fuel label keywords
const FUEL_ROS: [RegExp, number][] = [
  [/short.*sparse.*grass/i, 78],
  [/dry.*grass|grass.*dry/i, 104],
  [/moderate.*grass/i, 60],
  [/heavy.*grass/i, 90],
  [/very.*heavy.*brush/i, 55],
  [/heavy.*brush/i, 40],
  [/moderate.*brush/i, 25],
  [/light.*brush/i, 18],
  [/timber.*shrub|shrub.*timber/i, 15],
  [/timber.*brush/i, 12],
  [/compact.*litter|litter.*compact/i, 3],
  [/moderate.*litter|pine.*litter/i, 6],
  [/slash/i, 10],
  [/chaparral/i, 35],
  [/dormant.*brush/i, 8],
  [/urban|developed/i, 5],
]

function getBaseROS(fuelModel: string): number {
  for (const [pattern, ros] of FUEL_ROS) {
    if (pattern.test(fuelModel)) return ros
  }
  return 20 // default moderate
}

// Anderson (1983) Length-to-Breadth ratio from wind speed
function lengthToBreadth(windMph: number): number {
  return 0.936 * Math.exp(0.1147 * windMph) + 0.461 * Math.exp(-0.0692 * windMph)
}

// Convert chains to meters
const CHAINS_TO_METERS = 20.1168

function metersToLatDeg(meters: number): number {
  return meters / 111320
}

function metersToLonDeg(meters: number, lat: number): number {
  return meters / (111320 * Math.cos((lat * Math.PI) / 180))
}

// Generate a forward-facing fan polygon that originates at the fire point
// and extends only in the downwind direction. The fire is at the narrow end.
function fanPolygon(
  fireLat: number,
  fireLon: number,
  headDistM: number,
  flankDistM: number,
  windDirRad: number,
  numPoints: number = 20
): [number, number][] {
  const points: [number, number][] = []

  // Start at the fire origin
  points.push([fireLat, fireLon])

  // Generate the fan arc: sweep from -90° to +90° relative to wind direction
  // This creates a half-ellipse that fans forward from the fire point
  for (let i = 0; i <= numPoints; i++) {
    const t = (i / numPoints) // 0 to 1
    const angle = -Math.PI / 2 + t * Math.PI // -90° to +90°

    // Distance along the wind axis (forward)
    const forward = headDistM * Math.cos(angle)
    // Distance perpendicular to wind (lateral spread)
    const lateral = flankDistM * Math.sin(angle)

    // Rotate into wind direction coordinate system
    // windDirRad points downwind (direction fire travels)
    const dx = forward * Math.cos(windDirRad) - lateral * Math.sin(windDirRad)
    const dy = forward * Math.sin(windDirRad) + lateral * Math.cos(windDirRad)

    // Convert meters offset to lat/lng
    const lat = fireLat + metersToLatDeg(dx)
    const lon = fireLon + metersToLonDeg(dy, fireLat)

    points.push([lat, lon])
  }

  // Close back to fire origin
  points.push([fireLat, fireLon])

  return points
}

// Calculate area of polygon in acres using shoelace formula
function polygonAreaAcres(coords: [number, number][]): number {
  let area = 0
  for (let i = 0; i < coords.length - 1; i++) {
    const [lat1, lon1] = coords[i]
    const [lat2, lon2] = coords[i + 1]
    const x1 = lon1 * 111320 * Math.cos((lat1 * Math.PI) / 180)
    const y1 = lat1 * 111320
    const x2 = lon2 * 111320 * Math.cos((lat2 * Math.PI) / 180)
    const y2 = lat2 * 111320
    area += x1 * y2 - x2 * y1
  }
  const sqMeters = Math.abs(area) / 2
  return Math.round(sqMeters * 0.000247105)
}

// Compute the head point (tip of the cone at a given time step) for labels
function headPoint(
  fireLat: number,
  fireLon: number,
  headDistM: number,
  windDirRad: number
): [number, number] {
  const dx = headDistM * Math.cos(windDirRad)
  const dy = headDistM * Math.sin(windDirRad)
  return [
    fireLat + metersToLatDeg(dx),
    fireLon + metersToLonDeg(dy, fireLat),
  ]
}

export function calculateSpreadCones(
  fires: ActiveFire[],
  weather: WeatherData,
  fuelModel: string,
  userLat?: number,
  userLon?: number,
  timeSteps: number[] = [30, 60, 120]
): SpreadCone[] {
  const baseROS = getBaseROS(fuelModel)
  const windFactor = 1 + 0.04 * weather.wind_speed_mph
  const ros = baseROS * windFactor // chains/hour
  const lb = lengthToBreadth(weather.wind_speed_mph)

  // Wind direction: meteorological convention is "from", fire spreads downwind
  const fireHeadingDeg = weather.wind_direction_deg
  const windDirRad = (fireHeadingDeg * Math.PI) / 180

  function buildCone(lat: number, lon: number): SpreadCone {
    const polygons = timeSteps.map((minutes) => {
      const hours = minutes / 60
      const headDistChains = ros * hours
      const headDistM = headDistChains * CHAINS_TO_METERS
      const flankDistM = headDistM / lb

      const coordinates = fanPolygon(lat, lon, headDistM, flankDistM, windDirRad)
      const head = headPoint(lat, lon, headDistM, windDirRad)

      return {
        timeMinutes: minutes,
        coordinates,
        areaAcres: polygonAreaAcres(coordinates),
        headLat: head[0],
        headLon: head[1],
      }
    })

    return {
      fireLatitude: lat,
      fireLongitude: lon,
      polygons,
      headingDeg: fireHeadingDeg,
      rosChPerHr: Math.round(ros * 10) / 10,
    }
  }

  // Top 3 fires within 50km
  const candidates = fires
    .filter((f) => f.distance_km <= 50)
    .sort((a, b) => b.frp - a.frp || a.distance_km - b.distance_km)
    .slice(0, 3)

  if (candidates.length > 0) {
    return candidates.map((fire) => buildCone(fire.latitude, fire.longitude))
  }

  // No nearby fires: project a "what-if" cone from user's location
  if (userLat != null && userLon != null) {
    return [buildCone(userLat, userLon)]
  }

  return []
}
