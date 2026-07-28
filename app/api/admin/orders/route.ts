import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'delivered',
  'cancelled',
  'declined',
  'returned',
] as const

export async function GET(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const bannedOnly = searchParams.get('banned') === '1'

    const supabase = getSupabaseAdmin()

    const { data: bans, error: bansError } = await supabase
      .from('banned_customers')
      .select('*')
      .order('created_at', { ascending: false })

    if (bansError) throw bansError

    const bannedPhones = new Set((bans || []).map((b) => b.phone))

    let query = supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false })

    if (status && ORDER_STATUSES.includes(status as (typeof ORDER_STATUSES)[number])) {
      query = query.eq('status', status)
    }

    const { data: orders, error: ordersError } = await query
    if (ordersError) throw ordersError

    let rows = (orders || []).map((order) => ({
      ...order,
      is_banned: bannedPhones.has(order.phone),
    }))

    if (bannedOnly) {
      rows = rows.filter((order) => order.is_banned)
    }

    return NextResponse.json({
      orders: rows,
      bans: bans || [],
    })
  } catch (error) {
    console.error('admin orders GET error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to load orders',
      },
      { status: 500 }
    )
  }
}

export async function PATCH(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { id, status } = body

    if (!id || !ORDER_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid id or status' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ order: data })
  } catch (error) {
    console.error('admin orders PATCH error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to update order',
      },
      { status: 500 }
    )
  }
}
