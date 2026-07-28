export const ADMIN_COOKIE = 'dagger_admin_session'
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30 // 30 days, multi-device OK

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET
  if (!secret) {
    throw new Error('Missing ADMIN_SESSION_SECRET')
  }
  return secret
}

async function getKey() {
  const enc = new TextEncoder()
  return crypto.subtle.importKey(
    'raw',
    enc.encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
}

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function fromHex(hex: string) {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

async function sign(value: string) {
  const key = await getKey()
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value))
  return toHex(signature)
}

export async function createAdminSessionToken() {
  const exp = Date.now() + SESSION_TTL_MS
  const payload = `admin:${exp}`
  const signature = await sign(payload)
  return `${payload}.${signature}`
}

export async function verifyAdminSessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false
  try {
    const lastDot = token.lastIndexOf('.')
    if (lastDot === -1) return false
    const payload = token.slice(0, lastDot)
    const signature = token.slice(lastDot + 1)
    if (!/^[0-9a-f]+$/i.test(signature) || signature.length % 2 !== 0) return false

    const key = await getKey()
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      fromHex(signature),
      new TextEncoder().encode(payload)
    )
    if (!valid) return false

    const [, expStr] = payload.split(':')
    const exp = Number(expStr)
    if (!exp || Date.now() > exp) return false
    return true
  } catch {
    return false
  }
}

export function adminCookieOptions(maxAgeSeconds = SESSION_TTL_MS / 1000) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeSeconds,
  }
}
