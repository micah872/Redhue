export interface WeatherData {
  temperature_c: number
  relative_humidity: number
  wind_speed_kmh: number
  wind_direction_deg: number
  precipitation_mm: number
}

export interface BiomeInfo {
  vegetation_zone: string
  fuel_model: string
}

export interface FireAnalysis {
  estimated_size: string
  intensity: 'low' | 'moderate' | 'high' | 'extreme'
  flame_length: string
  color_description: string
  behavior: string
  fuel_type_visible: string
}

export interface CaptureData {
  imageBase64: string
  latitude: number
  longitude: number
  timestamp: string
}

export interface MatchedFire {
  id?: number
  incident_name: string
  year: number
  fuel: string
  wind_speed: string
  terrain: string
  behavior: string
  tactics_used: string
  outcome: string
  final_size_acres: number
  similarity: number
}

export interface TacticalSuggestion {
  priority: 'critical' | 'high' | 'medium'
  action: string
  reasoning: string
  historical_basis: string
}

export interface FullAnalysisResult {
  weather: WeatherData
  biome: BiomeInfo
  fireAnalysis: FireAnalysis
  matchedFires: MatchedFire[]
  suggestions: TacticalSuggestion[]
}
