import type { LocationData, ActiveFire, HistoricalFire, WeatherData, BiomeInfo, HourlyForecast, TacticalAlert, LCESOutput, FireDangerScore, InfrastructureData, CalFireIncident, FirePerimeter } from './types'

// Demo location: Paradise, CA area (site of the 2018 Camp Fire)
export const DEMO_LOCATION: LocationData = {
  latitude: 39.7596,
  longitude: -121.6219,
  timestamp: new Date().toISOString(),
}

export const DEMO_WEATHER: WeatherData = {
  temperature_f: 87,
  apparent_temperature_f: 89,
  relative_humidity: 12,
  wind_speed_mph: 28,
  wind_gusts_mph: 45,
  wind_direction_deg: 45, // NE wind
  precipitation_in: 0,
}

export const DEMO_BIOME: BiomeInfo = {
  vegetation_zone: 'Sierra Nevada Mixed Conifer',
  fuel_model: 'Timber with heavy brush understory',
  fuel_description: 'Dense mixed conifer forest with heavy dead fuel loading, moderate slope. Fire behavior expected to be aggressive with torching and spotting under current wind conditions.',
}

export const DEMO_ACTIVE_FIRES: ActiveFire[] = [
  {
    latitude: 39.78,
    longitude: -121.58,
    brightness: 367.2,
    frp: 142.5,
    confidence: 'high',
    satellite: 'VIIRS',
    acq_date: new Date().toISOString().split('T')[0],
    acq_time: '1430',
    distance_km: 4.2,
  },
  {
    latitude: 39.77,
    longitude: -121.60,
    brightness: 312.8,
    frp: 68.3,
    confidence: 'nominal',
    satellite: 'GOES',
    acq_date: new Date().toISOString().split('T')[0],
    acq_time: '1445',
    distance_km: 2.8,
  },
]

export const DEMO_HISTORICAL_FIRES: HistoricalFire[] = [
  {
    incident_name: 'Camp Fire',
    year: 2018,
    acres: 153336,
    latitude: 39.8104,
    longitude: -121.4370,
    discovery_date: '2018-11-08',
    cause: 'Power line',
    distance_km: 16.2,
  },
  {
    incident_name: 'Dixie Fire',
    year: 2021,
    acres: 963309,
    latitude: 40.0277,
    longitude: -121.3847,
    discovery_date: '2021-07-13',
    cause: 'Power line',
    distance_km: 34.8,
  },
  {
    incident_name: 'North Complex Fire',
    year: 2020,
    acres: 318935,
    latitude: 39.7883,
    longitude: -121.2472,
    discovery_date: '2020-08-17',
    cause: 'Lightning',
    distance_km: 31.5,
  },
]

export function buildDemoHourlyForecast(): HourlyForecast[] {
  const now = new Date()
  const currentHour = now.getHours()
  const forecast: HourlyForecast[] = []

  for (let i = 0; i < 24; i++) {
    const hour = (currentHour + i) % 24
    const isAfternoon = hour >= 12 && hour <= 18
    const temp = isAfternoon ? 87 + Math.round(Math.random() * 6) : 72 + Math.round(Math.random() * 8)
    const rh = isAfternoon ? 8 + Math.round(Math.random() * 6) : 18 + Math.round(Math.random() * 10)
    const wind = isAfternoon ? 25 + Math.round(Math.random() * 15) : 12 + Math.round(Math.random() * 8)

    forecast.push({
      hour,
      temperature_f: temp,
      relative_humidity: rh,
      wind_speed_mph: wind,
      wind_gusts_mph: wind + 10 + Math.round(Math.random() * 10),
      precipitation_in: 0,
      isDangerous: rh < 15 && wind > 25,
    })
  }

  return forecast
}

export const DEMO_ALERTS: TacticalAlert[] = [
  {
    priority: 'critical',
    icon: 'wind',
    headline: 'Wind shift NE 45 mph gusts',
    detail: 'Diablo winds forecasted through 2100, expect rapid fire spread downslope toward structures.',
    actionable: true,
  },
  {
    priority: 'critical',
    icon: 'fire',
    headline: 'Spot fires likely ahead of front',
    detail: 'Very high intensity detection 4.2 km NE with 28 mph winds — ember transport range ~2 km.',
    actionable: true,
  },
  {
    priority: 'high',
    icon: 'power',
    headline: 'Power lines in projected fire path',
    detail: '3 transmission line segments within 60-min spread cone, de-energize or reroute.',
    actionable: true,
  },
  {
    priority: 'high',
    icon: 'evacuate',
    headline: 'Evacuation window narrowing',
    detail: 'Spread projection shows fire reaching structures in ~45 min at current rate.',
    actionable: true,
  },
  {
    priority: 'medium',
    icon: 'terrain',
    headline: 'Steep slope doubles spread rate',
    detail: 'Fire approaching 30%+ slope from NE, anticipate crown fire transition.',
    actionable: false,
  },
]

export const DEMO_LCES: LCESOutput = {
  lookouts: [
    'Post lookout on Skyway ridge (39.765, -121.615) — clear view of fire approach from NE',
    'Secondary lookout at Pentz Rd / Clark Rd junction for structure defense visibility',
  ],
  communications: [
    'Command: Butte County Fire Tac 3 (154.280 MHz)',
    'Air-to-ground: CalFire Air Tac North',
    'Cell service degraded — use radio as primary',
  ],
  escapeRoutes: [
    'Primary: Skyway Rd southwest toward Chico (confirm not blocked by traffic)',
    'Secondary: Pentz Rd south to Hwy 70',
    'Trigger point: fire crosses Concow Rd or spots within 1 km of position',
  ],
  safetyZones: [
    'Chico Municipal Airport — large paved area, accessible via Skyway',
    'Paradise High School parking lot — 3+ acres paved',
    'Cal Water reservoir clearing off Pentz Rd',
  ],
  hazards: [
    'PG&E 115kV transmission lines along Pentz Rd corridor',
    'Propane tanks on rural residential properties along Skyway',
    'Single-lane evacuation bottleneck at Skyway/Clark Rd intersection',
    'Heavy dead fuel loading from bark beetle mortality (2014-2017)',
  ],
}

export const DEMO_FIRE_DANGER: FireDangerScore = {
  score: 82,
  rating: 'Extreme',
  incidentType: 'Type 1',
  factors: { weather: 28, fuel: 22, activeFires: 20, historical: 12 },
  reasoning: 'Critically low humidity (12%), strong NE winds (28 mph, gusts 45), heavy fuel loading in mixed conifer, 2 active detections within 5 km. Historical precedent: Camp Fire (2018) ignited under identical conditions.',
}

export const DEMO_INFRASTRUCTURE: InfrastructureData = {
  powerLines: [
    { id: 1001, voltage: '115000', coordinates: [[39.765, -121.63], [39.772, -121.61], [39.780, -121.59]], operator: 'PG&E' },
    { id: 1002, voltage: '60000', coordinates: [[39.755, -121.64], [39.760, -121.62], [39.768, -121.60]], operator: 'PG&E' },
    { id: 1003, voltage: '21000', coordinates: [[39.758, -121.625], [39.763, -121.618], [39.770, -121.608]] },
  ],
  structures: [
    { id: 2001, center: [39.762, -121.620], type: 'residential' },
    { id: 2002, center: [39.764, -121.618], type: 'residential' },
    { id: 2003, center: [39.760, -121.622], type: 'commercial' },
    { id: 2004, center: [39.766, -121.615], type: 'residential' },
    { id: 2005, center: [39.758, -121.625], type: 'school' },
    { id: 2006, center: [39.770, -121.610], type: 'residential' },
    { id: 2007, center: [39.763, -121.621], type: 'residential' },
    { id: 2008, center: [39.761, -121.617], type: 'residential' },
    { id: 2009, center: [39.768, -121.612], type: 'residential' },
    { id: 2010, center: [39.756, -121.628], type: 'church' },
    { id: 2011, center: [39.773, -121.605], type: 'residential' },
    { id: 2012, center: [39.759, -121.623], type: 'residential' },
  ],
  roads: [
    { id: 3001, name: 'Skyway', type: 'primary', coordinates: [[39.750, -121.640], [39.758, -121.625], [39.765, -121.615], [39.775, -121.600]] },
    { id: 3002, name: 'Pentz Rd', type: 'secondary', coordinates: [[39.755, -121.610], [39.765, -121.615], [39.780, -121.620]] },
    { id: 3003, name: 'Clark Rd', type: 'secondary', coordinates: [[39.752, -121.625], [39.760, -121.620], [39.770, -121.612]] },
    { id: 3004, name: 'Pearson Rd', type: 'tertiary', coordinates: [[39.758, -121.630], [39.762, -121.618], [39.768, -121.608]] },
  ],
  structuresInPath: 8,
  powerLinesInPath: 3,
}

export const DEMO_CALFIRE_INCIDENTS: CalFireIncident[] = [
  {
    incident_name: 'Feather Fire',
    latitude: 39.78,
    longitude: -121.58,
    acres: 1250,
    containment: 5,
    start_date: new Date().toISOString().split('T')[0],
    county: 'Butte',
    admin_unit: 'Butte Unit',
    is_active: true,
    distance_km: 4.2,
  },
  {
    incident_name: 'Concow Fire',
    latitude: 39.80,
    longitude: -121.52,
    acres: 480,
    containment: 0,
    start_date: new Date().toISOString().split('T')[0],
    county: 'Butte',
    admin_unit: 'Butte Unit',
    is_active: true,
    distance_km: 9.8,
  },
]

export const DEMO_FIRE_PERIMETERS: FirePerimeter[] = [
  {
    incident_name: 'Feather Fire',
    gis_acres: 1250,
    coordinates: [
      [
        [39.773, -121.595],
        [39.778, -121.585],
        [39.785, -121.575],
        [39.790, -121.570],
        [39.788, -121.565],
        [39.782, -121.560],
        [39.775, -121.565],
        [39.770, -121.575],
        [39.768, -121.585],
        [39.773, -121.595],
      ],
    ],
  },
  {
    incident_name: 'Concow Fire',
    gis_acres: 480,
    coordinates: [
      [
        [39.795, -121.530],
        [39.800, -121.520],
        [39.808, -121.515],
        [39.805, -121.508],
        [39.798, -121.510],
        [39.793, -121.518],
        [39.795, -121.530],
      ],
    ],
  },
]
