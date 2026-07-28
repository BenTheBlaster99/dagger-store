import { NextResponse } from 'next/server'
import {
  ADMIN_COOKIE,
  adminCookieOptions,
  createAdminSessionToken,
} from '@/lib/admin-session'

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false
  let mismatch = 0
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return mismatch === 0
}

export async function POST(req: Request) {
  try {
    const expected = process.env.ADMIN_PASSWORD
    if (!expected || !process.env.ADMIN_SESSION_SECRET) {
      return NextResponse.json(
        { error: 'Admin auth is not configured on the server' },
        { status: 500 }
      )
    }

    const { password } = await req.json()
    if (typeof password !== 'string' || !safeEqual(password, expected)) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }

    const token = await createAdminSessionToken()
    const res = NextResponse.json({ success: true })
    res.cookies.set(ADMIN_COOKIE, token, adminCookieOptions())
    return res
  } catch (error) {
    console.error('admin login error:', error)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
