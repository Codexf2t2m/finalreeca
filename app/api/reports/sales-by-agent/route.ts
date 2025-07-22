import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const agents = await prisma.agent.findMany({
    select: {
      id: true,
      name: true,
      bookings: {
        select: {
          id: true,
          totalPrice: true,
          paymentStatus: true
        }
      }
    }
  });

  const sales = agents.map(agent => {
    const paidBookings = agent.bookings.filter(b => b.paymentStatus === "paid");
    return {
      id: agent.id,
      name: agent.name,
      bookings: paidBookings.length,
      revenue: paidBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0)
    };
  });

  return NextResponse.json(sales);
}