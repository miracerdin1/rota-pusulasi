import type { LatLng } from './geo'

const fix = (n: number) => n.toFixed(6)

/**
 * Yandex Navigasyon uygulamasını rota çizili açar. Duraklar `lat_via_N`/`lon_via_N`
 * olarak gider; başlangıç verilmezse Navigasyon telefonun konumunu kullanır.
 * Yandex adres değil koordinat istediği için başlangıç/varış da koordinat gider.
 * https://yandex.ru/dev/navigator/doc/ru/concepts/navigator-url-params
 */
export function yandexNaviUrl(from: LatLng | null, to: LatLng, waypoints: LatLng[]): string {
  const p = new URLSearchParams()
  if (from) {
    p.set('lat_from', fix(from[0]))
    p.set('lon_from', fix(from[1]))
  }
  p.set('lat_to', fix(to[0]))
  p.set('lon_to', fix(to[1]))
  waypoints.forEach((w, i) => {
    p.set(`lat_via_${i}`, fix(w[0]))
    p.set(`lon_via_${i}`, fix(w[1]))
  })
  return `yandexnavi://build_route_on_map?${p.toString()}`
}

/**
 * Yandex Haritalar yol tarifi linki. Telefonda Yandex Haritalar uygulamasında,
 * bilgisayarda tarayıcıda açılır; rota oradan Navigasyon'a da aktarılabilir.
 * `rtext` noktaları `~` ile ayırır; boş başlangıç "konumum" demektir.
 */
export function yandexMapsUrl(from: LatLng | null, to: LatLng, waypoints: LatLng[]): string {
  const pt = (p: LatLng) => `${fix(p[0])},${fix(p[1])}`
  const rtext = [from ? pt(from) : '', ...waypoints.map(pt), pt(to)].join('~')
  return `https://yandex.com.tr/maps/?rtext=${rtext}&rtt=auto`
}
