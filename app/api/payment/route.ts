import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createToken } from '@/lib/dpoService';
import { CreateTokenRequest } from '@/lib/types';

const prisma = new PrismaClient();

// In-memory store for request deduplication (use Redis in production)
const requestCache = new Map<string, { timestamp: number, response: any }>();
const CACHE_DURATION = 30000; // 30 seconds

const generateOrderId = () => {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `RT-${timestamp}-${randomStr}`;
};

// Create a unique request key for deduplication
const createRequestKey = (data: any) => {
  return `${data.tripId}-${data.userEmail}-${data.selectedSeats?.join(',')}-${data.totalPrice}`;
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

// Clean up expired cache entries
const cleanupCache = () => {
  const now = Date.now();
  for (const [key, value] of requestCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      requestCache.delete(key);
    }
  }
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
    
    // Create request key for deduplication
    const requestKey = createRequestKey(rawBody);
    
    // Clean up expired cache entries
    cleanupCache();
    
    // Check for duplicate request
    const cachedResponse = requestCache.get(requestKey);
    if (cachedResponse) {
      console.log('[PAYMENT-API] Returning cached response for duplicate request:', requestKey);
      return new Response(JSON.stringify(cachedResponse.response), {
        status: cachedResponse.response.success ? 200 : 400,
        headers
      });
    }
    
    console.log('[PAYMENT-API] Request received:', {
      requestKey,
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
      const errorResponse = {
        success: false,
        orderRef: 'validation-error',
        error: `Validation failed: ${validationErrors.join(', ')}`
      };
      
      // Cache validation error to prevent repeated validation
      requestCache.set(requestKey, {
        timestamp: Date.now(),
        response: errorResponse
      });
      
      return new Response(JSON.stringify(errorResponse), { status: 400, headers });
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

    // Check if trip exists and has available seats
    const trip = await prisma.trip.findUnique({ 
      where: { id: tripId },
      select: { 
        id: true, 
        routeName: true, 
        routeOrigin: true, 
        routeDestination: true,
        availableSeats: true,
        totalSeats: true
      }
    });
    
    if (!trip) {
      const errorResponse = {
        success: false,
        orderRef: 'trip-not-found',
        error: `Trip not found: ${tripId}`
      };
      
      requestCache.set(requestKey, {
        timestamp: Date.now(),
        response: errorResponse
      });
      
      return new Response(JSON.stringify(errorResponse), { status: 404, headers });
    }

    // Check seat availability
    if (trip.availableSeats < selectedSeats.length) {
      const errorResponse = {
        success: false,
        orderRef: 'insufficient-seats',
        error: `Only ${trip.availableSeats} seats available, but ${selectedSeats.length} requested`
      };
      
      requestCache.set(requestKey, {
        timestamp: Date.now(),
        response: errorResponse
      });
      
      return new Response(JSON.stringify(errorResponse), { status: 400, headers });
    }

    // Check for existing pending booking for same user/trip
    const existingBooking = await prisma.booking.findFirst({
      where: {
        tripId,
        userEmail: userEmail.trim().toLowerCase(),
        paymentStatus: { in: ['pending', 'initiated'] },
        createdAt: {
          gte: new Date(Date.now() - 15 * 60 * 1000) // Within last 15 minutes
        }
      }
    });

    if (existingBooking) {
      const errorResponse = {
        success: false,
        orderRef: 'booking-exists',
        error: 'You already have a pending booking for this trip. Please complete or cancel it first.'
      };
      
      requestCache.set(requestKey, {
        timestamp: Date.now(),
        response: errorResponse
      });
      
      return new Response(JSON.stringify(errorResponse), { status: 400, headers });
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

    // Always build payment gateway URLs from backend env
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
      backUrl,
      seatCount: selectedSeats.length
    });

    // Call DPO service
    const dpoResponse = await createToken(requestData);
    console.log('[PAYMENT-API] DPO response received:', {
      success: dpoResponse.success,
      hasToken: !!dpoResponse.transactionToken,
      hasPaymentUrl: !!dpoResponse.paymentUrl,
      error: dpoResponse.error,
      resultCode: dpoResponse.resultCode
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
        data: { 
          paymentStatus: 'failed'
        }
      });
      console.log('[PAYMENT-API] Booking marked as failed');
    }

    // Prepare response
    const response = {
      ...dpoResponse,
      orderRef: orderId,
      bookingId: booking.id
    };

    // Cache the response
    requestCache.set(requestKey, {
      timestamp: Date.now(),
      response
    });

    // Return response to client
    return new Response(JSON.stringify(response), {
      status: dpoResponse.success ? 200 : 400,
      headers
    });

  } catch (error: unknown) {
    logError('Unexpected Error', error, { bookingId });

    if (bookingId) {
      try {
        await prisma.booking.update({
          where: { id: bookingId },
          data: { 
            paymentStatus: 'failed'
          }
        });
      } catch (updateError) {
        logError('Database Error - Booking Update (Unexpected Error)', updateError, { bookingId });
      }
    }

    return new Response(JSON.stringify({
      success: false,
      orderRef: 'server-error',
      error: 'Internal server error occurred. Please try again.'
    }), {
      status: 500,
      headers
    });
  }
}