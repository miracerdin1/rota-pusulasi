import type { LatLng } from './geo'

const fmt = (p: LatLng) => `${p[0].toFixed(6)},${p[1].toFixed(6)}`

export interface Endpoint {
  /** Kullanıcının yazdığı metin; boşsa koordinat kullanılır */
  text?: string
  point?: LatLng
  /** "Konumum": Google başlangıcı telefonun konumu olarak alır */
  current?: boolean
}

/**
 * Google Maps yol tarifi linki. Duraklar koordinat olarak gider;
 * Google her birini otoyolun üstündeki o noktaya oturtur.
 * https://developers.google.com/maps/documentation/urls/get-started#directions-action
 */
export function googleMapsUrl(from: Endpoint, to: Endpoint, waypoints: LatLng[]): string {
  const p = new URLSearchParams({ api: '1', travelmode: 'driving' })
  const val = (e: Endpoint) => e.text?.trim() || (e.point ? fmt(e.point) : '')
  if (!from.current) p.set('origin', val(from))
  p.set('destination', val(to))
  if (waypoints.length) p.set('waypoints', waypoints.map(fmt).join('|'))
  return `https://www.google.com/maps/dir/?${p.toString()}`
}

/** Google Maps en fazla 10 nokta (başlangıç + 8 durak + varış) kabul ediyor. */
export const GOOGLE_MAX_WAYPOINTS = 8
