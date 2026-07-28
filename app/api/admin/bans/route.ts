import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

function normalizePhone(phone: string) {
  return phone.trim().replace(/\s/g, '')
}

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const phone = normalizePhone(String(body.phone || ''))
    const name = body.name ? String(body.name) : null
    const reason = body.reason ? String(body.reason) : null

    if (!phone) {
      return NextResponse.json({ error: 'Phone is required' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('banned_customers')
      .upsert({ phone, name, reason }, { onConflict: 'phone' })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ ban: data })
  } catch (error) {
    console.error('admin bans POST error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to ban customer',
      },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const phone = normalizePhone(searchParams.get('phone') || '')

    if (!phone) {
      return NextResponse.json({ error: 'Phone is required' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const { error } = await supabase.from('banned_customers').delete().eq('phone', phone)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('admin bans DELETE error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to unban customer',
      },
      { status: 500 }
    )
  }
}
