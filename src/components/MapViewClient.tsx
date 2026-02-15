'use client'

import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, CircleMarker, Circle, Marker, Popup, Polyline, Polygon, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { MapViewProps } from './MapView'

function getFrpColor(frp: number): string {
  if (frp > 100) return '#EF4444'
  if (frp > 20) return '#FF6B35'
  return '#EAB308'
}

function fireIcon(frp: number): L.DivIcon {
  const size = frp > 100 ? 32 : frp > 20 ? 26 : 20
  const glow = getFrpColor(frp)
  return L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div style="
      width:${size}px;height:${size}px;
      display:flex;align-items:center;justify-content:center;
      font-size:${size - 4}px;
      filter:drop-shadow(0 0 6px ${glow}) drop-shadow(0 0 12px ${glow});
      animation:fire-pulse 1.5s ease-in-out infinite;
    ">🔥</div>`,
  })
}

function timeLabel(minutes: number): L.DivIcon {
  const colors: Record<number, string> = {
    30: '#EF4444',
    60: '#FF6B35',
    120: '#EAB308',
  }
  const color = colors[minutes] || '#FF6B35'
  return L.divIcon({
    className: '',
    iconSize: [36, 16],
    iconAnchor: [18, 8],
    html: `<div style="
      background:${color};
      color:#fff;
      font-size:9px;
      font-weight:700;
      padding:1px 4px;
      border-radius:4px;
      white-space:nowrap;
      text-align:center;
      line-height:14px;
      box-shadow:0 1px 4px rgba(0,0,0,0.5);
    ">${minutes}min</div>`,
  })
}

const SPREAD_STYLE: Record<number, { fill: string; stroke: string; fillOpacity: number }> = {
  30:  { fill: '#EF4444', stroke: '#EF4444', fillOpacity: 0.3 },
  60:  { fill: '#FF6B35', stroke: '#FF6B35', fillOpacity: 0.18 },
  120: { fill: '#EAB308', stroke: '#EAB308', fillOpacity: 0.1 },
}

function compassLabel(deg: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  return dirs[Math.round(deg / 45) % 8]
}

function AutoBounds({ userLat, userLon, activeFires, historicalFires }: MapViewProps) {
  const map = useMap()

  useEffect(() => {
    const bounds = L.latLngBounds([[userLat, userLon]])
    activeFires.forEach((f) => bounds.extend([f.latitude, f.longitude]))
    historicalFires.slice(0, 5).forEach((f) => bounds.extend([f.latitude, f.longitude]))

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 })
    }
  }, [map, userLat, userLon, activeFires, historicalFires])

  return null
}

export default function MapViewClient(props: MapViewProps) {
  const {
    userLat, userLon, activeFires, historicalFires,
    windDirectionDeg, windSpeedMph,
    spreadCones = [], infrastructure, fullScreen = false,
    calFireIncidents = [], firePerimeters = [],
    deviceHeading, compassPermissionNeeded, onRequestCompassPermission,
  } = props

  const mapStyle = fullScreen
    ? { height: '100%', width: '100%' }
    : { height: '300px', width: '100%' }

  return (
    <div className={fullScreen ? 'h-full w-full' : 'overflow-hidden rounded-xl border border-border'}>
      <MapContainer
        center={[userLat, userLon]}
        zoom={10}
        style={mapStyle}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />

        <AutoBounds {...props} />

        {/* Spread cones */}
        {spreadCones.flatMap((cone) => {
          const outerHead = cone.polygons[cone.polygons.length - 1]
          return [
            <Polyline
              key={`cl-${cone.fireLatitude}-${cone.fireLongitude}`}
              positions={[
                [cone.fireLatitude, cone.fireLongitude],
                [outerHead.headLat, outerHead.headLon],
              ]}
              pathOptions={{
                color: '#ffffff',
                weight: 1.5,
                opacity: 0.5,
                dashArray: '6,6',
              }}
            />,

            ...[...cone.polygons].reverse().map((poly) => {
              const style = SPREAD_STYLE[poly.timeMinutes] || { fill: '#FF6B35', stroke: '#FF6B35', fillOpacity: 0.15 }
              return (
                <Polygon
                  key={`spread-${cone.fireLatitude}-${cone.fireLongitude}-${poly.timeMinutes}`}
                  positions={poly.coordinates}
                  pathOptions={{
                    color: style.stroke,
                    fillColor: style.fill,
                    fillOpacity: style.fillOpacity,
                    weight: 1.5,
                    opacity: 0.7,
                  }}
                >
                  <Popup>
                    <div style={{ color: '#000', fontSize: '11px', lineHeight: '1.4' }}>
                      <strong>Projected Spread — {poly.timeMinutes} min</strong><br />
                      ~{poly.areaAcres.toLocaleString()} acres
                    </div>
                  </Popup>
                </Polygon>
              )
            }),

            ...cone.polygons.map((poly) => (
              <Marker
                key={`tl-${cone.fireLatitude}-${cone.fireLongitude}-${poly.timeMinutes}`}
                position={[poly.headLat, poly.headLon]}
                icon={timeLabel(poly.timeMinutes)}
                interactive={false}
              />
            )),
          ]
        })}

        {/* NIFC fire perimeters */}
        {firePerimeters.map((perim, i) =>
          perim.coordinates.map((ring, j) => (
            <Polygon
              key={`fp-${i}-${j}`}
              positions={ring}
              pathOptions={{
                color: '#EF4444',
                fillColor: '#EF4444',
                fillOpacity: 0.15,
                weight: 2,
                opacity: 0.8,
              }}
            >
              <Popup>
                <div style={{ color: '#000', fontSize: '11px', lineHeight: '1.4' }}>
                  <strong>{perim.incident_name}</strong><br />
                  {perim.gis_acres.toLocaleString()} acres
                </div>
              </Popup>
            </Polygon>
          ))
        )}

        {/* Infrastructure — power lines */}
        {infrastructure?.powerLines.map((line) => (
          <Polyline
            key={`pl-${line.id}`}
            positions={line.coordinates}
            pathOptions={{
              color: '#F59E0B',
              weight: line.voltage && parseInt(line.voltage) > 100000 ? 3 : 2,
              opacity: 0.7,
              dashArray: '6,4',
            }}
          >
            <Popup>
              <div style={{ color: '#000', fontSize: '11px', lineHeight: '1.4' }}>
                <strong>Power Line</strong><br />
                {line.voltage ? `${(parseInt(line.voltage) / 1000).toFixed(0)} kV` : 'Voltage unknown'}<br />
                {line.operator && <>Operator: {line.operator}</>}
              </div>
            </Popup>
          </Polyline>
        ))}

        {/* Infrastructure — roads */}
        {infrastructure?.roads.map((road) => (
          <Polyline
            key={`rd-${road.id}`}
            positions={road.coordinates}
            pathOptions={{
              color: '#9CA3AF',
              weight: road.type === 'motorway' || road.type === 'trunk' ? 2 : 1,
              opacity: 0.4,
            }}
          >
            {road.name && (
              <Popup>
                <div style={{ color: '#000', fontSize: '11px' }}>
                  <strong>{road.name}</strong>
                </div>
              </Popup>
            )}
          </Polyline>
        ))}

        {/* Infrastructure — structures */}
        {infrastructure?.structures.slice(0, 100).map((s) => (
          <CircleMarker
            key={`st-${s.id}`}
            center={s.center}
            radius={3}
            pathOptions={{ color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.6, weight: 0 }}
          >
            <Popup>
              <div style={{ color: '#000', fontSize: '11px', lineHeight: '1.4' }}>
                <strong>Structure</strong><br />
                Type: {s.type === 'unknown' ? 'Building' : s.type.charAt(0).toUpperCase() + s.type.slice(1)}
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {/* User location */}
        <CircleMarker
          center={[userLat, userLon]}
          radius={8}
          pathOptions={{ color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.9, weight: 2 }}
        >
          <Popup>
            <span style={{ color: '#000', fontSize: '12px', fontWeight: 600 }}>Your Location</span>
          </Popup>
        </CircleMarker>

        {/* Active fires */}
        {activeFires.map((fire, i) => (
          <Marker
            key={`a-${i}`}
            position={[fire.latitude, fire.longitude]}
            icon={fireIcon(fire.frp)}
          >
            <Popup>
              <div style={{ color: '#000', fontSize: '11px', lineHeight: '1.4' }}>
                <strong>Fire Detection</strong><br />
                {fire.distance_km} km away<br />
                Intensity: {fire.frp > 100 ? 'Very High' : fire.frp > 50 ? 'High' : fire.frp > 10 ? 'Moderate' : 'Low'}<br />
                Source: {fire.satellite}<br />
                Detected: {fire.acq_date}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* CAL FIRE incidents */}
        {calFireIncidents.map((inc, i) => (
          <CircleMarker
            key={`cf-${i}`}
            center={[inc.latitude, inc.longitude]}
            radius={Math.max(6, Math.min(14, Math.sqrt(inc.acres / 100) * 3))}
            pathOptions={{
              color: inc.is_active ? '#EF4444' : '#F59E0B',
              fillColor: inc.is_active ? '#EF4444' : '#F59E0B',
              fillOpacity: inc.is_active ? 0.7 : 0.4,
              weight: inc.is_active ? 2 : 1,
            }}
          >
            <Popup>
              <div style={{ color: '#000', fontSize: '11px', lineHeight: '1.4' }}>
                <strong>{inc.incident_name}</strong><br />
                {inc.acres.toLocaleString()} acres — {inc.containment}% contained<br />
                {inc.county} County<br />
                Started: {inc.start_date}<br />
                {inc.distance_km} km away
                {inc.is_active && <><br /><span style={{ color: '#EF4444', fontWeight: 700 }}>ACTIVE</span></>}
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {/* Historical fires */}
        {historicalFires.slice(0, 8).map((fire, i) => (
          <Circle
            key={`h-${i}`}
            center={[fire.latitude, fire.longitude]}
            radius={Math.max(500, Math.sqrt(fire.acres) * 8)}
            pathOptions={{
              color: '#666',
              fillColor: '#666',
              fillOpacity: 0.08,
              weight: 1,
              dashArray: '5,5',
            }}
          >
            <Popup>
              <div style={{ color: '#000', fontSize: '11px', lineHeight: '1.4' }}>
                <strong>{fire.incident_name}</strong><br />
                {fire.year} — {fire.acres.toLocaleString()} acres<br />
                {fire.distance_km} km away<br />
                {fire.cause && <>Cause: {fire.cause}<br /></>}
              </div>
            </Popup>
          </Circle>
        ))}

        {/* Wind compass + Map legend */}
        {fullScreen && (
          <>
            <WindCompass
              directionDeg={windDirectionDeg}
              speedMph={windSpeedMph}
              deviceHeading={deviceHeading}
              compassPermissionNeeded={compassPermissionNeeded}
              onRequestCompassPermission={onRequestCompassPermission}
            />
            <MapLegend />
          </>
        )}
      </MapContainer>
    </div>
  )
}

/* ── Wind Compass ── */
// Floating SVG compass on the map showing wind direction + speed.
// The arrow points in the direction fire travels (downwind).

function WindCompass({
  directionDeg,
  speedMph,
  deviceHeading,
  compassPermissionNeeded,
  onRequestCompassPermission,
}: {
  directionDeg: number
  speedMph: number
  deviceHeading?: number | null
  compassPermissionNeeded?: boolean
  onRequestCompassPermission?: () => Promise<void>
}) {
  const map = useMap()
  const controlRef = useRef<L.Control | null>(null)
  const ringRef = useRef<HTMLDivElement | null>(null)
  const arrowRef = useRef<SVGSVGElement | null>(null)
  const speedLabelRef = useRef<HTMLSpanElement | null>(null)
  const dirLabelRef = useRef<HTMLSpanElement | null>(null)
  const indicatorRef = useRef<HTMLSpanElement | null>(null)
  const currentAngleRef = useRef<number>(0) // cumulative angle (not clamped to 0-360)

  // Create the Leaflet control ONCE
  useEffect(() => {
    const control = new L.Control({ position: 'topright' })
    control.onAdd = () => {
      const container = L.DomUtil.create('div', 'wind-compass')
      container.style.marginTop = '56px'
      L.DomEvent.disableClickPropagation(container)
      L.DomEvent.disableScrollPropagation(container)

      container.innerHTML = `
        <div style="
          background:rgba(10,10,10,0.9);
          border:1px solid #333;
          border-radius:50%;
          width:72px;
          height:72px;
          position:relative;
          display:flex;
          align-items:center;
          justify-content:center;
          box-shadow:0 2px 8px rgba(0,0,0,0.5);
        ">
          <span data-ref="indicator" style="position:absolute;top:2px;right:2px;width:6px;height:6px;border-radius:50%;background:#22C55E;box-shadow:0 0 4px #22C55E;z-index:1;display:none"></span>

          <!-- NESW labels: fixed, never rotate -->
          <span style="position:absolute;top:4px;left:50%;transform:translateX(-50%);font-size:8px;font-weight:700;color:#fff;z-index:1">N</span>
          <span style="position:absolute;bottom:4px;left:50%;transform:translateX(-50%);font-size:8px;font-weight:600;color:#fff;z-index:1">S</span>
          <span style="position:absolute;left:5px;top:50%;transform:translateY(-50%);font-size:8px;font-weight:600;color:#fff;z-index:1">W</span>
          <span style="position:absolute;right:5px;top:50%;transform:translateY(-50%);font-size:8px;font-weight:600;color:#fff;z-index:1">E</span>

          <!-- Arrow container: rotates based on device heading + wind direction -->
          <div data-ref="ring" style="
            position:absolute;
            inset:0;
            transform:rotate(0deg);
            transition:transform 0.2s ease-out;
          ">
            <svg data-ref="arrow" width="40" height="40" viewBox="0 0 40 40" style="
              position:absolute;
              left:16px;
              top:16px;
            ">
              <line x1="20" y1="32" x2="20" y2="8" stroke="#EF4444" stroke-width="2.5" stroke-linecap="round"/>
              <polygon points="20,4 14,14 20,10 26,14" fill="#EF4444"/>
              <line x1="16" y1="32" x2="24" y2="32" stroke="#EF4444" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>

          <div style="
            position:absolute;
            bottom:-28px;
            left:50%;
            transform:translateX(-50%);
            background:rgba(10,10,10,0.9);
            border:1px solid #333;
            border-radius:6px;
            padding:2px 6px;
            white-space:nowrap;
            text-align:center;
          ">
            <span data-ref="speed" style="font-size:11px;font-weight:700;color:#A0A0A0"></span>
            <span style="font-size:8px;color:#666"> mph </span>
            <span data-ref="dir" style="font-size:10px;font-weight:600;color:#A0A0A0"></span>
          </div>
        </div>
      `

      // Cache DOM refs for fast updates
      ringRef.current = container.querySelector('[data-ref="ring"]')
      arrowRef.current = container.querySelector('[data-ref="arrow"]')
      speedLabelRef.current = container.querySelector('[data-ref="speed"]')
      dirLabelRef.current = container.querySelector('[data-ref="dir"]')
      indicatorRef.current = container.querySelector('[data-ref="indicator"]')

      return container
    }
    control.addTo(map)
    controlRef.current = control
    return () => { control.remove() }
  }, [map])

  // Lightweight DOM-only updates when heading/wind changes — no control recreation
  useEffect(() => {
    const ring = ringRef.current
    const arrow = arrowRef.current
    const speedEl = speedLabelRef.current
    const dirEl = dirLabelRef.current
    const indicator = indicatorRef.current
    if (!ring || !arrow || !speedEl || !dirEl || !indicator) return

    const hasHeading = deviceHeading != null && !isNaN(deviceHeading)

    // Target angle (0-360 range)
    const targetDeg = hasHeading ? directionDeg - deviceHeading : directionDeg

    // Shortest-path delta: always rotate ≤180° to avoid spinning the long way around 0°/360°
    let delta = targetDeg - ((currentAngleRef.current % 360) + 360) % 360
    if (delta > 180) delta -= 360
    if (delta < -180) delta += 360
    currentAngleRef.current += delta

    ring.style.transform = `rotate(${currentAngleRef.current}deg)`

    // Arrow is always red
    const arrowColor = '#EF4444'
    arrow.querySelectorAll('line').forEach((l) => l.setAttribute('stroke', arrowColor))
    arrow.querySelector('polygon')?.setAttribute('fill', arrowColor)

    // Update speed label
    const speedColor = speedMph > 35 ? '#EF4444' : speedMph > 25 ? '#FF6B35' : '#A0A0A0'
    speedEl.textContent = String(speedMph)
    speedEl.style.color = speedColor

    // Update direction label
    dirEl.textContent = compassLabel(directionDeg)

    // Show/hide orientation indicator
    indicator.style.display = hasHeading ? 'block' : 'none'
  }, [deviceHeading, directionDeg, speedMph])

  // iOS permission: attach handler once when needed
  useEffect(() => {
    if (!compassPermissionNeeded || !onRequestCompassPermission) return
    const container = controlRef.current?.getContainer?.()
    if (!container) return

    // Add permission overlay if not already present
    let btn = container.querySelector('.compass-perm-btn') as HTMLElement | null
    if (!btn) {
      btn = document.createElement('div')
      btn.className = 'compass-perm-btn'
      Object.assign(btn.style, {
        position: 'absolute', inset: '0', borderRadius: '50%',
        background: 'rgba(10,10,10,0.85)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: '2',
      })
      btn.innerHTML = `<div style="text-align:center;line-height:1.2">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2" style="margin:0 auto 2px">
          <circle cx="12" cy="12" r="10"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>
        </svg>
        <div style="font-size:7px;color:#3B82F6;font-weight:600">Enable</div>
      </div>`
      container.querySelector('div')?.appendChild(btn)
    }
    const handler = () => { onRequestCompassPermission(); btn?.remove() }
    btn.addEventListener('click', handler)
    return () => btn?.removeEventListener('click', handler)
  }, [compassPermissionNeeded, onRequestCompassPermission])

  return null
}

/* ── Map Legend ── */

function MapLegend() {
  const map = useMap()

  useEffect(() => {
    const legend = new L.Control({ position: 'bottomright' })
    legend.onAdd = () => {
      const div = L.DomUtil.create('div', 'map-legend')
      div.style.marginBottom = '60px'
      div.innerHTML = `
        <div style="background:rgba(10,10,10,0.85);padding:8px 10px;border-radius:8px;font-size:10px;color:#A0A0A0;line-height:1.8;border:1px solid #333">
          <div><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#3B82F6;margin-right:4px"></span>You</div>
          <div><span style="margin-right:4px">🔥</span>Active Fire</div>
          <div style="display:flex;align-items:center;gap:4px">
            <span style="display:inline-block;width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-bottom:10px solid #EF4444"></span>
            <span>30min</span>
            <span style="display:inline-block;width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-bottom:10px solid #FF6B35"></span>
            <span>60min</span>
            <span style="display:inline-block;width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-bottom:10px solid #EAB308"></span>
            <span>120min</span>
          </div>
          <div><span style="display:inline-block;width:10px;height:10px;border:2px solid #EF4444;border-radius:50%;margin-right:4px;background:rgba(239,68,68,0.15)"></span>Fire Perimeter</div>
          <div><span style="display:inline-block;width:10px;height:3px;background:#F59E0B;margin-right:4px;border-top:2px dashed #F59E0B"></span>Power Line</div>
          <div><span style="display:inline-block;width:10px;height:10px;border:1px dashed #666;border-radius:50%;margin-right:4px"></span>Historical</div>
        </div>
      `
      return div
    }
    legend.addTo(map)
    return () => { legend.remove() }
  }, [map])

  return null
}
