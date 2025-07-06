import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createToken } from '@/lib/dpoService';
import { CreateTokenRequest } from '@/lib/types';

const prisma = new PrismaClient();

const generateOrderId = () => {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `RT-${timestamp}-${randomStr}`;
};

const validateInput = (data: any) => {
  const errors: string[] = [];
  
  if (!data.tripId || typeof data.tripId !== 'string') {
    errors.push('Trip ID is required');
  }
  
  if (!data.totalPrice || typeof data.totalPrice !== 'number' || data.totalPrice <= 0) {
    errors.push('Valid total price is required');
  }
  
  if (!data.userName || typeof data.userName !== 'string' || data.userName.trim().length < 2) {
    errors.push('Valid user name is required (minimum 2 characters)');
  }
  
  if (!data.userEmail || typeof data.userEmail !== 'string' || !data.userEmail.includes('@')) {
    errors.push('Valid email address is required');
  }
  
  if (!data.boardingPoint || typeof data.boardingPoint !== 'string') {
    errors.push('Boarding point is required');
  }
  
  if (!data.droppingPoint || typeof data.droppingPoint !== 'string') {
    errors.push('Dropping point is required');
  }
  
  if (!Array.isArray(data.selectedSeats) || data.selectedSeats.length === 0) {
    errors.push('At least one seat must be selected');
  }
  
  if (Array.isArray(data.selectedSeats)) {
    const invalidSeats = data.selectedSeats.filter((seat: string) => 
      typeof seat !== 'string' || !/^\d+[A-D]$/.test(seat)
    );
    if (invalidSeats.length > 0) {
      errors.push(`Invalid seat format: ${invalidSeats.join(', ')}`);
    }
  }
  
  return errors;
};

const logError = (context: string, error: unknown, additionalData?: any) => {
  let message = 'Unknown error';
  let stack = undefined;

  if (error instanceof Error) {
    message = error.message;
    stack = error.stack;
  }

  console.error(`[PAYMENT-API] ${context}:`, {
    error: message,
    stack,
    timestamp: new Date().toISOString(),
    ...additionalData
  });
};

export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept',
      'Access-Control-Max-Age': '86400'
    }
  });
}

export async function POST(request: NextRequest) {
  const headers = new Headers({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Content-Type': 'application/json'
  });

  let bookingId: string | null = null;
  
  try {
    // Parse request body
    const rawBody = await request.json();
    console.log('[PAYMENT-API] Request received:', {
      tripId: rawBody.tripId,
      totalPrice: rawBody.totalPrice,
      userName: rawBody.userName,
      userEmail: rawBody.userEmail,
      seatCount: rawBody.selectedSeats?.length,
      timestamp: new Date().toISOString()
    });

    // Validate input
    const validationErrors = validateInput(rawBody);
    if (validationErrors.length > 0) {
      return new Response(JSON.stringify({
        success: false,
        orderRef: 'validation-error',
        error: `Validation failed: ${validationErrors.join(', ')}`
      }), { status: 400, headers });
    }

    const { 
      tripId, 
      totalPrice, 
      userName, 
      userEmail, 
      boardingPoint, 
      droppingPoint, 
      selectedSeats,
      promoCode,
      discountAmount,
      userPhone,
      returnTripId,
      returnBoardingPoint,
      returnDroppingPoint
    } = rawBody;

    // Check if trip exists
    const trip = await prisma.trip.findUnique({ 
      where: { id: tripId },
      select: { id: true, routeName: true, routeOrigin: true, routeDestination: true }
    });
    
    if (!trip) {
      return new Response(JSON.stringify({
        success: false,
        orderRef: 'trip-not-found',
        error: `Trip not found: ${tripId}`
      }), { status: 404, headers });
    }

    // Generate order ID
    const orderId = generateOrderId();

    // Create booking record
    const booking = await prisma.booking.create({
      data: {
        tripId, 
        userName: userName.trim(), 
        userEmail: userEmail.trim().toLowerCase(),
        userPhone: userPhone?.trim() || null,
        seats: JSON.stringify(selectedSeats),
        seatCount: selectedSeats.length,
        totalPrice, 
        boardingPoint: boardingPoint.trim(), 
        droppingPoint: droppingPoint.trim(),
        orderId, 
        paymentStatus: 'pending',
        bookingStatus: 'confirmed',
        promoCode: promoCode?.trim() || null,
        discountAmount: discountAmount || 0
      },
    });
    
    bookingId = booking.id;
    console.log('[PAYMENT-API] Booking created:', {
      bookingId: booking.id,
      orderId,
      tripId,
      seatCount: selectedSeats.length
    });

    // Prepare payment gateway URLs
    const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const redirectUrl = `${base}/payment/success?ref=${orderId}`;
    const backUrl = `${base}/payment/cancel?ref=${orderId}`;

    const requestData: CreateTokenRequest = {
      tripId,
      orderId,
      totalPrice,
      userName: userName.trim(),
      userEmail: userEmail.trim().toLowerCase(),
      boardingPoint: boardingPoint.trim(),
      droppingPoint: droppingPoint.trim(),
      selectedSeats,
      redirectUrl,
      backUrl,
      promoCode: promoCode?.trim(),
      discountAmount: discountAmount || 0,
      returnTripId,
      returnBoardingPoint,
      returnDroppingPoint
    };

    console.log('[PAYMENT-API] Calling DPO service with:', {
      orderId,
      totalPrice,
      redirectUrl,
      backUrl
    });

    // Call DPO service
    const dpoResponse = await createToken(requestData);
    console.log('[PAYMENT-API] DPO response received:', {
      success: dpoResponse.success,
      hasToken: !!dpoResponse.transactionToken,
      hasPaymentUrl: !!dpoResponse.paymentUrl,
      error: dpoResponse.error
    });

    // Update booking with transaction token
    if (dpoResponse.success && dpoResponse.transactionToken) {
      await prisma.booking.update({
        where: { id: bookingId },
        data: { 
          transactionToken: dpoResponse.transactionToken,
          paymentStatus: 'initiated'
        }
      });
      console.log('[PAYMENT-API] Booking updated with transaction token');
    } else {
      await prisma.booking.update({
        where: { id: bookingId },
        data: { paymentStatus: 'failed' }
      });
      console.log('[PAYMENT-API] Booking marked as failed');
    }

    // Return response to client
    return new Response(JSON.stringify({
      ...dpoResponse,
      orderRef: orderId,
      bookingId: booking.id
    }), {
      status: dpoResponse.success ? 200 : 400,
      headers
    });

  } catch (error: unknown) {
    logError('Unexpected Error', error, { bookingId });

    if (bookingId) {
      try {
        await prisma.booking.update({
          where: { id: bookingId },
          data: { paymentStatus: 'failed' }
        });
      } catch (updateError) {
        logError('Database Error - Booking Update (Unexpected Error)', updateError, { bookingId });
      }
    }

    return new Response(JSON.stringify({
      success: false,
      orderRef: 'server-error',
      error: 'Internal server error occurred'
    }), {
      status: 500,
      headers
    });
  } finally {
    await prisma.$disconnect();
  }
}