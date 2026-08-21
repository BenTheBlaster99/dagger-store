import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

type LeadPayload = {
  customer_name?: string
  phone?: string
  wilaya?: string
  commune?: string
  product_name?: string
  product_id?: string
  quantity?: number
  total_price?: number | null
  size?: string | null
  color?: string | null
  /** When true, remove live abandoned lead (order completed) */
  converted?: boolean
}

function normalizePhone(phone: string) {
  return phone.replace(/[^\d+]/g, '').replace(/\s/g, '')
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as LeadPayload
    const phone = normalizePhone(body.phone || '')
    const digits = phone.replace(/\D/g, '')

    if (digits.length < 9) {
      return NextResponse.json({ ok: false, reason: 'phone_too_short' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const externalId = `live:${digits}`
    const phoneKey = digits.startsWith('213') ? `+${digits}` : phone.startsWith('+') ? phone : `+${digits}`

    if (body.converted) {
      const { error } = await supabase
        .from('crm_leads')
        .delete()
        .eq('source', 'abandoned')
        .eq('external_id', externalId)
      if (error) throw error
      return NextResponse.json({ ok: true, converted: true })
    }

    const name = (body.customer_name || '').trim()
    if (name.length < 2) {
      return NextResponse.json({ ok: false, reason: 'name_too_short' }, { status: 400 })
    }

    const city = [body.wilaya, body.commune].filter(Boolean).join(' / ') || body.wilaya || null
    const row = {
      source: 'abandoned' as const,
      external_id: externalId,
      occurred_at: new Date().toISOString(),
      customer_name: name,
      phone: phoneKey,
      city,
      address: body.commune || null,
      product_title: body.product_name || null,
      quantity: body.quantity || 1,
      total_price: body.total_price ?? null,
    }

    // Update existing live lead for this phone, or insert
    const { data: existing } = await supabase
      .from('crm_leads')
      .select('id')
      .eq('source', 'abandoned')
      .eq('external_id', externalId)
      .maybeSingle()

    if (existing?.id) {
      const { error } = await supabase.from('crm_leads').update(row).eq('id', existing.id)
      if (error) throw error
      return NextResponse.json({ ok: true, updated: true, id: existing.id })
    }

    const { data, error } = await supabase.from('crm_leads').insert(row).select('id').single()
    if (error) throw error
    return NextResponse.json({ ok: true, created: true, id: data.id })
  } catch (error) {
    console.error('checkout-lead error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save lead' },
      { status: 500 }
    )
  }
}
