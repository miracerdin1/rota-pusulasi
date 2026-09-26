/** Tarayıcıda saklanan küçük ayarlar. Her okuma/yazma hataya karşı korumalı. */
export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem('rp:' + key)
    return raw == null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

export function save(key: string, value: unknown): void {
  try {
    localStorage.setItem('rp:' + key, JSON.stringify(value))
  } catch {
    /* gizli sekme ya da dolu depolama */
  }
}
