import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabaseClient';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  let event;
  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(body, sig!, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;
    if (orderId) {
      // Update booking in Supabase to paid
      const { error } = await supabase
        .from('Booking')
        .update({ payment_status: 'paid' })
        .eq('order_id', orderId);
      if (error) {
        console.error('Supabase update error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      console.log(`Booking ${orderId} marked as paid.`);
    }
  }

  return NextResponse.json({ received: true });
}
