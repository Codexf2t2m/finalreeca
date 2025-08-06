import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/lib/prisma';
import { deduplicateRequest } from '@/utils/requestDeduplication';
import { createBookingWithRetry } from '@/lib/retrybookingservice';
import { cookies } from 'next/headers';
import jwt from "jsonwebtoken";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

const AGENT_JWT_SECRET = process.env.JWT_SECRET || "topo123";
const CONSULTANT_JWT_SECRET = process.env.JWT_SECRET || "changeme-in-production";

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
  agentId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: any = await request.json();
    const { totalPrice, userName, userEmail, selectedSeats, tripId } = body;

    if (!tripId || !totalPrice || !userName || !userEmail || !selectedSeats?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const orderId = body.orderId || Math.floor(100000 + Math.random() * 900000).toString();
    const idempotencyKey = `booking-${orderId}`;

    const cookieStore = await cookies();
    const agentToken = cookieStore.get('agent_token')?.value;
    const consultantToken = cookieStore.get('consultant_token')?.value;

    let agentId: string | null = null;
    let consultantId: string | null = null;

    if (agentToken) {
      try {
        const payload: any = jwt.verify(agentToken, AGENT_JWT_SECRET);
        agentId = payload?.id || null;
      } catch {
        agentId = null;
      }
    }
    if (consultantToken) {
      try {
        const payload: any = jwt.verify(consultantToken, CONSULTANT_JWT_SECRET);
        consultantId = payload?.id || null;
      } catch {
        consultantId = null;
      }
    }

    const bookingData = {
      ...body,
      agentId: agentId || null,
      consultantId: consultantId || null,
      totalPrice,
      orderId,
    };

    // If skipStripe is true (consultant paid in cash), just mark as paid and return success
    if (body.skipStripe && body.paymentMode === "Cash") {
      const booking = await deduplicateRequest(orderId, () => createBookingWithRetry(bookingData));
      if (!booking) {
        return NextResponse.json({ error: 'Booking creation failed. Please try again.' }, { status: 500 });
      }
      // Mark as paid in DB
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          paymentStatus: "paid",
          paymentMode: "Cash",
        },
      });
      return NextResponse.json({ success: true, orderId });
    }

    const booking = await deduplicateRequest(orderId, () => createBookingWithRetry(bookingData));

    if (!booking) {
      return NextResponse.json({
        error: 'Booking creation failed. Please try again.',
      }, { status: 500 });
    }

    // Stripe session creation
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
      customer_email: userEmail,
      metadata: {
        orderId,
        tripId,
        userName,
        userEmail,
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
