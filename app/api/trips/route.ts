import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  const trips = await prisma.trip.findMany({
    include: { bus: true },
    orderBy: { date: "asc" },
  });
  return NextResponse.json(trips);
}