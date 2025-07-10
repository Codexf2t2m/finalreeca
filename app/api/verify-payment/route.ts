import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});
const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json({ 
        error: 'Session ID is required' 
      }, { status: 400 });
    }

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session || !session.metadata?.orderId) {
      return NextResponse.json({ 
        error: 'Invalid session or missing order ID' 
      }, { status: 400 });
    }

    const orderId = session.metadata.orderId;

    // Determine payment status
    let paymentStatus = 'pending';
    if (session.payment_status === 'paid') {
      paymentStatus = 'paid';
    } else if (session.payment_status === 'unpaid' || session.payment_status === 'no_payment_required') {
      paymentStatus = 'cancelled';
    }

    // Update the booking in Prisma
    const updatedBooking = await prisma.booking.update({
      where: { orderId },
      data: {
        paymentStatus,
        transactionToken: sessionId,
        // Optionally: paidAt: paymentStatus === 'paid' ? new Date() : null,
      },
      include: { passengers: true },
    });

    return NextResponse.json({ 
      success: true,
      orderId, 
      paymentStatus,
      booking: updatedBooking,
      session: {
        id: session.id,
        payment_status: session.payment_status,
        amount_total: session.amount_total,
        currency: session.currency,
      }
    });

  } catch (error: any) {
    console.error('[VERIFICATION] Error:', error.message);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { transactionToken, orderId } = await request.json();

    if (!transactionToken || !orderId) {
      return NextResponse.json({ 
        error: 'Missing parameters' 
      }, { status: 400 });
    }

    // Verify payment with Stripe
    const session = await stripe.checkout.sessions.retrieve(transactionToken);
    
    if (!session) {
      return NextResponse.json({ 
        error: 'Invalid session' 
      }, { status: 400 });
    }

    // Update booking status based on verification
    let paymentStatus = 'pending';
    if (session.payment_status === 'paid') {
      paymentStatus = 'paid';
    } else if (session.payment_status === 'unpaid' || session.payment_status === 'no_payment_required') {
      paymentStatus = 'cancelled';
    }

    // Update the booking in Prisma
    const updatedBooking = await prisma.booking.update({
      where: { orderId },
      data: {
        paymentStatus,
        transactionToken,
        // Optionally: paidAt: paymentStatus === 'paid' ? new Date() : null,
      },
      include: { passengers: true },
    });

    return NextResponse.json({ 
      success: true,
      orderId, 
      paymentStatus,
      booking: updatedBooking
    });

  } catch (error: any) {
    console.error('[VERIFICATION] Error:', error.message);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}