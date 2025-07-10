import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const bookingId = searchParams.get("id");
  const orderId = searchParams.get("orderId");

  if (!bookingId && !orderId) {
    return NextResponse.json(
      { success: false, error: "Missing booking ID or order ID" },
      { status: 400 }
    );
  }

  try {
    let booking: any;
    const query = orderId
      ? supabase
        .from("Booking")
        .select(`
            *,
            Trip: trip_id (*),
            ReturnTrip: return_trip_id (*)
          `)
        .eq("order_id", orderId)
      : supabase
        .from("Booking")
        .select(`
            *,
            Trip: trip_id (*),
            ReturnTrip: return_trip_id (*)
          `)
        .eq("id", bookingId);

    const { data, error } = await query.single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }

    booking = data;

    // Helper to parse seat data
    const parseSeats = (seats: any): string[] => {
      if (!seats) return [];
      if (Array.isArray(seats)) return seats;
      if (typeof seats === "string") {
        try {
          return JSON.parse(seats);
        } catch {
          return seats.split(",").map((s: string) => s.trim());
        }
      }
      return [];
    };

    // Helper to parse passengers and transform to match PrintableTicket's structure
    const parsePassengers = (passengersData: any): any[] => {
      if (!passengersData) return [];
      try {
        const parsed = typeof passengersData === 'string'
          ? JSON.parse(passengersData)
          : passengersData;
        // Ensure isReturn is preserved if it exists
        return parsed.map((p: any) => ({
          ...p,
          name: `${p.firstName} ${p.lastName}`,
          seat: p.seatNumber,
          isReturn: typeof p.isReturn === 'boolean' ? p.isReturn : false,
        }));
      } catch (e) {
        console.error("Error parsing passengers:", e);
        return [];
      }
    };

    const passengers = parsePassengers(booking.passengers);

    // Build departure trip
    const departureSeats = parseSeats(booking.seats);
    const departureTrip = {
      route: booking.Trip?.route_name || "Unknown Route",
      date: booking.Trip?.departure_date || new Date().toISOString(),
      time: booking.Trip?.departure_time || "00:00",
      bus: booking.Trip?.service_type || "Standard Bus",
      boardingPoint: booking.boarding_point,
      droppingPoint: booking.dropping_point,
      seats: departureSeats,
      passengers: passengers.filter((p: any) => !p.isReturn)
    };

    // Build return trip
    const returnSeats = parseSeats(booking.return_seats);
    const returnTrip = booking.return_trip_id ? {
      route: booking.ReturnTrip?.route_name || "Unknown Route",
      date: booking.ReturnTrip?.departure_date || new Date().toISOString(),
      time: booking.ReturnTrip?.departure_time || "00:00",
      bus: booking.ReturnTrip?.service_type || "Standard Bus",
      boardingPoint: booking.return_boarding_point,
      droppingPoint: booking.return_dropping_point,
      seats: returnSeats,
      passengers: passengers.filter((p: any) => p.isReturn)
    } : undefined;

    // Format response
    const responseData = {
      id: booking.id,
      bookingRef: booking.order_id,
      userName: booking.user_name,
      userEmail: booking.user_email,
      userPhone: booking.user_phone,
      totalAmount: booking.total_price,
      paymentMethod: booking.payment_mode || "Credit Card",
      paymentStatus: booking.payment_status,
      bookingStatus: booking.booking_status,
      departureTrip,
      returnTrip,
    };

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("Booking fetch error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
