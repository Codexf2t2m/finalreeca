import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { agentId: string } }) {
  const { agentId } = params;
  const bookings = await prisma.booking.findMany({
    where: { agentId },
    include: { trip: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ bookings });
}