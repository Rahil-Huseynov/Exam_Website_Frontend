export const EXAM_DURATION_COOKIE = "exam_durationMinutes"

export function setCookie_EXAM_DURATION_COOKIE(name: string, value: string, days = 1) {
  if (typeof document === "undefined") return
  const maxAge = days * 24 * 60 * 60
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}`
}

export function deleteCookie_EXAM_DURATION_COOKIE(name: string) {
  if (typeof document === "undefined") return
  document.cookie = `${encodeURIComponent(name)}=; path=/; max-age=0`
}

export function getCookie_EXAM_DURATION_COOKIE(name: string) {
  if (typeof document === "undefined") return null
  const cookies = document.cookie ? document.cookie.split("; ").map(c => c.split("=")) : []
  const found = cookies.find(([k]) => decodeURIComponent(k) === name)
  return found ? decodeURIComponent(found[1]) : null
}

