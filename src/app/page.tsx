'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import ProcessingView from '@/components/ProcessingView'
import DashboardView from '@/components/DashboardView'
import DemoControlPanel from '@/components/DemoControlPanel'
import { calculateSpreadCones } from '@/lib/fire-spread'
import { useDeviceHeading } from '@/lib/useDeviceHeading'
import { POLL_FIRES, POLL_WEATHER, shouldRefreshAI } from '@/lib/polling'
import {
  DEMO_LOCATION,
  DEMO_WEATHER,
  DEMO_BIOME,
  DEMO_ACTIVE_FIRES,
  DEMO_HISTORICAL_FIRES,
  DEMO_ALERTS,
  DEMO_LCES,
  DEMO_FIRE_DANGER,
  DEMO_INFRASTRUCTURE,
  DEMO_CALFIRE_INCIDENTS,
  DEMO_FIRE_PERIMETERS,
  buildDemoHourlyForecast,
} from '@/lib/demo-data'
import type {
  FullAnalysisResult,
  LocationData,
  WeatherData,
  BiomeInfo,
  ActiveFire,
  HistoricalFire,
  TacticalAlert,
  LCESOutput,
  FireDangerScore,
  HourlyForecast,
  InfrastructureData,
  SpreadCone,
  CalFireIncident,
  FirePerimeter,
} from '@/lib/types'

type AppPhase = 'locating' | 'processing' | 'dashboard' | 'error'

function useIsDemo(): boolean {
  const [isDemo, setIsDemo] = useState(false)
  useEffect(() => {
    setIsDemo(new URLSearchParams(window.location.search).has('demo'))
  }, [])
  return isDemo
}

export default function Home() {
  const isDemo = useIsDemo()
  const { heading: deviceHeading, permissionNeeded, requestPermission } = useDeviceHeading()
  const [phase, setPhase] = useState<AppPhase>('locating')
  const [location, setLocation] = useState<LocationData | null>(null)
  const [processingStep, setProcessingStep] = useState('Detecting location...')
  const [errorMsg, setErrorMsg] = useState('')
  const started = useRef(false)

  // Per-source data + freshness
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [biome, setBiome] = useState<BiomeInfo | null>(null)
  const [hourlyForecast, setHourlyForecast] = useState<HourlyForecast[]>([])
  const [activeFires, setActiveFires] = useState<ActiveFire[]>([])
  const [historicalFires, setHistoricalFires] = useState<HistoricalFire[]>([])
  const [alerts, setAlerts] = useState<TacticalAlert[]>([])
  const [lces, setLces] = useState<LCESOutput | undefined>()
  const [fireDanger, setFireDanger] = useState<FireDangerScore | undefined>()
  const [infrastructure, setInfrastructure] = useState<InfrastructureData | undefined>()
  const [spreadCones, setSpreadCones] = useState<SpreadCone[]>([])
  const [calFireIncidents, setCalFireIncidents] = useState<CalFireIncident[]>([])
  const [firePerimeters, setFirePerimeters] = useState<FirePerimeter[]>([])

  const [firesUpdatedAt, setFiresUpdatedAt] = useState(0)
  const [weatherUpdatedAt, setWeatherUpdatedAt] = useState(0)

  // Track previous AI inputs for diffing
  const prevAIInputs = useRef<{ weather: WeatherData; fires: ActiveFire[] } | null>(null)

  // ── Demo mode initialization ──

  useEffect(() => {
    if (!isDemo || started.current) return
    started.current = true

    const loc = DEMO_LOCATION
    setLocation(loc)
    setWeather(DEMO_WEATHER)
    setBiome(DEMO_BIOME)
    setActiveFires(DEMO_ACTIVE_FIRES)
    setHistoricalFires(DEMO_HISTORICAL_FIRES)
    setAlerts(DEMO_ALERTS)
    setLces(DEMO_LCES)
    setFireDanger(DEMO_FIRE_DANGER)
    setHourlyForecast(buildDemoHourlyForecast())

    const now = Date.now()
    setFiresUpdatedAt(now)
    setWeatherUpdatedAt(now)

    // Calculate initial spread cones
    const cones = calculateSpreadCones(
      DEMO_ACTIVE_FIRES,
      DEMO_WEATHER,
      DEMO_BIOME.fuel_model,
      loc.latitude,
      loc.longitude
    )
    setSpreadCones(cones)

    // Use static demo data (no network dependency)
    setInfrastructure(DEMO_INFRASTRUCTURE)
    setCalFireIncidents(DEMO_CALFIRE_INCIDENTS)
    setFirePerimeters(DEMO_FIRE_PERIMETERS)

    setPhase('dashboard')
  }, [isDemo])

  // ── Demo: recalculate spread cones when demo weather/fires change ──

  const handleDemoWeatherChange = useCallback((newWeather: WeatherData) => {
    setWeather(newWeather)
    setWeatherUpdatedAt(Date.now())
  }, [])

  const handleDemoFiresChange = useCallback((newFires: ActiveFire[]) => {
    setActiveFires(newFires)
    setFiresUpdatedAt(Date.now())
  }, [])

  // ── Fetch functions ──

  const fetchWeather = useCallback(async (loc: LocationData) => {
    try {
      const res = await fetch('/api/weather', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude: loc.latitude, longitude: loc.longitude }),
      })
      if (!res.ok) return
      const data = await res.json()
      setWeather(data.weather)
      setBiome(data.biome)
      setHourlyForecast(data.hourlyForecast || [])
      setWeatherUpdatedAt(Date.now())
    } catch (e) {
      console.error('[POLL] Weather error:', e)
    }
  }, [])

  const fetchFires = useCallback(async (loc: LocationData) => {
    try {
      const res = await fetch('/api/nearby-fires', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude: loc.latitude, longitude: loc.longitude }),
      })
      if (!res.ok) return
      const data = await res.json()
      setActiveFires(data.activeFires || [])
      setFiresUpdatedAt(Date.now())
    } catch (e) {
      console.error('[POLL] Fires error:', e)
    }
  }, [])

  const fetchFireDanger = useCallback(async (wx: WeatherData, bio: BiomeInfo, fires: ActiveFire[], hist: HistoricalFire[]) => {
    try {
      const res = await fetch('/api/fire-danger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weather: wx, biome: bio, activeFires: fires, historicalFires: hist }),
      })
      if (!res.ok) return
      const data = await res.json()
      setFireDanger(data.fireDanger)
    } catch (e) {
      console.error('[POLL] Fire danger error:', e)
    }
  }, [])

  const fetchAlerts = useCallback(async (wx: WeatherData, bio: BiomeInfo, fires: ActiveFire[], hist: HistoricalFire[], infra?: InfrastructureData) => {
    try {
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weather: wx,
          biome: bio,
          activeFires: fires,
          historicalFires: hist,
          structuresInPath: infra?.structuresInPath || 0,
          powerLinesInPath: infra?.powerLinesInPath || 0,
        }),
      })
      if (!res.ok) return
      const data = await res.json()
      if (data.alerts) setAlerts(data.alerts)
      if (data.lces) setLces(data.lces)
      prevAIInputs.current = { weather: wx, fires }
    } catch (e) {
      console.error('[POLL] Alerts error:', e)
    }
  }, [])

  // ── Initial load ──

  const initialLoad = useCallback(async (loc: LocationData) => {
    setPhase('processing')

    try {
      // Step 1: Weather + fires + historical + CAL FIRE + perimeters (parallel)
      setProcessingStep('Fetching weather & fire data...')
      const [wxRes, firesRes, histRes, calFireRes, perimRes] = await Promise.all([
        fetch('/api/weather', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ latitude: loc.latitude, longitude: loc.longitude }),
        }),
        fetch('/api/nearby-fires', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ latitude: loc.latitude, longitude: loc.longitude }),
        }),
        fetch('/api/historical-fires', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ latitude: loc.latitude, longitude: loc.longitude }),
        }),
        fetch('/api/calfire-incidents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ latitude: loc.latitude, longitude: loc.longitude }),
        }).catch(() => null),
        fetch('/api/fire-perimeters', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        }).catch(() => null),
      ])

      if (!wxRes.ok) {
        const err = await wxRes.json().catch(() => ({}))
        throw new Error(`Weather: ${err.details || err.error || wxRes.status}`)
      }

      const wxData = await wxRes.json()
      const firesData = firesRes.ok ? await firesRes.json() : { activeFires: [] }
      const histData = histRes.ok ? await histRes.json() : { historicalFires: [] }
      const calFireData = calFireRes?.ok ? await calFireRes.json() : { calFireIncidents: [] }
      const perimData = perimRes?.ok ? await perimRes.json() : { firePerimeters: [] }

      setWeather(wxData.weather)
      setBiome(wxData.biome)
      setHourlyForecast(wxData.hourlyForecast || [])
      setWeatherUpdatedAt(Date.now())
      setActiveFires(firesData.activeFires || [])
      setFiresUpdatedAt(Date.now())
      setHistoricalFires(histData.historicalFires || [])
      setCalFireIncidents(calFireData.calFireIncidents || [])
      setFirePerimeters(perimData.firePerimeters || [])

      // Calculate spread cones (client-side, instant)
      const cones = calculateSpreadCones(
        firesData.activeFires || [],
        wxData.weather,
        wxData.biome.fuel_model,
        loc.latitude,
        loc.longitude
      )
      setSpreadCones(cones)

      // Step 2: Fire danger + AI alerts + infrastructure (parallel)
      setProcessingStep('Analyzing situation...')
      const infraOffset = 0.1
      const [dangerRes, suggestRes, infraRes] = await Promise.all([
        fetch('/api/fire-danger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            weather: wxData.weather,
            biome: wxData.biome,
            activeFires: firesData.activeFires,
            historicalFires: histData.historicalFires,
          }),
        }),
        fetch('/api/suggest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            weather: wxData.weather,
            biome: wxData.biome,
            activeFires: firesData.activeFires,
            historicalFires: histData.historicalFires,
          }),
        }),
        fetch('/api/infrastructure', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            south: loc.latitude - infraOffset,
            west: loc.longitude - infraOffset,
            north: loc.latitude + infraOffset,
            east: loc.longitude + infraOffset,
          }),
        }).catch(() => null),
      ])

      if (dangerRes.ok) {
        const d = await dangerRes.json()
        setFireDanger(d.fireDanger)
      }

      if (suggestRes.ok) {
        const s = await suggestRes.json()
        if (s.alerts) setAlerts(s.alerts)
        if (s.lces) setLces(s.lces)
        prevAIInputs.current = { weather: wxData.weather, fires: firesData.activeFires || [] }
      }

      if (infraRes?.ok) {
        const infra = await infraRes.json()
        setInfrastructure(infra)
      }

      setPhase('dashboard')
    } catch (err) {
      console.error('Initial load error:', err)
      setErrorMsg((err as Error).message || 'Something went wrong')
      setPhase('error')
    }
  }, [])

  // ── GPS + initial load on mount (non-demo only) ──

  useEffect(() => {
    if (isDemo || started.current) return
    started.current = true

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc: LocationData = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          timestamp: new Date().toISOString(),
        }
        setLocation(loc)
        initialLoad(loc)
      },
      () => {
        setErrorMsg('Location access denied. GPS is required for Redhue.')
        setPhase('error')
      },
      { enableHighAccuracy: true, timeout: 15000 }
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemo])

  // ── Polling loops (only active in dashboard phase, disabled in demo) ──

  useEffect(() => {
    if (isDemo || phase !== 'dashboard' || !location) return

    const fireTimer = setInterval(() => fetchFires(location), POLL_FIRES)
    const wxTimer = setInterval(() => fetchWeather(location), POLL_WEATHER)

    return () => {
      clearInterval(fireTimer)
      clearInterval(wxTimer)
    }
  }, [isDemo, phase, location, fetchFires, fetchWeather])

  // ── Recompute spread + danger when weather/fires change ──

  useEffect(() => {
    if (!weather || !biome || phase !== 'dashboard') return

    // Recalculate spread cones
    const cones = calculateSpreadCones(activeFires, weather, biome.fuel_model, location?.latitude, location?.longitude)
    setSpreadCones(cones)

    if (isDemo) {
      // In demo mode, recalculate fire danger score locally based on conditions
      const wxScore = Math.min(30,
        (weather.wind_speed_mph > 35 ? 14 : weather.wind_speed_mph > 25 ? 12 : weather.wind_speed_mph > 15 ? 7 : 3) +
        (weather.relative_humidity < 10 ? 12 : weather.relative_humidity < 15 ? 10 : weather.relative_humidity < 25 ? 6 : 2) +
        (weather.temperature_f > 100 ? 8 : weather.temperature_f > 85 ? 6 : weather.temperature_f > 75 ? 4 : 2)
      )
      const fuelScore = 22
      const fireScore = Math.min(25, activeFires.reduce((sum, f) => sum + (f.frp > 100 ? 12 : f.frp > 50 ? 8 : 5), 0))
      const histScore = 12
      const total = Math.min(100, wxScore + fuelScore + fireScore + histScore)
      const rating = total > 80 ? 'Extreme' : total > 60 ? 'Very High' : total > 40 ? 'High' : total > 20 ? 'Moderate' : 'Low'
      const incidentType = total > 80 ? 'Type 1' : total > 60 ? 'Type 2' : total > 40 ? 'Type 3' : total > 20 ? 'Type 4' : 'Type 5'
      setFireDanger({
        score: total,
        rating: rating as FireDangerScore['rating'],
        incidentType: incidentType as FireDangerScore['incidentType'],
        factors: { weather: wxScore, fuel: fuelScore, activeFires: fireScore, historical: histScore },
        reasoning: `Demo mode: ${rating} danger based on current control settings.`,
      })
    } else {
      // Recalculate fire danger via API
      fetchFireDanger(weather, biome, activeFires, historicalFires)

      // Check if AI should refresh
      if (shouldRefreshAI(prevAIInputs.current, { weather, fires: activeFires })) {
        fetchAlerts(weather, biome, activeFires, historicalFires, infrastructure)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weather, activeFires])

  // ── Manual refresh ──

  const handleRefresh = useCallback(() => {
    if (!location) return
    if (isDemo) {
      // In demo mode, just bump the timestamps
      setFiresUpdatedAt(Date.now())
      setWeatherUpdatedAt(Date.now())
      return
    }
    fetchWeather(location)
    fetchFires(location)
  }, [isDemo, location, fetchWeather, fetchFires])

  // ── Assemble FullAnalysisResult for DashboardView ──

  const assembledData: FullAnalysisResult | null = weather && biome ? {
    weather,
    biome,
    activeFires,
    historicalFires,
    alerts,
    hourlyForecast,
    fireDanger,
    lces,
    infrastructure,
    spreadCones,
    calFireIncidents,
    firePerimeters,
  } : null

  // ── Render ──

  if (phase === 'locating' || phase === 'processing') {
    return <ProcessingView currentStep={processingStep} />
  }

  if (phase === 'error') {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="rounded-full bg-score-red/20 p-4">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-score-red">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <p className="text-lg font-medium">Analysis Failed</p>
        <p className="text-sm text-text-secondary">{errorMsg}</p>
        <button
          onClick={() => {
            setPhase('locating')
            started.current = false
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                const loc: LocationData = {
                  latitude: pos.coords.latitude,
                  longitude: pos.coords.longitude,
                  timestamp: new Date().toISOString(),
                }
                setLocation(loc)
                initialLoad(loc)
              },
              () => {
                setErrorMsg('Location access denied.')
                setPhase('error')
              },
              { enableHighAccuracy: true, timeout: 15000 }
            )
          }}
          className="mt-2 rounded-xl bg-accent px-6 py-3 font-semibold text-white"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (phase === 'dashboard' && assembledData && location) {
    return (
      <>
        <DashboardView
          data={assembledData}
          location={location}
          firesUpdatedAt={firesUpdatedAt}
          weatherUpdatedAt={weatherUpdatedAt}
          onRefresh={handleRefresh}
          deviceHeading={deviceHeading}
          compassPermissionNeeded={permissionNeeded}
          onRequestCompassPermission={requestPermission}
        />
        {isDemo && weather && (
          <DemoControlPanel
            weather={weather}
            activeFires={activeFires}
            userLat={location.latitude}
            userLon={location.longitude}
            onWeatherChange={handleDemoWeatherChange}
            onFiresChange={handleDemoFiresChange}
          />
        )}
      </>
    )
  }

  return null
}
