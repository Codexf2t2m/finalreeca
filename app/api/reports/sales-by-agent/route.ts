import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const agents = await prisma.agent.findMany({
    select: {
      id: true,
      name: true,
      bookings: {
        where: { agentId: { not: null } },
        select: {
          id: true,
          totalPrice: true,
          paymentStatus: true,
          agentId: true,
          seatCount: true,
          trip: { select: { fare: true } }
        }
      }
    }
  });

  const sales = agents.map(agent => {
    const agentBookings = agent.bookings.filter(b => b.agentId === agent.id);
    const paidBookings = agentBookings.filter(b => b.paymentStatus === "paid");
    const revenue = paidBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    const commission = paidBookings.reduce((sum, b) => {
      const original = b.totalPrice ? b.totalPrice / 0.9 : 0;
      const commissionForBooking = original - (b.totalPrice || 0);
      console.log(`Booking: ${b.id}, Original: ${original}, Paid: ${b.totalPrice}, Commission: ${commissionForBooking}`);
      return sum + commissionForBooking;
    }, 0);
    return {
      id: agent.id,
      name: agent.name,
      bookings: paidBookings.length,
      revenue,
      commission
    };
  });

  return NextResponse.json(sales);
}