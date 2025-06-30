import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

function isValidDate(date: any): date is Date | string {
  return date && !isNaN(new Date(date).getTime());
}

function toISODateString(date: Date | string | null | undefined): string {
  if (!date || !isValidDate(date)) return "";
  try {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  } catch {
    return "";
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const departureDate = searchParams.get('departureDate');
    const returnDate = searchParams.get('returnDate');

    // Build filter conditions
    const whereConditions: any = {};
    
    if (from || to || departureDate) {
      const orConditions = [];
      
      // Outbound trip conditions
      if (from && to && departureDate) {
        orConditions.push({
          AND: [
            { routeOrigin: { equals: from, mode: 'insensitive' } },
            { routeDestination: { equals: to, mode: 'insensitive' } },
            { departureDate: { gte: new Date(departureDate + 'T00:00:00Z') } },
            { departureDate: { lt: new Date(departureDate + 'T23:59:59Z') } }
          ]
        });
      }
      
      // Return trip conditions
      if (returnDate && from && to) {
        orConditions.push({
          AND: [
            { routeOrigin: { equals: to, mode: 'insensitive' } },
            { routeDestination: { equals: from, mode: 'insensitive' } },
            { departureDate: { gte: new Date(returnDate + 'T00:00:00Z') } },
            { departureDate: { lt: new Date(returnDate + 'T23:59:59Z') } }
          ]
        });
      }
      
      if (orConditions.length > 0) {
        whereConditions.OR = orConditions;
      }
    }

    const trips = await prisma.trip.findMany({
      where: Object.keys(whereConditions).length > 0 ? whereConditions : undefined,
      include: {
        bookings: true,
        returnBookings: true,
      },
      orderBy: [
        { departureDate: 'asc' },
        { departureTime: 'asc' }
      ]
    });

    const tripsWithAvailability = trips.map(trip => {
      const allBookings = [...trip.bookings, ...trip.returnBookings];
      
      const occupiedSeats = allBookings.reduce((total, booking) => {
        return total + (booking.seats ? booking.seats.split(',').length : 0);
      }, 0);
      
      // Validate and format departure date
      let departureDateISO = "";
      if (isValidDate(trip.departureDate)) {
        departureDateISO = new Date(trip.departureDate).toISOString();
      } else {
        console.warn("Invalid departureDate for trip:", trip.id, trip.departureDate);
      }
      
      return {
        ...trip,
        availableSeats: Math.max(0, trip.totalSeats - occupiedSeats),
        departureDate: departureDateISO,
      };
    });

    return NextResponse.json(tripsWithAvailability);
  } catch (error) {
    console.error('Error fetching trips:', error);
    return NextResponse.json(
      { message: 'Failed to fetch trips', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    const tripData = {
      ...data,
      // Ensure totalSeats matches availableSeats for new trips
      totalSeats: data.totalSeats || data.availableSeats,
      // Properly format departure date
      departureDate: new Date(data.departureDate)
    };

    const newTrip = await prisma.trip.create({
      data: tripData
    });
    
    return NextResponse.json(newTrip, { status: 201 });
  } catch (error) {
    console.error('Error creating trip:', error);
    return NextResponse.json(
      { message: 'Failed to create trip', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const updatedTrip = await prisma.trip.update({
      where: { id: data.id },
      data: {
        ...data,
        departureDate: data.departureDate ? new Date(data.departureDate) : undefined,
      },
    });
    return NextResponse.json(updatedTrip);
  } catch (error) {
    console.error('Error updating trip:', error);
    return NextResponse.json(
      { message: 'Failed to update trip', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    await prisma.trip.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting trip:', error);
    return NextResponse.json(
      { message: 'Failed to delete trip', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}