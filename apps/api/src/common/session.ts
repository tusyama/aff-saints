export const SESSION_COOKIE = 'desk_session'
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7

export function writeSessionCookie(token: string, maxAge = SESSION_MAX_AGE_SECONDS): string {
  return [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    'HttpOnly',
    'Path=/',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
  ].join('; ')
}

export function readSessionCookie(header: string | undefined): string | null {
  if (!header) return null
  for (const part of header.split(';')) {
    const [name, ...rest] = part.trim().split('=')
    if (name !== SESSION_COOKIE) continue
    return decodeURIComponent(rest.join('='))
  }
  return null
}
