import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Initialize Resend inside the function to avoid build-time errors
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      console.error('RESEND_API_KEY is not set')
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      )
    }

    const resend = new Resend(apiKey)
    const orderData = await request.json()

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

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Dagger Store <onboarding@resend.dev>',
      to: 'dagger.ac.pro@gmail.com',
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

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json(
        { error: 'Failed to send email', details: error },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Email API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

