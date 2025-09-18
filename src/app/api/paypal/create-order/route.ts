import { NextResponse } from 'next/server';

const PAYPAL_API_BASE = process.env.NODE_ENV === 'production'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

async function generateAccessToken() {
  const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    body: 'grant_type=client_credentials',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  const data = await response.json();
  return data.access_token;
}

export async function POST(request: Request) {
  try {
    const { stakeAmount } = await request.json();

    if (typeof stakeAmount !== 'number' || isNaN(stakeAmount) || stakeAmount <= 0) {
      return NextResponse.json({ message: 'Invalid stakeAmount provided.' }, { status: 400 });
    }

    const accessToken = await generateAccessToken();

    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: 'USD',
              value: stakeAmount.toFixed(2), // Ensure two decimal places
            },
          },
        ],
      }),
    });

    const order = await response.json();
    if (response.ok) {
      return NextResponse.json({ id: order.id }, { status: 201 });
    } else {
      console.error('PayPal order creation error:', order);
      return NextResponse.json({ message: order.message || 'Failed to create PayPal order.' }, { status: response.status });
    }
  } catch (error) {
    console.error('Error creating PayPal order:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
