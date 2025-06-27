import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

// Initialize Prisma Client
const prisma = new PrismaClient();

// Handle GET requests to fetch all buses
export async function GET() {
  try {
    const buses = await prisma.bus.findMany(); // Fetch all bus records
    return NextResponse.json(buses); // Send them back as JSON with a 200 OK status
  } catch (error: any) {
    // Log the error for debugging purposes on the server
    console.error('Error fetching buses from database:', error);
    // Send a 500 Internal Server Error response to the client
    return NextResponse.json(
      { message: 'Failed to fetch buses', error: error.message },
      { status: 500 }
    );
  }
}

// Handle POST requests to create a new bus
export async function POST(request: Request) {
  try {
    const { serviceType, route, seats, fare, departureTime, durationMinutes, promoActive, serviceLeft } =
      await request.json();
    const newBus = await prisma.bus.create({
      data: {
        serviceType,
        route,
        seats: parseInt(seats), // Ensure seats is parsed to an integer
        fare: parseInt(fare), // Ensure fare is parsed to an integer
        departureTime,
        durationMinutes: parseInt(durationMinutes), // Ensure durationMinutes is parsed
        promoActive,
        serviceLeft,
      },
    });
    return NextResponse.json(newBus, { status: 201 }); // Send back the created bus with a 201 Created status
  } catch (error: any) {
    console.error('Error creating bus:', error);
    return NextResponse.json(
      { message: 'Failed to create bus', error: error.message },
      { status: 500 }
    );
  }
}
