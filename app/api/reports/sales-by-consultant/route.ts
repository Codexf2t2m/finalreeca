import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const consultants = await prisma.consultant.findMany({
    select: {
      id: true,
      name: true,
      bookings: {
        where: { consultantId: { not: null } },
        select: {
          id: true,
          totalPrice: true,
          paymentStatus: true,
          consultantId: true,
          seatCount: true,
          trip: { select: { fare: true } }
        }
      }
    }
  });

  const sales = consultants.map(consultant => {
    const consultantBookings = consultant.bookings.filter(b => b.consultantId === consultant.id);
    const paidBookings = consultantBookings.filter(b => b.paymentStatus === "paid");
    const revenue = paidBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    const commission = paidBookings.reduce((sum, b) => {
      const original = b.totalPrice ? b.totalPrice / 0.9 : 0;
      const commissionForBooking = original - (b.totalPrice || 0);
      return sum + commissionForBooking;
    }, 0);
    return {
      id: consultant.id,
      name: consultant.name,
      bookings: paidBookings.length,
      revenue,
      commission
    };
  });

  return NextResponse.json(sales);
}