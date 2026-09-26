import type { LatLng, LngLat } from './geo'
import { squareRing } from './geo'

const BASE = 'https://api.openrouteservice.org'

export class OrsError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message)
  }
}

function explain(status: number, body: string): string {
  if (status === 401 || status === 403) return 'API anahtarı geçersiz. Ayarlardan anahtarı kontrol edin.'
  if (status === 429) return 'OpenRouteService günlük/dakikalık sınıra ulaşıldı. Biraz bekleyip tekrar deneyin.'
  if (status === 413) return 'İstek çok büyük.'
  try {
    const j = JSON.parse(body)
    const m = j?.error?.message ?? j?.error ?? j?.message
    if (m) return `OpenRouteService: ${typeof m === 'string' ? m : JSON.stringify(m)}`
  } catch {
    /* düz metin */
  }
  return `OpenRouteService hatası (${status}).`
}

export interface RouteResult {
  line: LatLng[]
  distance: number // m
  duration: number // s
  /** [başlangıçİndeksi, bitişİndeksi, değer] — ORS "waycategory" bit maskesi (1 = otoyol, 32 = tünel) */
  waycategory: [number, number, number][]
  /** Her giriş noktasının geometrideki indeksi */
  wayPoints: number[]
}

export async function route(
  key: string,
  points: LatLng[],
  cuts: LatLng[] = [],
  cutHalfSize = 11,
): Promise<RouteResult> {
  const body: Record<string, unknown> = {
    coordinates: points.map((p) => [p[1], p[0]]),
    extra_info: ['waycategory'],
    instructions: false,
    // Başlangıç/varış esnek, ara noktalar (otoyol üstünde) sıkı
    radiuses: points.map((_, i) => (i === 0 || i === points.length - 1 ? 3000 : 150)),
  }
  if (cuts.length) {
    body.options = {
      avoid_polygons: {
        type: 'MultiPolygon',
        coordinates: cuts.map((c) => [squareRing(c, cutHalfSize)]),
      },
    }
  }
  const res = await fetch(`${BASE}/v2/directions/driving-car/geojson`, {
    method: 'POST',
    headers: {
      Authorization: key,
      'Content-Type': 'application/json',
      Accept: 'application/geo+json, application/json',
    },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  if (!res.ok) throw new OrsError(explain(res.status, text), res.status)
  const j = JSON.parse(text)
  const f = j.features?.[0]
  if (!f) throw new OrsError('Rota bulunamadı.')
  return {
    line: (f.geometry.coordinates as LngLat[]).map(([lng, lat]) => [lat, lng] as LatLng),
    distance: f.properties.summary?.distance ?? 0,
    duration: f.properties.summary?.duration ?? 0,
    waycategory: f.properties.extras?.waycategory?.values ?? [],
    wayPoints: f.properties.way_points ?? [0, f.geometry.coordinates.length - 1],
  }
}
