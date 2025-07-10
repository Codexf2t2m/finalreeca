// app/api/booking/[orderId]/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Fix API route signature for Next.js App Router (await params)
export async function GET(request: Request, context: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await context.params;

  if (!orderId) {
    return NextResponse.json(
      { success: false, error: "Missing order ID" },
      { status: 400 }
    );
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { orderId },
      include: {
        passengers: true,
        trip: true,
        returnTrip: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    // Parse seats and returnSeats
    const allSeats = booking.seats ? JSON.parse(booking.seats) : [];
    const returnSeats = booking.returnSeats ? JSON.parse(booking.returnSeats) : [];
    // Departure seats: allSeats not in returnSeats
    const departureSeats = allSeats.filter((seat: string) => !returnSeats.includes(seat));
    // Return seats: only those in returnSeats
    const onlyReturnSeats = returnSeats;

    // Map to PrintableTicket format
    const departureTrip = {
      route: booking.trip.routeName,
      date: booking.trip.departureDate,
      time: booking.trip.departureTime,
      bus: booking.trip.serviceType,
      boardingPoint: booking.boardingPoint,
      droppingPoint: booking.droppingPoint,
      seats: departureSeats,
      passengers: booking.passengers
        .filter(p => !p.isReturn)
        .map(p => ({
          name: `${p.firstName} ${p.lastName}`,
          seat: p.seatNumber,
          title: p.title,
          isReturn: p.isReturn,
        })),
    };

    const returnTrip = booking.returnTrip
      ? {
          route: booking.returnTrip.routeName,
          date: booking.returnTrip.departureDate,
          time: booking.returnTrip.departureTime,
          bus: booking.returnTrip.serviceType,
          boardingPoint: booking.returnBoardingPoint,
          droppingPoint: booking.returnDroppingPoint,
          seats: onlyReturnSeats,
          passengers: booking.passengers
            .filter(p => p.isReturn)
            .map(p => ({
              name: `${p.firstName} ${p.lastName}`,
              seat: p.seatNumber,
              title: p.title,
              isReturn: p.isReturn,
            })),
        }
      : undefined;

    return NextResponse.json({
      bookingRef: booking.orderId,
      userName: booking.userName,
      userEmail: booking.userEmail,
      userPhone: booking.userPhone,
      totalAmount: booking.totalPrice,
      paymentMethod: booking.paymentMode,
      paymentStatus: booking.paymentStatus,
      bookingStatus: booking.bookingStatus,
      departureTrip,
      returnTrip,
    });
  } catch (error: any) {
    console.error("Booking fetch error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}