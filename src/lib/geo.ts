/** [lat, lng] */
export type LatLng = [number, number]
/** [lng, lat] — GeoJSON / ORS sırası */
export type LngLat = [number, number]

const R = 6371008.8

export function haversine(a: LatLng, b: LatLng): number {
  const toRad = Math.PI / 180
  const dLat = (b[0] - a[0]) * toRad
  const dLng = (b[1] - a[1]) * toRad
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a[0] * toRad) * Math.cos(b[0] * toRad) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

/** Her köşe için başlangıçtan itibaren kümülatif mesafe (metre). */
export function cumulative(line: LatLng[]): number[] {
  const out = [0]
  for (let i = 1; i < line.length; i++) out.push(out[i - 1] + haversine(line[i - 1], line[i]))
  return out
}

/** Çizgi üzerinde, başlangıçtan `d` metre ilerideki nokta. */
export function pointAlong(line: LatLng[], cum: number[], d: number): LatLng {
  if (d <= 0) return line[0]
  const total = cum[cum.length - 1]
  if (d >= total) return line[line.length - 1]
  let i = 1
  while (cum[i] < d) i++
  const seg = cum[i] - cum[i - 1]
  const t = seg === 0 ? 0 : (d - cum[i - 1]) / seg
  const a = line[i - 1]
  const b = line[i]
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
}

/** Çizgiyi yaklaşık `step` metrede bir örnekler (uçlar dahil). */
export function resample(line: LatLng[], step: number): LatLng[] {
  if (line.length < 2) return line.slice()
  const cum = cumulative(line)
  const total = cum[cum.length - 1]
  const n = Math.max(1, Math.round(total / step))
  const out: LatLng[] = []
  for (let k = 0; k <= n; k++) out.push(pointAlong(line, cum, (total * k) / n))
  return out
}

/** Noktanın etrafında kenar yarı uzunluğu `half` metre olan kare halka (GeoJSON, [lng,lat]). */
export function squareRing(p: LatLng, half: number): LngLat[] {
  const dLat = half / 111320
  const dLng = half / (111320 * Math.cos((p[0] * Math.PI) / 180))
  const [lat, lng] = p
  return [
    [lng - dLng, lat - dLat],
    [lng + dLng, lat - dLat],
    [lng + dLng, lat + dLat],
    [lng - dLng, lat + dLat],
    [lng - dLng, lat - dLat],
  ]
}

export interface BBox {
  s: number
  w: number
  n: number
  e: number
}

export function bboxOf(points: LatLng[], marginM = 0): BBox {
  let s = 90, w = 180, n = -90, e = -180
  for (const [lat, lng] of points) {
    if (lat < s) s = lat
    if (lat > n) n = lat
    if (lng < w) w = lng
    if (lng > e) e = lng
  }
  const dLat = marginM / 111320
  const dLng = marginM / (111320 * Math.cos((((s + n) / 2) * Math.PI) / 180))
  return { s: s - dLat, w: w - dLng, n: n + dLat, e: e + dLng }
}

export function inBBox(p: LatLng, b: BBox): boolean {
  return p[0] >= b.s && p[0] <= b.n && p[1] >= b.w && p[1] <= b.e
}

/**
 * Çok sayıda noktaya en yakın mesafeyi hızlı bulmak için basit ızgara indeksi.
 * Hücre boyu ~0.05° (≈5 km); arama `maxM` yarıçapına kadar genişler.
 */
export class PointIndex {
  private cells = new Map<string, LatLng[]>()
  private readonly size = 0.05
  constructor(points: LatLng[]) {
    for (const p of points) {
      const k = this.key(p)
      const arr = this.cells.get(k)
      if (arr) arr.push(p)
      else this.cells.set(k, [p])
    }
  }
  get empty(): boolean {
    return this.cells.size === 0
  }
  private key(p: LatLng): string {
    return `${Math.floor(p[0] / this.size)}:${Math.floor(p[1] / this.size)}`
  }
  nearest(p: LatLng, maxM: number): number {
    const ring = Math.ceil(maxM / 4000) + 1
    const ci = Math.floor(p[0] / this.size)
    const cj = Math.floor(p[1] / this.size)
    let best = Infinity
    for (let di = -ring; di <= ring; di++) {
      for (let dj = -ring; dj <= ring; dj++) {
        const arr = this.cells.get(`${ci + di}:${cj + dj}`)
        if (!arr) continue
        for (const q of arr) {
          const d = haversine(p, q)
          if (d < best) best = d
        }
      }
    }
    return best
  }
}
