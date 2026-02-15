'use client'

import StatusBar from './StatusBar'
import BottomDrawer from './BottomDrawer'
import MapView from './MapView'
import type {
  FullAnalysisResult,
  LocationData,
  TacticalAlert,
  HourlyForecast,
  LCESOutput,
  FireDangerScore,
  InfrastructureData,
  SpreadCone,
} from '@/lib/types'

interface DashboardViewProps {
  data: FullAnalysisResult
  location: LocationData
  firesUpdatedAt: number
  weatherUpdatedAt: number
  onRefresh: () => void
  deviceHeading?: number | null
  compassPermissionNeeded?: boolean
  onRequestCompassPermission?: () => Promise<void>
}

function windDirection(deg: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  return dirs[Math.round(deg / 45) % 8]
}

export default function DashboardView({
  data,
  location,
  firesUpdatedAt,
  weatherUpdatedAt,
  onRefresh,
  deviceHeading,
  compassPermissionNeeded,
  onRequestCompassPermission,
}: DashboardViewProps) {
  const { weather, alerts = [], lces, fireDanger, hourlyForecast = [], infrastructure, spreadCones = [], calFireIncidents = [], firePerimeters = [] } = data
  const criticalCount = alerts.filter((a) => a.priority === 'critical').length

  return (
    <div className="relative h-dvh w-full overflow-hidden">
      {/* Status bar */}
      <StatusBar
        firesUpdatedAt={firesUpdatedAt}
        weatherUpdatedAt={weatherUpdatedAt}
        criticalAlertCount={criticalCount}
        onRefresh={onRefresh}
      />

      {/* Full-screen map */}
      <div className="absolute inset-0">
        <MapView
          userLat={location.latitude}
          userLon={location.longitude}
          activeFires={data.activeFires}
          historicalFires={data.historicalFires}
          windDirectionDeg={weather.wind_direction_deg}
          windSpeedMph={weather.wind_speed_mph}
          spreadCones={spreadCones}
          infrastructure={infrastructure}
          calFireIncidents={calFireIncidents}
          firePerimeters={firePerimeters}
          fullScreen
          deviceHeading={deviceHeading}
          compassPermissionNeeded={compassPermissionNeeded}
          onRequestCompassPermission={onRequestCompassPermission}
        />
      </div>

      {/* Floating fire danger badge */}
      {fireDanger && <DangerBadge danger={fireDanger} />}

      {/* Bottom drawer */}
      <BottomDrawer
        alertCount={alerts.length}
        alertsContent={<AlertsTab alerts={alerts} />}
        weatherContent={<WeatherTab weather={weather} forecast={hourlyForecast} />}
        lcesContent={<LCESTab lces={lces} />}
        intelContent={
          <IntelTab
            infrastructure={infrastructure}
            biome={data.biome}
            historicalFires={data.historicalFires}
            spreadCones={spreadCones}
          />
        }
      />
    </div>
  )
}

/* ── Floating Danger Badge ── */

function DangerBadge({ danger }: { danger: FireDangerScore }) {
  const ratingColor: Record<string, string> = {
    Low: 'border-score-green text-score-green',
    Moderate: 'border-score-yellow text-score-yellow',
    High: 'border-score-yellow text-score-yellow',
    'Very High': 'border-score-red text-score-red',
    Extreme: 'border-score-red text-score-red',
  }
  const color = ratingColor[danger.rating] || 'border-border text-text-primary'

  return (
    <div className="absolute left-3 bottom-[calc(48px+1rem)] z-[999] rounded-xl bg-bg-primary/90 backdrop-blur-sm border border-border/50 p-2.5 shadow-lg">
      <div className="flex items-center gap-2.5">
        <div className={`flex h-11 w-11 items-center justify-center rounded-full border-2 ${color}`}>
          <span className="text-sm font-bold">{danger.score}</span>
        </div>
        <div>
          <p className={`text-xs font-bold ${color.split(' ')[1]}`}>{danger.rating}</p>
          <p className="text-[10px] text-accent font-medium">{danger.incidentType}</p>
        </div>
      </div>
    </div>
  )
}

/* ── Alerts Tab ── */

const ALERT_ICONS: Record<string, string> = {
  wind: 'M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2',
  fire: 'M12 2c-4 4-8 8-8 13a8 8 0 0 0 16 0c0-5-4-9-8-13z',
  evacuate: 'M5 12h14M12 5l7 7-7 7',
  structure: 'M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11',
  power: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  terrain: 'M22 20L16 8l-4 6-4-4-6 10',
}

const PRIORITY_STYLE: Record<string, string> = {
  critical: 'border-l-score-red bg-score-red/5',
  high: 'border-l-score-yellow bg-score-yellow/5',
  medium: 'border-l-border bg-bg-secondary',
}

function AlertsTab({ alerts }: { alerts: TacticalAlert[] }) {
  if (alerts.length === 0) {
    return <p className="text-xs text-text-secondary py-4 text-center">No alerts generated yet</p>
  }

  return (
    <div className="space-y-1.5">
      {alerts.map((alert, i) => (
        <div key={i} className={`rounded-lg border-l-[3px] px-3 py-2 ${PRIORITY_STYLE[alert.priority] || PRIORITY_STYLE.medium}`}>
          <div className="flex items-start gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-text-secondary">
              <path d={ALERT_ICONS[alert.icon] || ALERT_ICONS.fire} />
            </svg>
            <div className="min-w-0">
              <p className="text-xs font-semibold leading-tight">{alert.headline}</p>
              <p className="text-[10px] text-text-secondary leading-snug mt-0.5">{alert.detail}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── Weather Tab ── */

function WeatherTab({ weather, forecast }: { weather: FullAnalysisResult['weather']; forecast: HourlyForecast[] }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-1.5">
        <MiniStat label="Temperature" value={`${weather.temperature_f}°F`} />
        <MiniStat label="Relative Humidity" value={`${weather.relative_humidity}%`} danger={weather.relative_humidity < 20} />
        <MiniStat label="Wind" value={`${weather.wind_speed_mph} mph ${windDirection(weather.wind_direction_deg)}`} danger={weather.wind_speed_mph > 25} />
        <MiniStat label="Wind Gusts" value={`${weather.wind_gusts_mph} mph`} danger={weather.wind_gusts_mph > 35} />
        <MiniStat label="Feels Like" value={`${weather.apparent_temperature_f}°F`} />
        <MiniStat label="Precipitation" value={`${weather.precipitation_in} in`} />
      </div>

      {forecast.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-text-secondary mb-1.5">24-HOUR FORECAST</p>
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
            {forecast.map((h, i) => {
              const hourStr = `${h.hour.toString().padStart(2, '0')}00`
              return (
                <div
                  key={i}
                  className={`shrink-0 rounded-lg p-1.5 text-center ${
                    h.isDangerous ? 'border border-score-red/50 bg-score-red/10' : 'bg-bg-tertiary'
                  }`}
                  style={{ minWidth: '56px' }}
                >
                  <p className="text-[10px] font-semibold">{hourStr}</p>
                  <p className="text-xs font-medium mt-0.5">{h.temperature_f}°F</p>
                  <p className="text-[9px] text-text-secondary">{h.relative_humidity}% RH</p>
                  <p className="text-[9px] text-text-secondary">{h.wind_speed_mph} mph</p>
                </div>
              )
            })}
          </div>
          <p className="mt-1.5 text-[9px] text-text-secondary">
            % = Relative Humidity (moisture in air). Below 20% = critical fire weather.
          </p>
        </div>
      )}
    </div>
  )
}

function MiniStat({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className={`rounded-lg p-2 ${danger ? 'bg-score-red/10 border border-score-red/30' : 'bg-bg-tertiary'}`}>
      <p className="text-[9px] text-text-secondary">{label}</p>
      <p className={`text-xs font-semibold ${danger ? 'text-score-red' : ''}`}>{value}</p>
    </div>
  )
}

/* ── LCES Tab ── */

function LCESTab({ lces }: { lces?: LCESOutput }) {
  if (!lces) return <p className="text-xs text-text-secondary py-4 text-center">LCES not yet generated</p>

  return (
    <div className="space-y-2.5">
      <LCESSection label="LOOKOUTS" items={lces.lookouts} />
      <LCESSection label="COMMS" items={lces.communications} />
      <LCESSection label="ESCAPE ROUTES" items={lces.escapeRoutes} />
      <LCESSection label="SAFETY ZONES" items={lces.safetyZones} />
      {lces.hazards.length > 0 && (
        <div className="rounded-lg border border-score-red/30 bg-score-red/10 p-2">
          <p className="text-[10px] font-bold text-score-red">HAZARDS</p>
          <ul className="mt-0.5 space-y-0.5">
            {lces.hazards.map((h, i) => (
              <li key={i} className="text-[10px] text-text-secondary">• {h}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function LCESSection({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-text-secondary">{label}</p>
      <ul className="mt-0.5 space-y-0.5">
        {items.map((item, i) => (
          <li key={i} className="text-[10px] text-text-primary">• {item}</li>
        ))}
      </ul>
    </div>
  )
}

/* ── Intel Tab ── */

function IntelTab({
  infrastructure,
  biome,
  historicalFires,
  spreadCones,
}: {
  infrastructure?: InfrastructureData
  biome: FullAnalysisResult['biome']
  historicalFires: FullAnalysisResult['historicalFires']
  spreadCones: SpreadCone[]
}) {
  return (
    <div className="space-y-3">
      {/* Infrastructure threats */}
      {infrastructure && (infrastructure.structuresInPath > 0 || infrastructure.powerLinesInPath > 0) && (
        <div className="rounded-lg border border-score-red/30 bg-score-red/5 p-2.5">
          <p className="text-[10px] font-bold text-score-red">INFRASTRUCTURE IN FIRE PATH</p>
          <div className="mt-1 space-y-0.5">
            {infrastructure.structuresInPath > 0 && (
              <p className="text-xs">{infrastructure.structuresInPath} structures</p>
            )}
            {infrastructure.powerLinesInPath > 0 && (
              <p className="text-xs">{infrastructure.powerLinesInPath} power line segments</p>
            )}
          </div>
        </div>
      )}

      {/* Infrastructure summary */}
      {infrastructure && (
        <div>
          <p className="text-[10px] font-bold text-text-secondary">INFRASTRUCTURE NEARBY</p>
          <div className="mt-1 grid grid-cols-3 gap-1.5">
            <MiniStat label="Power Lines" value={`${infrastructure.powerLines.length}`} />
            <MiniStat label="Structures" value={`${infrastructure.structures.length}`} />
            <MiniStat label="Roads" value={`${infrastructure.roads.length}`} />
          </div>
        </div>
      )}

      {/* Spread summary */}
      {spreadCones.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-text-secondary">SPREAD PROJECTION</p>
          <div className="mt-1 space-y-0.5">
            {spreadCones[0].polygons.map((p) => (
              <div key={p.timeMinutes} className="flex justify-between text-[10px]">
                <span className="text-text-secondary">{p.timeMinutes} min</span>
                <span>~{p.areaAcres.toLocaleString()} acres</span>
              </div>
            ))}
            <p className="text-[10px] text-text-secondary mt-1">
              Spread direction: {Math.round(spreadCones[0].headingDeg)}°
            </p>
          </div>
        </div>
      )}

      {/* Terrain & Fuel */}
      <div>
        <p className="text-[10px] font-bold text-text-secondary">TERRAIN & FUEL</p>
        <div className="mt-1 space-y-0.5">
          <div className="flex justify-between text-[10px]">
            <span className="text-text-secondary">Terrain</span>
            <span>{biome.vegetation_zone}</span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-text-secondary">Fuel</span>
            <span>{biome.fuel_model}</span>
          </div>
          <p className="text-[9px] text-text-secondary mt-0.5">{biome.fuel_description}</p>
        </div>
      </div>

      {/* Historical fires */}
      {historicalFires.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-text-secondary">HISTORICAL FIRES</p>
          <div className="mt-1 space-y-1">
            {historicalFires.slice(0, 5).map((f, i) => (
              <div key={i} className="flex justify-between text-[10px]">
                <span className="truncate mr-2">{f.incident_name} ({f.year})</span>
                <span className="shrink-0 text-text-secondary">{f.acres.toLocaleString()} ac • {f.distance_km}km</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
