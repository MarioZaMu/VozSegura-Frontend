import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useRef } from 'react'
import type { LocationFix } from '../../features/alert/alertCapture'
import { useT } from '../../i18n/useT'

type AlertMapProps = {
  /** Oldest first; the last one is the current position. */
  locations: LocationFix[]
  /** "Activa" pulses the marker; a stopped alert shows a still one. */
  live: boolean
}

const DEFAULT_ZOOM = 17
// Standard OpenStreetMap tiles (free, no key; CARTO's dark tiles now need an API key),
// darkened with a CSS filter (`map-dark` in index.css) to match the brand.
const TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const ATTRIBUTION = '&copy; OpenStreetMap'

/** Leaflet paints SVG paths with plain colors, so read our tokens from the CSS variables. */
function token(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(`--color-${name}`).trim()
}

// Last position, its accuracy circle and the path walked so far.
export function AlertMap({ locations, live }: AlertMapProps) {
  const t = useT()
  const container = useRef<HTMLDivElement>(null)
  const layers = useRef<{ map: L.Map; trail: L.Polyline; accuracy: L.Circle; marker: L.CircleMarker } | null>(null)
  const followed = useRef(true)

  useEffect(() => {
    if (!container.current) return
    // No wheel zoom: scrolling the page over the map must keep scrolling the page.
    const map = L.map(container.current, { zoomControl: true, attributionControl: true, scrollWheelZoom: false })
    L.tileLayer(TILES, { attribution: ATTRIBUTION, maxZoom: 19 }).addTo(map)
    const primary = token('primary')
    const trail = L.polyline([], { color: token('gradient-to'), weight: 4, opacity: 0.8 }).addTo(map)
    const accuracy = L.circle([0, 0], { radius: 0, color: primary, weight: 1, fillColor: primary, fillOpacity: 0.15 }).addTo(map)
    const marker = L.circleMarker([0, 0], { radius: 9, color: token('white'), weight: 3, fillColor: primary, fillOpacity: 1 }).addTo(map)
    // Once the contact moves the map, stop recentering it on every update.
    map.on('dragstart', () => (followed.current = false))
    layers.current = { map, trail, accuracy, marker }
    return () => {
      map.remove()
      layers.current = null
    }
  }, [])

  const last = locations.at(-1)

  useEffect(() => {
    const current = layers.current
    if (!current || !last) return
    const point: L.LatLngTuple = [last.latitude, last.longitude]
    current.trail.setLatLngs(locations.map((fix) => [fix.latitude, fix.longitude]))
    current.accuracy.setLatLng(point).setRadius(last.accuracy)
    current.marker.setLatLng(point)
    if (followed.current) current.map.setView(point, current.map.getZoom() || DEFAULT_ZOOM, { animate: true })
  }, [locations, last])

  useEffect(() => {
    layers.current?.marker.getElement()?.classList.toggle('animate-live-pulse', live)
  }, [live, last])

  return (
    <div className="relative">
      <div ref={container} className="map-dark isolate h-72 w-full overflow-hidden rounded-lg bg-surface-raised" aria-label={t.contact.mapLabel} role="img" />
      {!last && (
        <p className="absolute inset-0 z-10 grid place-items-center rounded-lg bg-surface-raised text-body-sm text-text-secondary">
          {t.contact.mapWaiting}
        </p>
      )}
    </div>
  )
}
