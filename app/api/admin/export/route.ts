import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
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

function formatAddress(order: {
  address?: string
  commune?: string
  wilaya?: string
}) {
  return [order.address, order.commune, order.wilaya].filter(Boolean).join(', ')
}

function productSummary(order: {
  size?: string | null
  color?: string | null
  order_items?: Array<{
    quantity?: number
    size?: string | null
    color?: string | null
    product_id?: string
  }>
}) {
  const item = order.order_items?.[0]
  const qty = item?.quantity ?? 1
  const size = item?.size || order.size || '-'
  const color = item?.color || order.color || '-'
  return `qty ${qty} | size ${size} | color ${color}`
}

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
      .select('phone')

    if (bansError) throw bansError
    const bannedPhones = new Set((bans || []).map((b) => b.phone))

    let query = supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false })

    if (status && ORDER_STATUSES.includes(status as (typeof ORDER_STATUSES)[number])) {
      query = query.eq('status', status)
    }

    const { data: orders, error } = await query
    if (error) throw error

    let rows = orders || []
    if (bannedOnly) {
      rows = rows.filter((order) => bannedPhones.has(order.phone))
    }

    const sheetRows = rows.map((order) => ({
      Name: order.customer_name,
      Phone: order.phone,
      Address: formatAddress(order),
      'Order Date': order.created_at
        ? new Date(order.created_at).toLocaleString('en-GB')
        : '',
      Status: order.status,
      Banned: bannedPhones.has(order.phone) ? 'Yes' : 'No',
      Product: productSummary(order),
      Total: order.total_price,
      Delivery: order.delivery_method,
      Notes: order.notes || '',
    }))

    const workbook = XLSX.utils.book_new()
    const sheet = XLSX.utils.json_to_sheet(sheetRows)
    XLSX.utils.book_append_sheet(workbook, sheet, 'Customers')
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    const filename = `dagger-customers-${new Date().toISOString().slice(0, 10)}.xlsx`
    return new NextResponse(buffer, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('admin export error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Export failed',
      },
      { status: 500 }
    )
  }
}
