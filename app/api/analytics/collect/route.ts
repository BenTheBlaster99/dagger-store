import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const sessionId = String(body.session_id || '').trim()
    if (!sessionId || sessionId.length > 80) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 400 })
    }

    // Ignore admin tooling noise if somehow sent
    const path = String(body.path || '/').slice(0, 500)
    if (path.startsWith('/admin')) {
      return NextResponse.json({ ok: true, skipped: true })
    }

    const pageview = Boolean(body.pageview)
    const converted = Boolean(body.converted)
    const referrer = body.referrer ? String(body.referrer).slice(0, 500) : null
    const userAgent = req.headers.get('user-agent')?.slice(0, 400) || null
    const now = new Date().toISOString()

    const supabase = getSupabaseAdmin()
    const { data: existing } = await supabase
      .from('analytics_sessions')
      .select('session_id, pageviews, converted, landing_path')
      .eq('session_id', sessionId)
      .maybeSingle()

    if (!existing) {
      const { error } = await supabase.from('analytics_sessions').insert({
        session_id: sessionId,
        first_seen_at: now,
        last_seen_at: now,
        pageviews: 1,
        landing_path: path,
        last_path: path,
        referrer,
        user_agent: userAgent,
        converted,
      })
      if (error) throw error
      return NextResponse.json({ ok: true, created: true })
    }

    const { error } = await supabase
      .from('analytics_sessions')
      .update({
        last_seen_at: now,
        last_path: path,
        pageviews: pageview ? Number(existing.pageviews || 0) + 1 : existing.pageviews,
        converted: existing.converted || converted,
      })
      .eq('session_id', sessionId)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('analytics collect error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Collect failed' },
      { status: 500 }
    )
  }
}
