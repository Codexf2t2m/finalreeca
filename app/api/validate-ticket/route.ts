import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { bookingRef, seatNumber } = await req.json();

  // Find today's trip
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  const booking = await prisma.booking.findFirst({
    where: {
      orderId: bookingRef,
      trip: {
        departureDate: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
    },
    include: { passengers: true, trip: true, returnTrip: true },
  });

  if (!booking) {
    return NextResponse.json({ valid: false, error: "No valid trip for today" }, { status: 404 });
  }

  // Find passenger for seat
  const passenger = booking.passengers.find(p => p.seatNumber === seatNumber);
  if (!passenger) {
    return NextResponse.json({ valid: false, error: "Passenger not found" }, { status: 404 });
  }

  // Mark as boarded
  await prisma.passenger.update({
    where: { id: passenger.id },
    data: { boarded: true },
  });

  return NextResponse.json({ valid: true, passenger });
}