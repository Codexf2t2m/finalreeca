import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/lib/prisma'; // make sure you're exporting singleton correctly
import { deduplicateRequest } from '@/utils/requestDeduplication';
import { createBookingWithRetry } from '@/lib/retrybookingservice';
import { cookies } from "next/headers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

interface BookingRequest {
  tripId: string;
  totalPrice: number;
  userName: string;
  userEmail: string;
  userPhone: string;
  boardingPoint: string;
  droppingPoint: string;
  selectedSeats: string[];
  passengers: Array<{
    firstName: string;
    lastName: string;
    seatNumber: string;
    title: string;
  }>;
  paymentMode?: string;
  returnTripId?: string;
  returnBoardingPoint?: string;
  returnDroppingPoint?: string;
  returnSeats?: string[];
  contactDetails?: any;
  emergencyContact?: any;
  promoCode?: string;
  discountAmount?: number;
  orderId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: BookingRequest = await request.json();
    const cookieStore = await cookies();
    const agentId = cookieStore.get("agent_token")?.value || null;

    let totalPrice = body.totalPrice;
    let discountAmount = 0;

    if (agentId) {
      discountAmount = Math.round(totalPrice * 0.10);
      totalPrice = totalPrice - discountAmount;
      console.log(`[Agent Booking] agentId: ${agentId}, Original price: ${body.totalPrice}, Discount: ${discountAmount}, Final price: ${totalPrice}`);
    } else {
      console.log(`[Client Booking] No agent, price: ${totalPrice}`);
    }

    // Pass agentId and discountAmount to booking creation
    const bookingData = {
      ...body,
      agentId,
      discountAmount,
      totalPrice,
    };

    if (!body.tripId || !totalPrice || !body.userName || !body.userEmail || !body.selectedSeats?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const orderId = body.orderId || `RT-${uuidv4().slice(0, 8)}-${Date.now()}`;
    const idempotencyKey = `booking-${orderId}`;

    const booking = await deduplicateRequest(orderId, () => createBookingWithRetry({ ...bookingData, orderId }));

    if (!booking) {
      return NextResponse.json({
        error: 'Booking creation failed. Please try again.',
      }, { status: 500 });
    }

    // Stripe session creation (outside DB transaction)
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'bwp',
            product_data: {
              name: 'Bus Ticket',
              description: `Order ${orderId} - ${body.boardingPoint} to ${body.droppingPoint}`,
            },
            unit_amount: totalPrice * 100,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/failed?order_id=${orderId}`,
      customer_email: body.userEmail,
      metadata: {
        orderId,
        tripId: body.tripId,
        userName: body.userName,
        userEmail: body.userEmail,
        boardingPoint: body.boardingPoint,
        droppingPoint: body.droppingPoint,
      },
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 mins
    }, {
      idempotencyKey,
    });

    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        transactionToken: session.id,
      },
    });

    console.log('Stripe session created:', session.id);

    return NextResponse.json({
      url: session.url,
      orderId,
      sessionId: session.id,
    });
  } catch (error: any) {
    console.error('Stripe Session Error:', error);

    if (error.code === 'P2002') {
      return NextResponse.json({
        error: 'A booking with this order ID already exists',
      }, { status: 409 });
    }

    if (error.type === 'StripeError') {
      return NextResponse.json({
        error: 'Payment processing error. Please try again.',
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'An unexpected error occurred. Please try again.',
    }, { status: 500 });
  }
}
