import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, context: { params: { id: string } }) {
  const id = context.params.id; // No await needed!
  const bookings = await prisma.booking.findMany({
    where: { consultantId: id },
    select: {
      id: true,
      orderId: true,
      userName: true,
      userEmail: true,
      seatCount: true,
      totalPrice: true,
      trip: {
        select: {
          routeName: true,
          departureDate: true,
          departureTime: true,
        }
      }
    }
  });
  return NextResponse.json({ bookings });
}