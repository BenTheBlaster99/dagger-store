import { Resend } from 'resend'

type OrderNotifyPayload = {
  customer_name: string
  phone: string
  address: string
  wilaya: string
  commune: string
  delivery_method: string
  delivery_cost: number
  total_price: number
  product_name: string
  quantity: number
  size?: string | null
  color?: string | null
  notes?: string | null
}

function buildWhatsAppText(order: OrderNotifyPayload) {
  const lines = [
    '*New Dagger Order*',
    '',
    `*Customer:* ${order.customer_name}`,
    `*Phone:* ${order.phone}`,
    `*Address:* ${order.address}`,
    `*Wilaya:* ${order.wilaya}`,
    `*Commune:* ${order.commune}`,
    '',
    `*Product:* ${order.product_name}`,
    `*Qty:* ${order.quantity}`,
    order.size ? `*Size:* ${order.size}` : null,
    order.color ? `*Color:* ${order.color}` : null,
    '',
    `*Delivery:* ${order.delivery_method}`,
    `*Delivery cost:* ${Number(order.delivery_cost).toLocaleString()} DA`,
    `*Total:* ${Number(order.total_price).toLocaleString()} DA`,
    order.notes ? `\n*Notes:* ${order.notes}` : null,
  ]
  return lines.filter((line) => line !== null).join('\n')
}

async function sendWhatsApp(order: OrderNotifyPayload) {
  const phone = process.env.CALLMEBOT_PHONE
  const apikey = process.env.CALLMEBOT_APIKEY

  if (!phone || !apikey) {
    return { skipped: true as const, reason: 'Missing CALLMEBOT_PHONE or CALLMEBOT_APIKEY' }
  }

  const text = encodeURIComponent(buildWhatsAppText(order))
  const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&text=${text}&apikey=${encodeURIComponent(apikey)}`

  const res = await fetch(url)
  const body = await res.text()

  if (!res.ok) {
    throw new Error(`CallMeBot failed (${res.status}): ${body}`)
  }

  return { skipped: false as const, body }
}

async function sendEmail(order: OrderNotifyPayload) {
  if (!process.env.RESEND_API_KEY) {
    return { skipped: true as const, reason: 'Missing RESEND_API_KEY' }
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const {
    customer_name,
    phone,
    address,
    wilaya,
    commune,
    delivery_method,
    delivery_cost,
    total_price,
    product_name,
    quantity,
    size,
    color,
    notes,
  } = order

  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'Dagger Store <onboarding@resend.dev>',
    to: 'dagger.ac.pro@gmail.com',
    subject: `New Order Received - ${customer_name}`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background:#E5525F;color:#fff;padding:20px;text-align:center;border-radius:8px 8px 0 0;">
            <h1>New Order Received</h1>
          </div>
          <div style="background:#f9f9f9;padding:20px;border:1px solid #ddd;">
            <p><strong>Name:</strong> ${customer_name}</p>
            <p><strong>Phone:</strong> ${phone}</p>
            <p><strong>Address:</strong> ${address}</p>
            <p><strong>Wilaya:</strong> ${wilaya}</p>
            <p><strong>Commune:</strong> ${commune}</p>
            <p><strong>Product:</strong> ${product_name}</p>
            <p><strong>Quantity:</strong> ${quantity}</p>
            ${size ? `<p><strong>Size:</strong> ${size}</p>` : ''}
            ${color ? `<p><strong>Color:</strong> ${color}</p>` : ''}
            <p><strong>Delivery:</strong> ${delivery_method}</p>
            <p><strong>Delivery Cost:</strong> ${Number(delivery_cost).toLocaleString()} DA</p>
            ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
            <p style="background:#E5525F;color:#fff;padding:15px;text-align:center;font-size:22px;font-weight:bold;border-radius:5px;">
              Total: ${Number(total_price).toLocaleString()} DA
            </p>
          </div>
        </body>
      </html>
    `,
  })

  if (error) {
    throw new Error(typeof error === 'string' ? error : JSON.stringify(error))
  }

  return { skipped: false as const, data }
}

export async function POST(req: Request) {
  try {
    const orderData = (await req.json()) as OrderNotifyPayload

    if (!orderData?.customer_name || !orderData?.phone || !orderData?.product_name) {
      return Response.json({ error: 'Invalid order payload' }, { status: 400 })
    }

    const results = {
      whatsapp: null as unknown,
      email: null as unknown,
    }

    try {
      results.whatsapp = await sendWhatsApp(orderData)
    } catch (err) {
      console.error('WhatsApp notify failed:', err)
      results.whatsapp = {
        error: err instanceof Error ? err.message : 'WhatsApp failed',
      }
    }

    try {
      results.email = await sendEmail(orderData)
    } catch (err) {
      console.error('Email notify failed:', err)
      results.email = {
        error: err instanceof Error ? err.message : 'Email failed',
      }
    }

    return Response.json({ success: true, results })
  } catch (error) {
    console.error('notify-order error:', error)
    return Response.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
