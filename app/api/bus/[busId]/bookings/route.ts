import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { busId: string } }) {
  const bookings = await prisma.booking.findMany({
    where: { tripId: params.busId },
    include: { agent: true, passengers: true, trip: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ bookings });
}