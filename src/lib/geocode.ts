import type { LatLng } from './geo'

export interface Place {
  label: string
  point: LatLng
}

interface PhotonFeature {
  geometry: { coordinates: [number, number] }
  properties: {
    name?: string
    street?: string
    housenumber?: string
    district?: string
    city?: string
    county?: string
    state?: string
    country?: string
    countrycode?: string
  }
}

/**
 * Adres arama: Photon (OpenStreetMap tabanlı, anahtarsız). Türkçe yer adlarında
 * OpenRouteService'in kendi aramasından daha iyi sonuç veriyor.
 */
export async function geocode(text: string): Promise<Place[]> {
  // Konum önceliği verilmiyor: İstanbul'a yakınlık önceliği "Kargı, Çorum" gibi aramalarda
  // İstanbul'daki alakasız sonuçları öne çıkarıyordu.
  const p = new URLSearchParams({ q: text, limit: '8' })
  const res = await fetch(`https://photon.komoot.io/api/?${p}`)
  if (!res.ok) throw new Error(`Adres araması başarısız (${res.status}).`)
  const j = (await res.json()) as { features: PhotonFeature[] }
  const seen = new Set<string>()
  const out: Place[] = []
  for (const f of j.features) {
    const pr = f.properties
    if (pr.countrycode && pr.countrycode !== 'TR') continue
    const head = pr.name ?? [pr.street, pr.housenumber].filter(Boolean).join(' ')
    const parts = [head, pr.district, pr.city ?? pr.county, pr.state].filter(
      (x, i, arr): x is string => !!x && arr.indexOf(x) === i,
    )
    const label = parts.join(', ')
    if (!label || seen.has(label)) continue
    seen.add(label)
    out.push({ label, point: [f.geometry.coordinates[1], f.geometry.coordinates[0]] })
    if (out.length >= 5) break
  }
  return out
}
