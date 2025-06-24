import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  const buses = await prisma.bus.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(buses);
}

export async function POST(req: Request) {
  const data = await req.json();
  // Only pick fields that exist in your schema
  const {
    serviceType,
    route,
    seats,
    fare,
    departureTime,
    durationMinutes,
    promoActive,
    serviceLeft,
    tripDate,
  } = data;
  const bus = await prisma.bus.create({
    data: {
      serviceType,
      route,
      seats,
      fare,
      departureTime,
      durationMinutes,
      promoActive,
      serviceLeft,
      tripDate,
    },
  });
  return NextResponse.json(bus);
}

export async function PUT(req: Request) {
  const data = await req.json();
  const { id, ...update } = data;
  // Only pick fields that exist in your schema
  const allowedFields = [
    "serviceType",
    "route",
    "seats",
    "fare",
    "departureTime",
    "durationMinutes",
    "promoActive",
    "serviceLeft",
    "tripDate",
  ];
  const filteredUpdate: any = {};
  for (const key of allowedFields) {
    if (key in update) filteredUpdate[key] = update[key];
  }
  const bus = await prisma.bus.update({
    where: { id },
    data: filteredUpdate,
  });
  return NextResponse.json(bus);
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  await prisma.bus.delete({ where: { id } });
  return NextResponse.json({ success: true });
}