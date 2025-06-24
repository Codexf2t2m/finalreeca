import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { addDays, startOfDay, setHours, setMinutes } from "date-fns";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const { days = 21 } = await req.json();
  const buses = await prisma.bus.findMany();
  const today = startOfDay(new Date());

  for (const bus of buses) {
    for (let i = 0; i < days; i++) {
      const tripBaseDate = addDays(today, i);

      // Combine tripBaseDate with bus.departureTime (e.g. "07:00")
      const [depHour, depMin] = bus.departureTime.split(":").map(Number);
      const departureDateTime = setMinutes(setHours(tripBaseDate, depHour), depMin);

      // Check if trip already exists for this bus and date
      const exists = await prisma.trip.findFirst({
        where: {
          busId: bus.id,
          date: departureDateTime,
        },
      });

      if (!exists) {
        await prisma.trip.create({
          data: {
            busId: bus.id,
            date: departureDateTime,
            availableSeats: bus.seats,
            routeOrigin: bus.route.split("→")[0]?.trim(),
            routeDestination: bus.route.split("→")[1]?.trim(),
            departureTime: departureDateTime,
          },
        });
      }
    }
  }

  return NextResponse.json({ success: true });
}