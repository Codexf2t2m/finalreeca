import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Validate ticket by booking reference and tripId (GET)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ref = searchParams.get("ref");
  const tripId = searchParams.get("tripId");

  console.log("[SCAN] Incoming QR scan:", { ref, tripId });

  if (!ref || !tripId) {
    console.log("[SCAN] Missing reference or tripId");
    return NextResponse.json({ valid: false, error: "Missing reference or tripId" }, { status: 400 });
  }

  // Find booking for this trip and reference
  const booking = await prisma.booking.findFirst({
    where: {
      orderId: ref,
      tripId: tripId,
      trip: {
        departureDate: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
    },
    include: { passengers: true, trip: true, returnTrip: true },
  });

  console.log("[SCAN] Booking found:", booking ? booking.id : "None");

  if (!booking) {
    console.log("[SCAN] No valid booking for this trip today");
    return NextResponse.json({ valid: false, error: "No valid booking for this trip today" }, { status: 404 });
  }

  return NextResponse.json({
    valid: true,
    booking: {
      ...booking,
      scanned: booking.scanned,
      lastScanned: booking.lastScanned,
    },
  });
}

// Mark ticket as scanned (POST)
export async function POST(req: NextRequest) {
  const { bookingId, scannerId } = await req.json();

  if (!bookingId) {
    return NextResponse.json({ success: false, error: "Missing bookingId" }, { status: 400 });
  }

  // Mark booking as scanned
  const booking = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      scanned: true,
      lastScanned: new Date(),
      scannerId: scannerId || null,
    },
  });

  return NextResponse.json({
    success: true,
    booking: {
      ...booking,
      scanned: booking.scanned,
      lastScanned: booking.lastScanned,
    },
  });
}

// Check in passenger (POST)
export async function checkInPassenger(req: NextRequest) {
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