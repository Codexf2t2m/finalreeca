import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, context: { params: { busId: string } }) {
  const { busId } = context.params; // Use context.params, not destructuring in the function signature
  const bookings = await prisma.booking.findMany({
    where: { tripId: busId },
    include: { agent: true, passengers: true, trip: true },
    orderBy: { createdAt: "asc" },
  });
  return Response.json({ bookings });
}