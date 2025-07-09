import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { createToken } from "@/lib/dpoService";
import { CreateTokenRequest } from "@/lib/types";

const prisma = new PrismaClient();

const requestCache = new Map<string, { timestamp: number, response: any }>();
const CACHE_DURATION = 30000;

const generateOrderId = () => {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `RT-${timestamp}-${randomStr}`;
};

const createRequestKey = (data: any) => {
  return `${data.tripId}-${data.userEmail}-${data.selectedSeats?.join(',')}-${data.totalPrice}`;
};

const sanitizePassengers = (passengers: any[]) => {
  return passengers.map((p) => ({
    firstName: typeof p.firstName === 'string' ? p.firstName.trim() : '',
    lastName: typeof p.lastName === 'string' ? p.lastName.trim() : '',
    seatNumber: typeof p.seatNumber === 'string' ? p.seatNumber.trim() : '',
    title: typeof p.title === 'string' ? p.title.trim() : 'Mr', // Default to Mr
  }));
};

const validateInput = (data: any) => {
  const errors: string[] = [];
  if (!data.tripId || typeof data.tripId !== 'string') errors.push('Trip ID is required');
  if (!data.totalPrice || typeof data.totalPrice !== 'number' || data.totalPrice <= 0) errors.push('Valid total price is required');
  if (!data.userName || typeof data.userName !== 'string' || data.userName.trim().length < 2) errors.push('Valid user name is required (minimum 2 characters)');
  if (!data.userEmail || typeof data.userEmail !== 'string' || !data.userEmail.includes('@')) errors.push('Valid email address is required');
  if (!data.boardingPoint || typeof data.boardingPoint !== 'string') errors.push('Boarding point is required');
  if (!data.droppingPoint || typeof data.droppingPoint !== 'string') errors.push('Dropping point is required');
  if (!Array.isArray(data.selectedSeats) || data.selectedSeats.length === 0) errors.push('At least one seat must be selected');
  if (Array.isArray(data.selectedSeats)) {
    const invalidSeats = data.selectedSeats.filter((seat: string) =>
      typeof seat !== 'string' || !/^\d+[A-D]$/.test(seat)
    );
    if (invalidSeats.length > 0) errors.push(`Invalid seat format: ${invalidSeats.join(', ')}`);
  }
  if (!Array.isArray(data.passengers) || data.passengers.length !== data.selectedSeats.length) {
    errors.push('Passenger details must be provided for each selected seat');
  } else {
    data.passengers.forEach((p: any, idx: number) => {
      if (!p.firstName || typeof p.firstName !== 'string' || !p.firstName.trim()) errors.push(`Passenger ${idx + 1} must have first name`);
      if (!p.lastName || typeof p.lastName !== 'string' || !p.lastName.trim()) errors.push(`Passenger ${idx + 1} must have last name`);
      if (!p.seatNumber || typeof p.seatNumber !== 'string' || !p.seatNumber.trim()) errors.push(`Passenger ${idx + 1} must have a seat number`);
    });
    const seatSet = new Set(data.selectedSeats);
    const unmatched = data.passengers.filter((p: any) => !seatSet.has(p.seatNumber));
    if (unmatched.length > 0) {
      errors.push('Passenger seat numbers must match selected seats');
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
    const rawBody = await request.json();

    // Sanitize and normalize passenger data
    if (Array.isArray(rawBody.passengers)) {
      rawBody.passengers = sanitizePassengers(rawBody.passengers);
    }

    const requestKey = createRequestKey(rawBody);
    cleanupCache();

    const cachedResponse = requestCache.get(requestKey);
    if (cachedResponse) {
      return new Response(JSON.stringify(cachedResponse.response), {
        status: cachedResponse.response.success ? 200 : 400,
        headers
      });
    }

    const validationErrors = validateInput(rawBody);
    if (validationErrors.length > 0) {
      const errorResponse = {
        success: false,
        orderRef: 'validation-error',
        error: `Validation failed: ${validationErrors.join(', ')}`
      };
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
      passengers,
      promoCode,
      discountAmount,
      userPhone,
      returnTripId,
      returnBoardingPoint,
      returnDroppingPoint
    } = rawBody;

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

    const existingBooking = await prisma.booking.findFirst({
      where: {
        tripId,
        userEmail: userEmail.trim().toLowerCase(),
        paymentStatus: { in: ['pending', 'initiated'] },
        createdAt: {
          gte: new Date(Date.now() - 15 * 60 * 1000)
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

    const orderId = generateOrderId();

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
        discountAmount: discountAmount || 0,
        returnTripId: returnTripId || null,
        returnBoardingPoint: returnBoardingPoint || null,
        returnDroppingPoint: returnDroppingPoint || null,
        paymentMode: 'Credit Card',
        passengers: passengers // Store sanitized passenger data
      },
    });

    bookingId = booking.id;

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
      returnDroppingPoint,

    };

    const dpoResponse = await createToken(requestData);

    if (dpoResponse.success && dpoResponse.transactionToken) {
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          transactionToken: dpoResponse.transactionToken,
          paymentStatus: 'initiated'
        }
      });
    } else {
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          paymentStatus: 'failed'
        }
      });
    }

    const response = {
      ...dpoResponse,
      orderRef: orderId,
      bookingId: booking.id
    };

    requestCache.set(requestKey, {
      timestamp: Date.now(),
      response
    });

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