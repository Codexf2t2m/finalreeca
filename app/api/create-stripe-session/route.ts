import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

// Use a singleton pattern for Prisma to avoid connection issues
let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // @ts-ignore
  if (!global.prisma) {
    // @ts-ignore
    global.prisma = new PrismaClient();
  }
  // @ts-ignore
  prisma = global.prisma;
}

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
    console.log('Received payment request:', body);

    // Validate required fields
    if (!body.tripId || !body.totalPrice || !body.userName || !body.userEmail || !body.selectedSeats?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Generate a unique orderId with timestamp for better uniqueness
    const orderId = body.orderId || `RT-${uuidv4().slice(0, 8)}-${Date.now()}`;

    // Create idempotency key to prevent duplicate payments
    const idempotencyKey = `booking-${orderId}`;

    // Use database transaction to ensure atomicity for DB only
    let booking = await prisma.$transaction(async (tx) => {
      let found = await tx.booking.findUnique({ where: { orderId }, include: { passengers: true } });
      if (!found) {
        const createdBooking = await tx.booking.create({
          data: {
            tripId: body.tripId,
            userName: body.userName,
            userEmail: body.userEmail,
            userPhone: body.userPhone,
            seats: JSON.stringify(body.selectedSeats),
            seatCount: body.selectedSeats.length + (body.returnSeats?.length || 0),
            totalPrice: body.totalPrice,
            boardingPoint: body.boardingPoint,
            droppingPoint: body.droppingPoint,
            orderId,
            paymentStatus: 'pending',
            bookingStatus: 'confirmed',
            paymentMode: body.paymentMode || 'Credit Card',
            returnTripId: body.returnTripId || null,
            returnBoardingPoint: body.returnBoardingPoint || null,
            returnDroppingPoint: body.returnDroppingPoint || null,
            returnSeats: body.returnSeats?.length ? JSON.stringify(body.returnSeats) : null,
            promoCode: body.promoCode || null,
            discountAmount: body.discountAmount || 0,
            competitorInfo: {},
          },
        });
        if (body.passengers?.length) {
          await tx.passenger.createMany({
            data: body.passengers.map((p) => ({
              bookingId: createdBooking.id,
              firstName: p.firstName,
              lastName: p.lastName,
              seatNumber: p.seatNumber,
              title: p.title,
              isReturn: !!(body.returnSeats && body.returnSeats.includes(p.seatNumber)),
            })),
            skipDuplicates: true,
          });
        }
        found = await tx.booking.findUnique({ where: { orderId }, include: { passengers: true } });
        if (!found) throw new Error('Booking not found after creation');
      }
      return found;
    });

    // Now create Stripe session OUTSIDE the transaction
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
            unit_amount: body.totalPrice * 100,
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
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes expiry
    }, {
      idempotencyKey, // Prevent duplicate sessions
    });

    // Update booking with Stripe session ID (use transactionToken)
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        transactionToken: session.id,
      },
    });

    // Fetch again to ensure up-to-date
    const bookingWithPassengers = await prisma.booking.findUnique({ where: { orderId }, include: { passengers: true } });
    if (!bookingWithPassengers) throw new Error('Booking not found after update');

    console.log('Stripe session created:', session.id);

    return NextResponse.json({ 
      url: session.url,
      orderId,
      sessionId: session.id 
    });

  } catch (error: any) {
    console.error('Stripe Session Error:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2002') {
      return NextResponse.json({ 
        error: 'A booking with this order ID already exists' 
      }, { status: 409 });
    }

    // Handle Stripe errors
    if (error.type === 'StripeError') {
      return NextResponse.json({ 
        error: 'Payment processing error. Please try again.' 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      error: 'An unexpected error occurred. Please try again.' 
    }, { status: 500 });
  }
}