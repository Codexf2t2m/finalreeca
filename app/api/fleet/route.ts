import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

function toISODateString(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}

export async function GET() {
  try {
    const trips = await prisma.trip.findMany({
      include: {
        bookings: true,
        returnBookings: true,
      },
    });

    // Calculate available seats for each trip
    const tripsWithAvailability = trips.map(trip => {
      // Combine bookings and returnBookings
      const allBookings = [...trip.bookings, ...trip.returnBookings];
      
      // Calculate total occupied seats
      const occupiedSeats = allBookings.reduce((total, booking) => {
        return total + (booking.seats ? booking.seats.split(',').length : 0);
      }, 0);
      
      return {
        ...trip,
        availableSeats: trip.totalSeats - occupiedSeats,
        departureDate: trip.departureDate.toISOString(),
      };
    });

    return NextResponse.json(tripsWithAvailability);
  } catch (error) {
    console.error('Error fetching trips:', error);
    return NextResponse.json(
      { message: 'Failed to fetch trips', error },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    const tripData = {
      ...data,
      totalSeats: data.totalSeats || data.availableSeats,
      departureDate: new Date(data.departureDate)
    };

    const newTrip = await prisma.trip.create({
      data: tripData
    });
    
    return NextResponse.json(newTrip, { status: 201 });
  } catch (error) {
    console.error('Error creating trip:', error);
    return NextResponse.json(
      { message: 'Failed to create trip', error },
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
      { message: 'Failed to update trip', error },
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
      { message: 'Failed to delete trip', error },
      { status: 500 }
    );
  }
}