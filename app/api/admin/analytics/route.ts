import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

const LIVE_WINDOW_MS = 2 * 60 * 1000 // 2 minutes = "live"

function startOfDay(d = new Date()) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function daysAgo(n: number) {
  const d = startOfDay()
  d.setDate(d.getDate() - n)
  return d
}

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = getSupabaseAdmin()
    const now = Date.now()
    const liveSince = new Date(now - LIVE_WINDOW_MS).toISOString()
    const todayStart = startOfDay().toISOString()
    const weekStart = daysAgo(6).toISOString()

    const [
      liveRes,
      sessionsTodayRes,
      sessionsWeekRes,
      ordersRes,
      convertedTodayRes,
    ] = await Promise.all([
      supabase
        .from('analytics_sessions')
        .select('session_id', { count: 'exact', head: true })
        .gte('last_seen_at', liveSince),
      supabase
        .from('analytics_sessions')
        .select('session_id', { count: 'exact', head: true })
        .gte('first_seen_at', todayStart),
      supabase
        .from('analytics_sessions')
        .select('session_id, first_seen_at, converted')
        .gte('first_seen_at', weekStart),
      supabase
        .from('orders')
        .select('id, total_price, status, created_at')
        .gte('created_at', weekStart)
        .order('created_at', { ascending: true }),
      supabase
        .from('analytics_sessions')
        .select('session_id', { count: 'exact', head: true })
        .gte('first_seen_at', todayStart)
        .eq('converted', true),
    ])

    if (liveRes.error) throw liveRes.error
    if (sessionsTodayRes.error) throw sessionsTodayRes.error
    if (sessionsWeekRes.error) throw sessionsWeekRes.error
    if (ordersRes.error) throw ordersRes.error
    if (convertedTodayRes.error) throw convertedTodayRes.error

    const orders = ordersRes.data || []
    const sessionsWeek = sessionsWeekRes.data || []

    const ordersToday = orders.filter((o) => o.created_at >= todayStart)
    const revenueToday = ordersToday.reduce((s, o) => s + Number(o.total_price || 0), 0)
    const revenueWeek = orders.reduce((s, o) => s + Number(o.total_price || 0), 0)

    const sessionsToday = sessionsTodayRes.count || 0
    const conversionRateToday =
      sessionsToday > 0 ? (ordersToday.length / sessionsToday) * 100 : 0

    // Daily buckets for last 7 days
    const dayKeys: string[] = []
    for (let i = 6; i >= 0; i--) {
      dayKeys.push(daysAgo(i).toISOString().slice(0, 10))
    }

    const ordersByDay = dayKeys.map((day) => {
      const dayOrders = orders.filter((o) => String(o.created_at).slice(0, 10) === day)
      return {
        day,
        orders: dayOrders.length,
        revenue: dayOrders.reduce((s, o) => s + Number(o.total_price || 0), 0),
      }
    })

    const sessionsByDay = dayKeys.map((day) => ({
      day,
      sessions: sessionsWeek.filter((s) => String(s.first_seen_at).slice(0, 10) === day)
        .length,
    }))

    const statusCounts: Record<string, number> = {}
    for (const o of orders) {
      const key = o.status || 'unknown'
      statusCounts[key] = (statusCounts[key] || 0) + 1
    }

    return NextResponse.json({
      live: liveRes.count || 0,
      sessionsToday,
      sessionsWeek: sessionsWeek.length,
      ordersToday: ordersToday.length,
      ordersWeek: orders.length,
      revenueToday,
      revenueWeek,
      conversionRateToday: Number(conversionRateToday.toFixed(1)),
      convertedSessionsToday: convertedTodayRes.count || 0,
      ordersByDay,
      sessionsByDay,
      statusCounts,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('admin analytics error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load analytics' },
      { status: 500 }
    )
  }
}
