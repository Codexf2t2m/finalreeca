import { prisma } from '@/lib/prisma';

export async function createBookingWithRetry(data: any, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await prisma.$transaction(async (tx) => {
        const existing = await tx.booking.findUnique({ where: { orderId: data.orderId } });
        if (existing) return existing;

        const created = await tx.booking.create({
          data: {
            tripId: data.tripId,
            userName: data.userName,
            userEmail: data.userEmail,
            userPhone: data.userPhone,
            seats: JSON.stringify(data.selectedSeats),
            seatCount: data.selectedSeats.length + (data.returnSeats?.length || 0),
            totalPrice: data.totalPrice,
            boardingPoint: data.boardingPoint,
            droppingPoint: data.droppingPoint,
            orderId: data.orderId,
            paymentStatus: 'pending',
            bookingStatus: 'confirmed',
            paymentMode: data.paymentMode || 'Credit Card',
            returnTripId: data.returnTripId || null,
            returnBoardingPoint: data.returnBoardingPoint || null,
            returnDroppingPoint: data.returnDroppingPoint || null,
            returnSeats: data.returnSeats?.length ? JSON.stringify(data.returnSeats) : null,
            promoCode: data.promoCode || null,
            discountAmount: data.discountAmount || 0,
            contactIdNumber: data.contactDetails?.idNumber,
          },
        });

        if (data.passengers?.length) {
          await tx.passenger.createMany({
            data: data.passengers.map((p: any) => ({
              bookingId: created.id,
              firstName: p.firstName,
              lastName: p.lastName,
              seatNumber: p.seatNumber,
              title: p.title,
              isReturn: p.isReturn, // <-- ENSURE THIS IS PRESENT
            })),
            skipDuplicates: true,
          });
        }

        const savedPassengers = await prisma.passenger.findMany({ where: { bookingId: created.id } });
        console.log("Saved passengers:", savedPassengers);

        return await tx.booking.findUnique({
          where: { orderId: data.orderId },
          include: { passengers: true },
        });
      }, {
        maxWait: 10000,
        timeout: 20000,
        isolationLevel: 'ReadCommitted',
      });
    } catch (error: any) {
      if (error.code === 'P2028' && attempt < maxRetries) {
        await new Promise(res => setTimeout(res, 1000 * attempt));
        continue;
      }
      throw error;
    }
  }
}
