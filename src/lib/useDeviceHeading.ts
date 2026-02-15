'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

const THROTTLE_MS = 150 // Only push state updates every 150ms

export function useDeviceHeading(): {
  heading: number | null
  supported: boolean
  permissionNeeded: boolean
  requestPermission: () => Promise<void>
} {
  const [heading, setHeading] = useState<number | null>(null)
  const [supported, setSupported] = useState(false)
  const [permissionNeeded, setPermissionNeeded] = useState(false)

  const lastUpdate = useRef(0)
  const latestValue = useRef<number | null>(null)
  const rafId = useRef<number>(0)

  const handleOrientation = useCallback((e: DeviceOrientationEvent) => {
    const iosHeading = (e as DeviceOrientationEvent & { webkitCompassHeading?: number }).webkitCompassHeading
    let value: number | null = null

    if (iosHeading != null && !isNaN(iosHeading)) {
      value = iosHeading
    } else if (e.alpha != null && !isNaN(e.alpha)) {
      value = (360 - e.alpha) % 360
    }

    if (value == null) return
    latestValue.current = value

    const now = Date.now()
    if (now - lastUpdate.current >= THROTTLE_MS) {
      lastUpdate.current = now
      setHeading(Math.round(value))
      if (!supported) setSupported(true)
    }
  }, [supported])

  useEffect(() => {
    const DOE = DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<string>
    }
    if (typeof DOE.requestPermission === 'function') {
      setPermissionNeeded(true)
      return
    }

    window.addEventListener('deviceorientation', handleOrientation, true)
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true)
      cancelAnimationFrame(rafId.current)
    }
  }, [handleOrientation])

  const requestPermission = useCallback(async () => {
    const DOE = DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<string>
    }
    if (typeof DOE.requestPermission === 'function') {
      try {
        const result = await DOE.requestPermission()
        if (result === 'granted') {
          setPermissionNeeded(false)
          window.addEventListener('deviceorientation', handleOrientation, true)
        }
      } catch {
        setPermissionNeeded(false)
      }
    }
  }, [handleOrientation])

  return { heading, supported, permissionNeeded, requestPermission }
}
