import nodemailer from 'nodemailer'

export async function POST(req: Request) {
  const smtpHost = process.env.SMTP_HOST
  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS
  const smtpPort = Number(process.env.SMTP_PORT || 587)
  const smtpSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465
  const fromEmail = process.env.SMTP_FROM || smtpUser
  const toEmail = process.env.SMTP_TO || 'dagger.ac.pro@gmail.com'

  if (!smtpHost || !smtpUser || !smtpPass || !fromEmail) {
    return new Response('Missing SMTP configuration', { status: 500 })
  }

  try {
    const orderData = await req.json()

    // Extract order information
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
    } = orderData

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    })

    const mailInfo = await transporter.sendMail({
      from: fromEmail,
      to: toEmail,
      subject: `New Order Received 🚀 - ${customer_name}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background-color: #E5525F;
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 8px 8px 0 0;
              }
              .content {
                background-color: #f9f9f9;
                padding: 20px;
                border: 1px solid #ddd;
              }
              .order-section {
                background-color: white;
                padding: 15px;
                margin: 10px 0;
                border-radius: 5px;
                border-left: 4px solid #E5525F;
              }
              .label {
                font-weight: bold;
                color: #666;
                margin-right: 10px;
              }
              .value {
                color: #333;
              }
              .total {
                background-color: #E5525F;
                color: white;
                padding: 15px;
                text-align: center;
                font-size: 24px;
                font-weight: bold;
                border-radius: 5px;
                margin-top: 20px;
              }
              .footer {
                text-align: center;
                padding: 20px;
                color: #666;
                font-size: 12px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>🎯 New Order Received</h1>
            </div>
            <div class="content">
              <div class="order-section">
                <h2>Customer Information</h2>
                <p><span class="label">Name:</span><span class="value">${customer_name}</span></p>
                <p><span class="label">Phone:</span><span class="value">${phone}</span></p>
                <p><span class="label">Address:</span><span class="value">${address}</span></p>
                <p><span class="label">Wilaya:</span><span class="value">${wilaya}</span></p>
                <p><span class="label">Commune:</span><span class="value">${commune}</span></p>
              </div>

              <div class="order-section">
                <h2>Product Details</h2>
                <p><span class="label">Product:</span><span class="value">${product_name}</span></p>
                <p><span class="label">Quantity:</span><span class="value">${quantity}</span></p>
                ${size ? `<p><span class="label">Size:</span><span class="value">${size}</span></p>` : ''}
                ${color ? `<p><span class="label">Color:</span><span class="value">${color}</span></p>` : ''}
              </div>

              <div class="order-section">
                <h2>Delivery Information</h2>
                <p><span class="label">Method:</span><span class="value">${delivery_method}</span></p>
                <p><span class="label">Delivery Cost:</span><span class="value">${delivery_cost.toLocaleString()} DA</span></p>
              </div>

              ${notes ? `
              <div class="order-section">
                <h2>Notes</h2>
                <p>${notes}</p>
              </div>
              ` : ''}

              <div class="total">
                Total: ${total_price.toLocaleString()} DA
              </div>
            </div>
            <div class="footer">
              <p>This is an automated email from Dagger Store</p>
              <p>© ${new Date().getFullYear()} The Dagger. All rights reserved.</p>
            </div>
          </body>
        </html>
      `,
    })

    return Response.json({ success: true, messageId: mailInfo.messageId })
  } catch (error: any) {
    console.error('Email API error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
