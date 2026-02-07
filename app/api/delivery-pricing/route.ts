import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const baseUrl = (process.env.ZR_EXPRESS_BASE_URL || 'https://api.zrexpress.app').replace(/\/$/, '')
    const apiKey = process.env.ZR_EXPRESS_API_KEY
    const tenantId = process.env.ZR_EXPRESS_TENANT_ID
    const bearerToken = process.env.ZR_EXPRESS_BEARER_TOKEN
    const authScheme = (process.env.ZR_EXPRESS_AUTH_SCHEME || 'x-api-key').toLowerCase()

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing ZR_EXPRESS_API_KEY' },
        { status: 500 }
      )
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (authScheme === 'bearer') {
      headers.Authorization = `Bearer ${bearerToken || apiKey}`
    } else {
      headers['x-api-key'] = apiKey
      if (bearerToken) {
        headers.Authorization = `Bearer ${bearerToken}`
      }
    }

    if (tenantId) {
      headers['x-tenant-id'] = tenantId
      headers['x-tenant'] = tenantId
      headers['X-Tenant'] = tenantId
    }

    const res = await fetch(`${baseUrl}/api/v1/delivery-pricing/rates`, {
      headers,
      cache: 'no-store',
    })

    if (!res.ok) {
      const errorBody = await res.text()
      const responseHeaders = Object.fromEntries(res.headers.entries())
      return NextResponse.json(
        {
          error: 'Failed to fetch delivery pricing',
          status: res.status,
          statusText: res.statusText,
          headers: responseHeaders,
          details: errorBody || null,
        },
        { status: res.status }
      )
    }

    const data = await res.json()
    console.log('ZR DELIVERY PRICING PAYLOAD:', JSON.stringify(data, null, 2))
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json(
      { error: 'Server error fetching delivery pricing' },
      { status: 500 }
    )
  }
}
