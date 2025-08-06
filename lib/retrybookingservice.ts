import { prisma } from '@/lib/prisma';

export async function createBookingWithRetry(data: any, maxRetries = 3) {
  console.log("\n===== [DB] START: CREATE BOOKING =====");
  console.log("Received booking data:", JSON.stringify(data, null, 2));
  
  const discountAmount = data.discountAmount || 0;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`Attempt ${attempt}/${maxRetries}`);
    
    try {
      const result = await prisma.$transaction(async (tx) => {
        console.log("Checking for existing booking...");
        const existing = await tx.booking.findUnique({ where: { orderId: data.orderId } });
        if (existing) {
          console.log("Booking already exists:", existing.id);
          return existing;
        }

        console.log("Creating new booking...");
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
            discountAmount: discountAmount,
            emergencyContactName: data.emergencyContact?.name || "",
            emergencyContactPhone: data.emergencyContact?.phone || "",
            addons: data.addons || null,
            agentId: data.agentId || null,
            consultantId: data.consultantId || null, // <-- ADD THIS LINE
            contactIdNumber: data.contactDetails?.idNumber || "",
          },
        });

        console.log(`Booking created: ${created.id}`);

        if (data.passengers?.length) {
          console.log(`Creating ${data.passengers.length} passengers...`);
          await tx.passenger.createMany({
            data: data.passengers.map((p: any) => ({
              bookingId: created.id,
              firstName: p.firstName,
              lastName: p.lastName,
              seatNumber: p.seatNumber,
              title: p.title,
              isReturn: p.isReturn,
              hasInfant: p.hasInfant ?? false,
              infantBirthdate: p.infantBirthdate ?? null,
              infantName: p.infantName ?? null,
              infantPassportNumber: p.infantPassportNumber ?? null,
              birthdate: p.birthdate ?? null,
              passportNumber: p.passportNumber ?? null,
              type: p.type ?? 'adult',
            })),
          });
          console.log("Passengers created successfully");
        }

        if (data.departureSeats?.length) {
          console.log("Updating departure trip seats...");
          const existingTrip = await tx.trip.findUnique({ where: { id: data.tripId } });
          await tx.trip.update({
            where: { id: data.tripId },
            data: {
              occupiedSeats: JSON.stringify([
                ...(JSON.parse(existingTrip?.occupiedSeats || "[]")),
                ...data.departureSeats
              ])
            }
          });
        }

        if (data.returnSeats?.length && data.returnTripId) {
          console.log("Updating return trip seats...");
          const returnTrip = await tx.trip.findUnique({ where: { id: data.returnTripId } });
          await tx.trip.update({
            where: { id: data.returnTripId },
            data: {
              occupiedSeats: JSON.stringify([
                ...(JSON.parse(returnTrip?.occupiedSeats || "[]")),
                ...data.returnSeats
              ])
            }
          });
        }

        const fullBooking = await tx.booking.findUnique({
          where: { orderId: data.orderId },
          include: { passengers: true },
        });

        console.log("Full booking data with passengers:", JSON.stringify(fullBooking, null, 2));
        return fullBooking;
      }, {
        maxWait: 10000,
        timeout: 20000,
        isolationLevel: 'ReadCommitted',
      });

      console.log("===== [DB] END: CREATE BOOKING SUCCESS =====\n");
      return result;
    } catch (error: any) {
      console.error(`Attempt ${attempt} failed:`, error);
      
      if (error.code === 'P2028' && attempt < maxRetries) {
        const delay = 1000 * attempt;
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(res => setTimeout(res, delay));
        continue;
      }
      
      console.error("===== [DB] END: CREATE BOOKING FAILED =====\n");
      throw error;
    }
  }
}