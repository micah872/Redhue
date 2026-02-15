export interface WeatherData {
  temperature_f: number
  apparent_temperature_f: number
  relative_humidity: number
  wind_speed_mph: number
  wind_gusts_mph: number
  wind_direction_deg: number
  precipitation_in: number
}

export interface BiomeInfo {
  vegetation_zone: string
  fuel_model: string
  fuel_description: string
}

export interface LocationData {
  latitude: number
  longitude: number
  timestamp: string
}

export interface HistoricalFire {
  incident_name: string
  year: number
  acres: number
  latitude: number
  longitude: number
  discovery_date: string
  containment_date?: string
  cause?: string
  fuel_model?: string
  fire_behavior?: string
  complexity?: string
  percent_contained?: number
  county?: string
  state?: string
  burn_severity?: string
  distance_km: number
}

export interface ActiveFire {
  latitude: number
  longitude: number
  brightness: number
  frp: number
  confidence: string
  satellite: string
  acq_date: string
  acq_time: string
  distance_km: number
}

export interface HourlyForecast {
  hour: number
  temperature_f: number
  relative_humidity: number
  wind_speed_mph: number
  wind_gusts_mph: number
  precipitation_in: number
  isDangerous: boolean
}

export interface FireDangerScore {
  score: number
  rating: 'Low' | 'Moderate' | 'High' | 'Very High' | 'Extreme'
  incidentType: 'Type 5' | 'Type 4' | 'Type 3' | 'Type 2' | 'Type 1'
  factors: { weather: number; fuel: number; activeFires: number; historical: number }
  reasoning: string
}

export interface LCESOutput {
  lookouts: string[]
  communications: string[]
  escapeRoutes: string[]
  safetyZones: string[]
  hazards: string[]
}

export interface TacticalAlert {
  priority: 'critical' | 'high' | 'medium'
  icon: 'wind' | 'fire' | 'evacuate' | 'structure' | 'power' | 'terrain'
  headline: string
  detail: string
  actionable: boolean
}

export interface SpreadCone {
  fireLatitude: number
  fireLongitude: number
  polygons: { timeMinutes: number; coordinates: [number, number][]; areaAcres: number; headLat: number; headLon: number }[]
  headingDeg: number
  rosChPerHr: number
}

export interface PowerLine {
  id: number
  voltage?: string
  coordinates: [number, number][]
  operator?: string
}

export interface Structure {
  id: number
  center: [number, number]
  type: string
}

export interface Road {
  id: number
  name?: string
  type: string
  coordinates: [number, number][]
}

export interface InfrastructureData {
  powerLines: PowerLine[]
  structures: Structure[]
  roads: Road[]
  structuresInPath: number
  powerLinesInPath: number
}

export interface CalFireIncident {
  incident_name: string
  latitude: number
  longitude: number
  acres: number
  containment: number
  start_date: string
  county: string
  admin_unit: string
  is_active: boolean
  distance_km: number
}

export interface FirePerimeter {
  incident_name: string
  gis_acres: number
  coordinates: [number, number][][] // array of polygon rings
  irwin_id?: string
}

export interface FullAnalysisResult {
  weather: WeatherData
  biome: BiomeInfo
  activeFires: ActiveFire[]
  historicalFires: HistoricalFire[]
  alerts: TacticalAlert[]
  hourlyForecast: HourlyForecast[]
  fireDanger?: FireDangerScore
  lces?: LCESOutput
  infrastructure?: InfrastructureData
  spreadCones: SpreadCone[]
  calFireIncidents?: CalFireIncident[]
  firePerimeters?: FirePerimeter[]
}
