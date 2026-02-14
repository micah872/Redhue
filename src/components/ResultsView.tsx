'use client'

import type { FullAnalysisResult, MatchedFire, TacticalSuggestion } from '@/lib/types'

interface ResultsViewProps {
  data: FullAnalysisResult
  image?: string
  onReset: () => void
}

const intensityColor = {
  low: 'text-score-green border-score-green bg-score-green/10',
  moderate: 'text-score-yellow border-score-yellow bg-score-yellow/10',
  high: 'text-score-red border-score-red bg-score-red/10',
  extreme: 'text-score-red border-score-red bg-score-red/20',
}

const priorityColor = {
  critical: 'bg-score-red text-white',
  high: 'bg-score-yellow text-black',
  medium: 'bg-border text-text-primary',
}

function windDirection(deg: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  return dirs[Math.round(deg / 45) % 8]
}

export default function ResultsView({ data, image, onReset }: ResultsViewProps) {
  const { weather, biome, fireAnalysis, matchedFires, suggestions } = data

  return (
    <div className="mx-auto min-h-dvh max-w-[520px] space-y-4 px-4 pt-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <svg width="32" height="32" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M32 2C28 6 20 14 18 20c-1 3 0 6 2 8l12-14 12 14c2-2 3-5 2-8C44 14 36 6 32 2z" fill="#C0392B" />
          <path d="M20 28c-2 2-4 5-5 9-1 5 0 10 3 14l10-11-8-12z" fill="#3D3D3D" />
          <path d="M44 28l-8 12 10 11c3-4 4-9 3-14-1-4-3-7-5-9z" fill="#3D3D3D" />
          <path d="M28 49l-10 2c3 5 8 9 14 11 6-2 11-6 14-11l-10-2-4 5-4-5z" fill="#4A4A4A" />
          <circle cx="32" cy="38" r="7" fill="#E67E22" />
        </svg>
        <h1 className="text-2xl font-bold">
          <span className="text-accent">Red</span>hue Analysis
        </h1>
      </div>

      {/* Photo */}
      {image && (
        <div className="overflow-hidden rounded-xl border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="Fire scene" className="w-full object-cover" />
        </div>
      )}

      {/* Fire Analysis Card */}
      <Card title="Fire Analysis">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-text-secondary">Intensity</span>
            <span className={`rounded-full border px-3 py-0.5 text-sm font-semibold ${intensityColor[fireAnalysis.intensity]}`}>
              {fireAnalysis.intensity.toUpperCase()}
            </span>
          </div>
          <InfoRow label="Est. Size" value={fireAnalysis.estimated_size} />
          <InfoRow label="Flame Length" value={fireAnalysis.flame_length} />
          <InfoRow label="Behavior" value={fireAnalysis.behavior} />
          <InfoRow label="Fuel Type" value={fireAnalysis.fuel_type_visible} />
          <InfoRow label="Smoke/Flames" value={fireAnalysis.color_description} />
        </div>
      </Card>

      {/* Weather Card */}
      <Card title="Weather Conditions">
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Temperature" value={`${weather.temperature_c}°C`} />
          <Stat label="Humidity" value={`${weather.relative_humidity}%`} />
          <Stat label="Wind" value={`${weather.wind_speed_kmh} km/h ${windDirection(weather.wind_direction_deg)}`} />
          <Stat label="Precipitation" value={`${weather.precipitation_mm} mm`} />
        </div>
      </Card>

      {/* Biome Card */}
      <Card title="Vegetation / Biome">
        <InfoRow label="Zone" value={biome.vegetation_zone} />
        <InfoRow label="Fuel Model" value={biome.fuel_model} />
      </Card>

      {/* Historical Fires */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Similar Historical Fires</h2>
        {matchedFires.length === 0 ? (
          <p className="text-text-secondary">No similar fires found in the database.</p>
        ) : (
          <div className="space-y-3">
            {matchedFires.map((fire, i) => (
              <FireCard key={i} fire={fire} />
            ))}
          </div>
        )}
      </div>

      {/* Tactical Suggestions */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Tactical Suggestions</h2>
        <div className="space-y-3">
          {suggestions.map((s, i) => (
            <SuggestionCard key={i} suggestion={s} index={i + 1} />
          ))}
        </div>
      </div>

      {/* New Scan Button */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-bg-primary/90 p-4 backdrop-blur">
        <button
          onClick={onReset}
          className="w-full rounded-xl bg-accent py-3.5 text-center font-semibold text-white active:bg-accent/80"
        >
          New Scan
        </button>
      </div>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-bg-secondary p-4">
      <h3 className="mb-3 text-base font-semibold">{title}</h3>
      {children}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-1">
      <span className="shrink-0 text-sm text-text-secondary">{label}</span>
      <span className="text-right text-sm">{value}</span>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-bg-tertiary p-3">
      <p className="text-xs text-text-secondary">{label}</p>
      <p className="mt-0.5 text-lg font-semibold">{value}</p>
    </div>
  )
}

function FireCard({ fire }: { fire: MatchedFire }) {
  return (
    <div className="rounded-xl border border-border bg-bg-secondary p-4">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="font-semibold">{fire.incident_name}</h4>
        <span className="rounded-full bg-accent/20 px-2.5 py-0.5 text-xs font-medium text-accent">
          {(fire.similarity * 100).toFixed(0)}% match
        </span>
      </div>
      <div className="mb-2 flex flex-wrap gap-1.5 text-xs">
        <Tag>{fire.year}</Tag>
        <Tag>{fire.final_size_acres.toLocaleString()} acres</Tag>
        <Tag>{fire.fuel}</Tag>
        <Tag>{fire.terrain}</Tag>
      </div>
      <div className="space-y-1 text-sm text-text-secondary">
        <p><span className="text-text-primary">Behavior:</span> {fire.behavior}</p>
        <p><span className="text-text-primary">Tactics:</span> {fire.tactics_used}</p>
        <p><span className="text-text-primary">Outcome:</span> {fire.outcome}</p>
      </div>
    </div>
  )
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md bg-bg-tertiary px-2 py-0.5 text-text-secondary">{children}</span>
  )
}

function SuggestionCard({ suggestion, index }: { suggestion: TacticalSuggestion; index: number }) {
  return (
    <div className="rounded-xl border border-border bg-bg-secondary p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
          {index}
        </span>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${priorityColor[suggestion.priority]}`}>
          {suggestion.priority.toUpperCase()}
        </span>
      </div>
      <p className="mb-2 font-medium">{suggestion.action}</p>
      <p className="mb-1 text-sm text-text-secondary">{suggestion.reasoning}</p>
      <p className="text-sm italic text-text-secondary/80">{suggestion.historical_basis}</p>
    </div>
  )
}
