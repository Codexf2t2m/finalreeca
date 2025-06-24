import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Received payment request:', body);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'bwp', // or "usd" or your currency
            product_data: {
              name: 'Bus Ticket',
              description: `Order ${body.orderId}`,
            },
            unit_amount: body.totalPrice * 100, // Stripe expects amount in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/failed`,
      customer_email: body.userEmail,
      metadata: {
        tripId: body.tripId,
        seats: body.selectedSeats?.join(',') || '',
        userName: body.userName,
        boardingPoint: body.boardingPoint,
        droppingPoint: body.droppingPoint,
        orderId: body.orderId,
      },
    });

    console.log('Stripe session created:', session.id);

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe Session Error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}