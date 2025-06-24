import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: NextRequest) {
  try {
    const { tripId, seats, userName, userEmail, boardingPoint, droppingPoint, totalPrice, orderId } = await req.json();

    // 1. Save booking
    const { data: booking, error: bookingError } = await supabase
      .from("Booking")
      .insert([
        {
          tripId,
          seats: seats.join(","), // Store as comma-separated string
          userName,
          userEmail,
          boardingPoint,
          droppingPoint,
          totalPrice,
          orderId,
        },
      ])
      .select()
      .single();

    if (bookingError) throw bookingError;

    // 2. Update trip: mark seats as occupied and decrement availableSeats
    // Fetch current occupiedSeats
    const { data: trip, error: tripError } = await supabase
      .from("Trip")
      .select("occupiedSeats, availableSeats")
      .eq("id", tripId)
      .single();

    if (tripError) throw tripError;

    let occupiedSeats: string[] = [];
    if (trip?.occupiedSeats) {
      occupiedSeats = trip.occupiedSeats.split(",");
    }
    const newOccupiedSeats = [...occupiedSeats, ...seats].join(",");
    const newAvailableSeats = (trip.availableSeats || 0) - seats.length;

    const { error: updateError } = await supabase
      .from("Trip")
      .update({
        availableSeats: newAvailableSeats,
        occupiedSeats: newOccupiedSeats,
      })
      .eq("id", tripId);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, booking });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}