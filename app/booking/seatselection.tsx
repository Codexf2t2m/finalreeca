// SeatSelection.tsx
'use client'
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Loader2, Bus, Users, Clock, MapPin } from "lucide-react";
import { SearchData } from "@/lib/types";
import Image from "next/image";

interface Seat {
  id: string;
  number: string;
  isAvailable: boolean;
  isSelected: boolean;
  row: number;
  position: string;
  side: string;
  seatIndex: number;
}

interface SelectedBus {
  id: string;
  serviceType?: string;
  routeName?: string;
  routeOrigin?: string;
  routeDestination?: string;
  departureDate?: Date;
  departureTime: string;
  totalSeats?: number;
  availableSeats?: number;
  occupiedSeats?: string | null;
  fare: number;
  promoActive?: boolean;
  promoPrice?: number;
  durationMinutes?: number;
}

interface SeatSelectionProps {
  selectedBus: SelectedBus;
  onSeatSelect: (seatId: string) => void;
  selectedSeats: string[];
  onProceed: () => void;
  searchData: SearchData;
  isReturnTrip?: boolean;
  maxSelectableSeats?: number;
}

// Define color variables based on company colors
const colors = {
  primary: 'rgb(0,153,153)', // Teal
  secondary: '#FDBE00', // Gold
  accent: '#958c55', // Olive
  muted: '#fdbe00a4', // Light gray
  dark: '#1a1a1a', // Dark gray
  light: '#ffffff', // White
  destructive: '#ef4444', // Red (kept for errors)
  lightYellow: '#FDBE00', // Adjusted yellow for occupied seats
};

const morningBusImg = "/images/nbg.png";
const afternoonBusImg = "/images/nbg.png";

const fetchTripBookings = async (tripId: string) => {
  try {
    const response = await fetch(`/api/trips/${tripId}/bookings`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(`Failed to fetch bookings: ${errorData.message || 'Unknown error'}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching trip bookings:', error instanceof Error ? error.message : 'Unknown error');
    return { bookings: [], trip: null };
  }
};

const generateSeatLayoutWithBookings = (
  totalSeats = 63,
  occupiedSeats: string[] = [],
  bookedSeats: string[] = []
): Seat[] => {
  const seats: Seat[] = [];
  const totalRows = Math.ceil(totalSeats / 4);
  const unavailableSeats = new Set([...occupiedSeats, ...bookedSeats]);
  let seatIndex = 0;

  for (let row = 1; row <= totalRows && seatIndex < totalSeats; row++) {
    const positions = ['A', 'B', 'C', 'D'];
    const sides = ['left', 'left', 'right', 'right'];

    for (let i = 0; i < 4 && seatIndex < totalSeats; i++) {
      const seatId = `${row}${positions[i]}`;
      const isAvailable = !unavailableSeats.has(seatId);

      seats.push({
        id: seatId,
        number: seatId,
        isAvailable,
        isSelected: false,
        row,
        position: positions[i],
        side: sides[i],
        seatIndex,
      });
      seatIndex++;
    }
  }
  return seats;
};

export default function SeatSelection({
  selectedBus,
  onSeatSelect,
  selectedSeats,
  onProceed,
  searchData,
  isReturnTrip = false,
  maxSelectableSeats = 60,
}: SeatSelectionProps) {
  const [seatLayout, setSeatLayout] = useState<Seat[]>([]);
  const [isLoadingSeats, setIsLoadingSeats] = useState(true);

  useEffect(() => {
    const loadSeatData = async () => {
      setIsLoadingSeats(true);
      try {
        const { bookings } = await fetchTripBookings(selectedBus.id);
        const bookedSeats: string[] = bookings
          .filter((booking: any) => booking.bookingStatus === 'confirmed' && booking.paymentStatus === 'paid')
          .flatMap((booking: any) =>
            booking.passengers
              .filter((p: any) => p.isReturn === isReturnTrip)
              .map((p: any) => p.seatNumber)
          );

        let occupiedSeats: string[] = [];
        if (selectedBus.occupiedSeats) {
          try {
            occupiedSeats = JSON.parse(selectedBus.occupiedSeats);
          } catch (e) {
            console.error('Error parsing occupied seats:', e);
          }
        }

        const layout = generateSeatLayoutWithBookings(
          selectedBus.totalSeats || 57,
          occupiedSeats,
          bookedSeats
        );
        setSeatLayout(layout);
      } catch (error) {
        console.error('Error loading seat data:', error);
      } finally {
        setIsLoadingSeats(false);
      }
    };

    loadSeatData();
  }, [selectedBus.id, selectedBus.totalSeats, selectedBus.occupiedSeats, isReturnTrip]);

  const handleSeatClick = (seatId: string) => {
    const isSelected = selectedSeats.includes(seatId);
    if (!isSelected && selectedSeats.length >= maxSelectableSeats) return;

    setSeatLayout(prev => prev.map(seat =>
      seat.id === seatId
        ? { ...seat, isSelected: !seat.isSelected }
        : seat
    ));
    onSeatSelect(seatId);
  };

  const timeString = selectedBus.departureTime || "00:00";
  const [hourStr, minStr] = timeString.split(':');
  const depHour = parseInt(hourStr, 10) || 0;
  const depMin = parseInt(minStr, 10) || 0;

  const departureDateObj = new Date(selectedBus.departureDate || searchData.departureDate);
  departureDateObj.setHours(depHour, depMin, 0, 0);

  const durationMinutes = Number(selectedBus.durationMinutes || 0);
  const arrivalDateObj = new Date(departureDateObj.getTime() + durationMinutes * 60000);
  const arrivalTime = `${arrivalDateObj.getHours().toString().padStart(2, "0")}:${arrivalDateObj.getMinutes().toString().padStart(2, "0")}`;

  let pricePerSeat = selectedBus.fare || 0;
  if (selectedBus.promoActive && selectedSeats.length >= 2) {
    pricePerSeat = selectedBus.promoPrice || pricePerSeat;
  }

  const totalPrice = pricePerSeat * selectedSeats.length;
  const numberOfRows = Math.ceil((selectedBus.totalSeats || 63) / 4);

  // Determine bus image based on service type
  const isMorning = selectedBus.serviceType?.includes("Morning");
  const busImg = isMorning ? morningBusImg : afternoonBusImg;

  if (isLoadingSeats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white rounded-lg p-8 shadow-lg">
          <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin" style={{ color: colors.primary }} />
          <h2 className="text-2xl font-bold mb-4" style={{ color: colors.dark }}>Loading Seat Layout...</h2>
          <p className="text-gray-600">
            Fetching current booking information for trip
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto my-4 md:my-8 px-4">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
        {/* Header Section */}
        <div className="p-4 md:p-6 border-b" style={{ backgroundColor: colors.primary }}>
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div className="flex-1">
              <div className="flex items-start gap-3">
                {/* Bus Image - Small on mobile, larger on desktop */}
                <div className="w-12 h-8 md:w-20 md:h-14 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                  <Image
                    src={busImg}
                    alt={`${selectedBus.serviceType} bus`}
                    width={80}
                    height={56}
                    className="object-contain"
                    priority={true}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-lg md:text-xl text-white">
                    {isReturnTrip ? 'RETURN TRIP: ' : ''}
                    {selectedBus.routeName || selectedBus.serviceType}
                  </div>
                  <div className="text-sm md:text-base font-medium text-white">
                    {selectedBus.routeOrigin} → {selectedBus.routeDestination}
                  </div>
                  <div className="text-xs md:text-sm text-white mt-1">
                    AC, Video ({selectedBus.totalSeats || 57} seats) • 2+2 Configuration
                  </div>
                  <div className="text-xs text-green-200 mt-1">
                    Available: {seatLayout.filter(seat => seat.isAvailable).length} |
                    Occupied: {seatLayout.filter(seat => !seat.isAvailable).length}
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-white capitalize">
                {searchData.from} → {searchData.to}
              </div>
              <div className="text-sm text-white">
                {format(new Date(searchData.departureDate), "dd MMM yyyy")}
              </div>
            </div>
          </div>
        </div>

        {/* Journey Info Cards */}
        <div className="p-4 md:p-6 border-b bg-gray-50">
          {/* Mobile Layout */}
          <div className="md:hidden space-y-3">
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="flex items-center justify-center mb-1">
                    <Clock className="w-4 h-4 mr-1" style={{ color: colors.primary }} />
                    <span className="text-xs text-gray-500">Departure</span>
                  </div>
                  <div className="font-bold text-lg" style={{ color: colors.dark }}>
                    {selectedBus.departureTime}
                  </div>
                  <div className="text-xs text-gray-500">
                    {format(departureDateObj, "dd MMM")}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-center mb-1">
                    <Bus className="w-4 h-4 mr-1" style={{ color: colors.secondary }} />
                    <span className="text-xs text-gray-500">Duration</span>
                  </div>
                  <div className="font-bold text-lg" style={{ color: colors.dark }}>
                    {Math.floor(durationMinutes / 60)}h {durationMinutes % 60}m
                  </div>
                  <div className="text-xs text-gray-500">Non-stop</div>
                </div>
                <div>
                  <div className="flex items-center justify-center mb-1">
                    <MapPin className="w-4 h-4 mr-1" style={{ color: colors.primary }} />
                    <span className="text-xs text-gray-500">Arrival</span>
                  </div>
                  <div className="font-bold text-lg" style={{ color: colors.dark }}>
                    {arrivalTime}
                  </div>
                  <div className="text-xs text-gray-500">
                    {format(arrivalDateObj, "dd MMM")}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden md:grid grid-cols-3 gap-6">
            <div className="text-center">
              <span className="text-sm text-gray-500 block">Departure</span>
              <div className="flex items-center justify-center mt-1">
                <span className="font-bold text-xl" style={{ color: colors.dark }}>
                  {selectedBus.departureTime}
                </span>
              </div>
              <span className="text-xs text-gray-500">
                {format(departureDateObj, "dd MMM yyyy")}
              </span>
            </div>
            <div className="text-center">
              <span className="text-sm text-gray-500 block">Duration</span>
              <div className="flex items-center justify-center mt-1">
                <span className="font-bold text-xl" style={{ color: colors.dark }}>
                  {Math.floor(durationMinutes / 60)}h {durationMinutes % 60}m
                </span>
              </div>
              <span className="text-xs text-gray-500">Non-stop journey</span>
            </div>
            <div className="text-center">
              <span className="text-sm text-gray-500 block">Arrival</span>
              <div className="flex items-center justify-center mt-1">
                <span className="font-bold text-xl" style={{ color: colors.dark }}>
                  {arrivalTime}
                </span>
              </div>
              <span className="text-xs text-gray-500">{format(arrivalDateObj, "dd MMM yyyy")}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8 p-4 lg:p-6">
          <div className="lg:col-span-2">
            <h3 className="text-lg font-bold mb-4" style={{ color: colors.dark }}>Select Your Seats</h3>
            {/* Legend */}
            <div className="flex flex-wrap gap-3 md:gap-4 mb-4 md:mb-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 md:w-6 md:h-6 bg-gray-200 border-2 border-gray-300 rounded-md"></div>
                <span className="text-xs md:text-sm">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 md:w-6 md:h-6 rounded-md" style={{ backgroundColor: colors.lightYellow, borderColor: colors.lightYellow }}></div>
                <span className="text-xs md:text-sm">Occupied</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 md:w-6 md:h-6 border-2 rounded-md" style={{ backgroundColor: colors.primary, borderColor: colors.primary }}></div>
                <span className="text-xs md:text-sm">Selected</span>
              </div>
            </div>

            {/* Bus Layout */}
            <div className="border-2 rounded-xl p-3 md:p-6 bg-white shadow-sm" style={{ borderColor: colors.secondary }}>
              {/* Driver Section */}
              <div className="flex justify-end mb-4 md:mb-8">
                <div className="relative">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-lg flex items-center justify-center shadow-md" style={{ backgroundColor: colors.primary }}>
                    <div className="text-xs text-center font-medium text-white">Driver</div>
                  </div>
                </div>
              </div>

              {/* Seat Grid */}
              <div className="space-y-2 md:space-y-3">
                {Array.from({ length: numberOfRows }).map((_, rowIndex) => {
                  const rowNumber = rowIndex + 1;
                  const leftSeats = [`${rowNumber}A`, `${rowNumber}B`];
                  const rightSeats = [`${rowNumber}C`, `${rowNumber}D`];

                  return (
                    <div key={rowIndex} className="flex items-center justify-center gap-2 md:gap-4">
                      <div className="w-4 md:w-6 text-center text-xs font-medium text-gray-500">
                        {rowNumber}
                      </div>
                      <div className="flex gap-1 md:gap-2">
                        {leftSeats.map((seatId) => {
                          const seat = seatLayout.find((s) => s.id === seatId);
                          if (!seat) return <div key={seatId} className="w-8 h-8 md:w-10 md:h-10" />;

                          return (
                            <button
                              key={seatId}
                              onClick={() => handleSeatClick(seatId)}
                              disabled={!seat.isAvailable}
                              className={`w-8 h-8 md:w-10 md:h-10 rounded-lg text-xs font-bold flex items-center justify-center border-2 transition-all duration-200 hover:scale-105
                                ${selectedSeats.includes(seatId)
                                  ? "text-white shadow-md transform scale-105"
                                  : seat.isAvailable
                                    ? "bg-gray-200 hover:bg-gray-300 border-gray-300 hover:border-gray-400 hover:shadow-sm"
                                    : "text-gray-600 cursor-not-allowed border-gray-500 opacity-60"
                                }`}
                              style={selectedSeats.includes(seatId) ? {
                                backgroundColor: colors.primary,
                                borderColor: colors.primary
                              } : !seat.isAvailable ? {
                                backgroundColor: colors.lightYellow,
                                borderColor: colors.lightYellow
                              } : {}}
                            >
                              {seatId}
                            </button>
                          );
                        })}
                      </div>
                      <div className="w-6 md:w-8 border-l-2 border-dashed border-gray-300 h-6 md:h-8 flex items-center justify-center">
                        <div className="text-xs text-gray-400">||</div>
                      </div>
                      <div className="flex gap-1 md:gap-2">
                        {rightSeats.map((seatId) => {
                          const seat = seatLayout.find((s) => s.id === seatId);
                          if (!seat) return <div key={seatId} className="w-8 h-8 md:w-10 md:h-10" />;

                          return (
                            <button
                              key={seatId}
                              onClick={() => handleSeatClick(seatId)}
                              disabled={!seat.isAvailable}
                              className={`w-8 h-8 md:w-10 md:h-10 rounded-lg text-xs font-bold flex items-center justify-center border-2 transition-all duration-200 hover:scale-105
                                ${selectedSeats.includes(seatId)
                                  ? "text-white shadow-md transform scale-105"
                                  : seat.isAvailable
                                    ? "bg-gray-200 hover:bg-gray-300 border-gray-300 hover:border-gray-400 hover:shadow-sm"
                                    : "text-gray-600 cursor-not-allowed border-gray-500 opacity-60"
                                }`}
                              style={selectedSeats.includes(seatId) ? {
                                backgroundColor: colors.primary,
                                borderColor: colors.primary
                              } : !seat.isAvailable ? {
                                backgroundColor: colors.lightYellow,
                                borderColor: colors.lightYellow
                              } : {}}
                            >
                              {seatId}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Booking Summary */}
          <div className="lg:col-span-1 space-y-4 md:space-y-6">
            <h3 className="text-lg font-bold mb-4" style={{ color: colors.dark }}>Booking Summary</h3>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-gray-700">Selected Seats:</span>
                  <span className="font-semibold text-right" style={{ color: colors.dark }}>
                    {selectedSeats.length > 0 ? selectedSeats.join(", ") : "None"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    Seat Count:
                  </span>
                  <span className="font-semibold" style={{ color: colors.dark }}>{selectedSeats.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Price per seat:</span>
                  <span className="font-semibold" style={{ color: colors.dark }}>P {pricePerSeat.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-300 my-2"></div>
                <div className="flex justify-between text-lg">
                  <span className="font-bold" style={{ color: colors.dark }}>Total Amount:</span>
                  <span className="font-bold text-xl" style={{ color: colors.primary }}>P {totalPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="p-4 rounded-lg border" style={{ backgroundColor: `${colors.secondary}15`, borderColor: `${colors.secondary}50` }}>
                <h4 className="font-bold mb-2" style={{ color: colors.accent }}>Important Notice</h4>
                <p className="text-sm text-gray-700">
                  Boarding and dropping points will be selected in the next step.
                  Please ensure you have your passengers' details ready.
                </p>
              </div>
              <Button
                onClick={onProceed}
                disabled={selectedSeats.length === 0}
                className="w-full h-12 text-white font-semibold rounded-lg transition-colors"
                style={{ backgroundColor: colors.primary }}
              >
                Proceed
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
