import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const agents = await prisma.agent.findMany({
    select: {
      id: true,
      name: true,
      bookings: {
        where: { agentId: { not: null } }, // Only bookings made by agents
        select: {
          id: true,
          totalPrice: true,
          paymentStatus: true,
          agentId: true,
        }
      }
    }
  });

  const sales = agents.map(agent => {
    // Only include bookings where agentId matches this agent
    const agentBookings = agent.bookings.filter(b => b.agentId === agent.id);
    const paidBookings = agentBookings.filter(b => b.paymentStatus === "paid");
    const revenue = paidBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    return {
      id: agent.id,
      name: agent.name,
      bookings: paidBookings.length,
      revenue,
      commission: revenue * 0.1 // 10% commission
    };
  });

  return NextResponse.json(sales);
}