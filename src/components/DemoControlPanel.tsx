'use client'

import { useState } from 'react'
import type { ActiveFire, WeatherData } from '@/lib/types'

interface DemoControlPanelProps {
  weather: WeatherData
  activeFires: ActiveFire[]
  userLat: number
  userLon: number
  onWeatherChange: (weather: WeatherData) => void
  onFiresChange: (fires: ActiveFire[]) => void
}

export default function DemoControlPanel({
  weather,
  activeFires,
  userLat,
  userLon,
  onWeatherChange,
  onFiresChange,
}: DemoControlPanelProps) {
  const [collapsed, setCollapsed] = useState(true)

  const updateWeather = (patch: Partial<WeatherData>) => {
    onWeatherChange({ ...weather, ...patch })
  }

  const addFire = () => {
    const angle = Math.random() * 2 * Math.PI
    const dist = 0.02 + Math.random() * 0.04 // 2-6 km
    const newFire: ActiveFire = {
      latitude: userLat + dist * Math.cos(angle),
      longitude: userLon + dist * Math.sin(angle),
      brightness: 300 + Math.random() * 100,
      frp: 30 + Math.random() * 120,
      confidence: Math.random() > 0.3 ? 'high' : 'nominal',
      satellite: Math.random() > 0.5 ? 'VIIRS' : 'GOES',
      acq_date: new Date().toISOString().split('T')[0],
      acq_time: new Date().toTimeString().slice(0, 5).replace(':', ''),
      distance_km: Math.round(dist * 111 * 10) / 10,
    }
    onFiresChange([...activeFires, newFire])
  }

  const removeFire = () => {
    if (activeFires.length > 0) {
      onFiresChange(activeFires.slice(0, -1))
    }
  }

  const windDirLabel = (deg: number) => {
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
    return dirs[Math.round(deg / 45) % 8]
  }

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="fixed top-14 left-3 z-[1100] rounded-lg bg-accent px-3 py-1.5 text-xs font-bold text-white shadow-lg"
      >
        DEMO
      </button>
    )
  }

  return (
    <div className="fixed top-14 left-3 z-[1100] w-64 rounded-xl bg-bg-primary/95 backdrop-blur-sm border border-border shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-xs font-bold text-accent">DEMO CONTROLS</span>
        <button onClick={() => setCollapsed(true)} className="text-text-secondary text-sm">✕</button>
      </div>

      <div className="p-3 space-y-3">
        {/* Wind Direction */}
        <div>
          <label className="text-[10px] font-semibold text-text-secondary block mb-1">
            WIND DIRECTION: {Math.round(weather.wind_direction_deg)}° ({windDirLabel(weather.wind_direction_deg)})
          </label>
          <input
            type="range"
            min={0}
            max={360}
            step={5}
            value={weather.wind_direction_deg}
            onChange={(e) => updateWeather({ wind_direction_deg: Number(e.target.value) })}
            className="w-full h-1.5 accent-accent"
          />
        </div>

        {/* Wind Speed */}
        <div>
          <label className="text-[10px] font-semibold text-text-secondary block mb-1">
            WIND SPEED: {weather.wind_speed_mph} mph
          </label>
          <input
            type="range"
            min={0}
            max={60}
            step={1}
            value={weather.wind_speed_mph}
            onChange={(e) => {
              const speed = Number(e.target.value)
              updateWeather({ wind_speed_mph: speed, wind_gusts_mph: Math.round(speed * 1.5) })
            }}
            className="w-full h-1.5 accent-accent"
          />
        </div>

        {/* Humidity */}
        <div>
          <label className="text-[10px] font-semibold text-text-secondary block mb-1">
            HUMIDITY: {weather.relative_humidity}%
          </label>
          <input
            type="range"
            min={3}
            max={80}
            step={1}
            value={weather.relative_humidity}
            onChange={(e) => updateWeather({ relative_humidity: Number(e.target.value) })}
            className="w-full h-1.5 accent-accent"
          />
        </div>

        {/* Temperature */}
        <div>
          <label className="text-[10px] font-semibold text-text-secondary block mb-1">
            TEMPERATURE: {weather.temperature_f}°F
          </label>
          <input
            type="range"
            min={40}
            max={115}
            step={1}
            value={weather.temperature_f}
            onChange={(e) => updateWeather({
              temperature_f: Number(e.target.value),
              apparent_temperature_f: Number(e.target.value) + 2,
            })}
            className="w-full h-1.5 accent-accent"
          />
        </div>

        {/* Fire Controls */}
        <div>
          <label className="text-[10px] font-semibold text-text-secondary block mb-1">
            ACTIVE FIRES: {activeFires.length}
          </label>
          <div className="flex gap-2">
            <button
              onClick={addFire}
              className="flex-1 rounded-lg bg-score-red/20 border border-score-red/40 px-2 py-1.5 text-xs font-semibold text-score-red"
            >
              + Add Fire
            </button>
            <button
              onClick={removeFire}
              disabled={activeFires.length === 0}
              className="flex-1 rounded-lg bg-bg-tertiary px-2 py-1.5 text-xs font-semibold text-text-secondary disabled:opacity-30"
            >
              - Remove
            </button>
          </div>
        </div>

        {/* Scenario Presets */}
        <div>
          <label className="text-[10px] font-semibold text-text-secondary block mb-1">SCENARIOS</label>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => {
                updateWeather({
                  wind_speed_mph: 8,
                  wind_gusts_mph: 12,
                  relative_humidity: 45,
                  temperature_f: 75,
                  apparent_temperature_f: 77,
                  wind_direction_deg: 180,
                })
                onFiresChange([])
              }}
              className="rounded-lg bg-score-green/10 border border-score-green/30 px-2 py-1.5 text-[10px] font-semibold text-score-green"
            >
              Calm Day
            </button>
            <button
              onClick={() => {
                updateWeather({
                  wind_speed_mph: 15,
                  wind_gusts_mph: 25,
                  relative_humidity: 22,
                  temperature_f: 88,
                  apparent_temperature_f: 90,
                  wind_direction_deg: 315,
                })
                onFiresChange(activeFires.length > 0 ? activeFires.slice(0, 1) : [])
              }}
              className="rounded-lg bg-score-yellow/10 border border-score-yellow/30 px-2 py-1.5 text-[10px] font-semibold text-score-yellow"
            >
              Moderate
            </button>
            <button
              onClick={() => {
                updateWeather({
                  wind_speed_mph: 35,
                  wind_gusts_mph: 55,
                  relative_humidity: 8,
                  temperature_f: 95,
                  apparent_temperature_f: 97,
                  wind_direction_deg: 45,
                })
                addFire()
                addFire()
              }}
              className="rounded-lg bg-score-red/10 border border-score-red/30 px-2 py-1.5 text-[10px] font-semibold text-score-red"
            >
              Red Flag
            </button>
            <button
              onClick={() => {
                updateWeather({
                  wind_speed_mph: 50,
                  wind_gusts_mph: 75,
                  relative_humidity: 5,
                  temperature_f: 102,
                  apparent_temperature_f: 105,
                  wind_direction_deg: 30,
                })
                const diablo: ActiveFire[] = [
                  {
                    latitude: userLat + 0.02,
                    longitude: userLon + 0.015,
                    brightness: 410,
                    frp: 220,
                    confidence: 'high',
                    satellite: 'VIIRS',
                    acq_date: new Date().toISOString().split('T')[0],
                    acq_time: '1430',
                    distance_km: 2.8,
                  },
                  {
                    latitude: userLat + 0.035,
                    longitude: userLon + 0.025,
                    brightness: 380,
                    frp: 165,
                    confidence: 'high',
                    satellite: 'GOES',
                    acq_date: new Date().toISOString().split('T')[0],
                    acq_time: '1445',
                    distance_km: 4.5,
                  },
                  {
                    latitude: userLat + 0.01,
                    longitude: userLon + 0.008,
                    brightness: 350,
                    frp: 95,
                    confidence: 'nominal',
                    satellite: 'VIIRS',
                    acq_date: new Date().toISOString().split('T')[0],
                    acq_time: '1500',
                    distance_km: 1.4,
                  },
                ]
                onFiresChange(diablo)
              }}
              className="rounded-lg bg-score-red/10 border border-score-red/40 px-2 py-1.5 text-[10px] font-bold text-score-red"
            >
              Diablo Event
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
