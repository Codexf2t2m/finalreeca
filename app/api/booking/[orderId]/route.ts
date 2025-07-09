import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

interface PassengerResponse {
  name: string;
  seat: string;
  title?: string;
}

interface TripData {
  route: string;
  date: string;
  time: string;
  bus: string;
  boardingPoint: string;
  droppingPoint: string;
  seats: string[];
}

interface BookingResponse {
  id: string;
  bookingRef: string;
  userName: string;
  userEmail: string;
  userPhone: string | null;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  bookingStatus: string;
  passengerList: PassengerResponse[];
  departureTrip: TripData | null;
  returnTrip: TripData | null;
}

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
    let passengers: PassengerResponse[] = [];

    if (orderId) {
      // Fetch booking by order ID
      const { data: bookingData, error: bookingError } = await supabase
        .from("Booking")
        .select(
          `*,
          Trip!trip_id (
            route_name,
            departure_date,
            departure_time,
            service_type,
            boarding_point,
            dropping_point,
            occupied_seats
          ),
          ReturnTrip:Trip!return_trip_id (
            route_name,
            departure_date,
            departure_time,
            service_type,
            boarding_point,
            dropping_point,
            occupied_seats
          )`
        )
        .eq("order_id", orderId)
        .single();

      if (bookingError) {
        return NextResponse.json(
          { success: false, error: bookingError.message },
          { status: 404 }
        );
      }

      booking = bookingData;
      passengers = booking.passengers || []; // Get passengers directly from booking
    } else {
      // Fetch booking by ID
      const { data: bookingData, error: bookingError } = await supabase
        .from("Booking")
        .select("*")
        .eq("id", bookingId)
        .single();

      if (bookingError) {
        return NextResponse.json(
          { success: false, error: bookingError.message },
          { status: 404 }
        );
      }

      booking = bookingData;
      passengers = booking.passengers || []; // Get passengers directly from booking
    }

    // Helper to parse seat data
    const parseSeats = (seats: any): string[] => {
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

    // Build departure trip
    const departureTrip: TripData | null = booking.Trip
      ? {
          route: booking.Trip.route_name,
          date: new Date(booking.Trip.departure_date).toISOString(),
          time: booking.Trip.departure_time,
          bus: booking.Trip.service_type || booking.Trip.route_name,
          boardingPoint: booking.boarding_point,
          droppingPoint: booking.dropping_point,
          seats: parseSeats(booking.Trip.occupied_seats || []),
        }
      : null;

    // Build return trip
    const returnTrip: TripData | null = booking.ReturnTrip
      ? {
          route: booking.ReturnTrip.route_name,
          date: new Date(booking.ReturnTrip.departure_date).toISOString(),
          time: booking.ReturnTrip.departure_time,
          bus: booking.ReturnTrip.service_type || booking.ReturnTrip.route_name,
          boardingPoint: booking.return_boarding_point,
          droppingPoint: booking.return_dropping_point,
          seats: parseSeats(booking.ReturnTrip.occupied_seats || []),
        }
      : null;

    // Format response
    const responseData: BookingResponse = {
      id: booking.id,
      bookingRef: booking.order_id,
      userName: booking.user_name,
      userEmail: booking.user_email,
      userPhone: booking.user_phone,
      totalAmount: booking.total_price,
      paymentMethod: booking.payment_mode || "Credit Card",
      paymentStatus: booking.payment_status,
      bookingStatus: booking.booking_status,
      passengerList: passengers,
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