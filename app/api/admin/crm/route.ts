import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const source = searchParams.get('source') || 'client'
    if (source !== 'client' && source !== 'abandoned') {
      return NextResponse.json({ error: 'Invalid source' }, { status: 400 })
    }

    const q = searchParams.get('q')?.trim() || ''
    const supabase = getSupabaseAdmin()

    let query = supabase
      .from('crm_leads')
      .select('*')
      .eq('source', source)
      .order('occurred_at', { ascending: false, nullsFirst: false })
      .limit(500)

    if (q) {
      query = query.or(
        `customer_name.ilike.%${q}%,phone.ilike.%${q}%,city.ilike.%${q}%,product_title.ilike.%${q}%`
      )
    }

    const { data, error, count } = await query
    if (error) throw error

    const { count: total } = await supabase
      .from('crm_leads')
      .select('*', { count: 'exact', head: true })
      .eq('source', source)

    return NextResponse.json({
      leads: data || [],
      total: total || 0,
      source,
    })
  } catch (error) {
    console.error('crm leads error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load leads' },
      { status: 500 }
    )
  }
}
