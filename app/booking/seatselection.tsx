// SeatSelection.tsx
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { SearchData } from "@/lib/types";

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
              .filter((p: any) => p.isReturn === isReturnTrip) // isReturnTrip: true for return, false for departure
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
  }, [selectedBus.id, selectedBus.totalSeats, selectedBus.occupiedSeats]);

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

  if (isLoadingSeats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-teal-600 mx-auto mb-4 animate-spin" />
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Loading Seat Layout...</h2>
          <p className="text-muted-foreground">
            Fetching current booking information for trip 
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto my-8 px-4">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
        <div className="p-6 border-b bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="flex flex-col md:flex-row justify-between items-start">
            <div>
              <div className="font-bold text-xl text-gray-800">
                {isReturnTrip ? 'RETURN TRIP: ' : ''}
                {selectedBus.routeName || selectedBus.serviceType} - {selectedBus.routeOrigin} to {selectedBus.routeDestination}
              </div>
              <div className="text-sm text-gray-600">
                AC, Video ({selectedBus.totalSeats || 57} seats) (2+2 Configuration)
              </div>
              <div className="text-xs text-green-600 mt-1">
                Available: {seatLayout.filter(seat => seat.isAvailable).length} |
                Occupied: {seatLayout.filter(seat => !seat.isAvailable).length}
              </div>
            </div>
            <div className="mt-2 md:mt-0 text-right">
              <div className="text-sm text-gray-600 capitalize">
                {searchData.from} → {searchData.to}
              </div>
              <div className="text-sm text-gray-600">
                {format(new Date(searchData.departureDate), "dd MMM yyyy")}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 border-b bg-gray-50">
          <div className="text-center">
            <span className="text-sm text-gray-500 block">Departure</span>
            <div className="flex items-center justify-center mt-1">
              <span className="font-bold text-xl text-gray-900">{selectedBus.departureTime}</span>
            </div>
            <span className="text-xs text-gray-500">
              {format(departureDateObj, "dd MMM yyyy")}
            </span>
          </div>

          <div className="text-center">
            <span className="text-sm text-gray-500 block">Duration</span>
            <div className="flex items-center justify-center mt-1">
              <span className="font-bold text-xl text-gray-900">
                {Math.floor(durationMinutes / 60)}h {durationMinutes % 60}m
              </span>
            </div>
            <span className="text-xs text-gray-500">Non-stop journey</span>
          </div>

          <div className="text-center">
            <span className="text-sm text-gray-500 block">Arrival</span>
            <div className="flex items-center justify-center mt-1">
              <span className="font-bold text-xl text-gray-900">{arrivalTime}</span>
            </div>
            <span className="text-xs text-gray-500">{format(arrivalDateObj, "dd MMM yyyy")}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-6">
          <div className="lg:col-span-2">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Select Your Seats</h3>

            <div className="flex flex-wrap gap-4 mb-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gray-200 border-2 border-gray-300 rounded-md"></div>
                <span>Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gray-400 border-2 border-gray-500 rounded-md"></div>
                <span>Occupied</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-teal-500 border-2 border-teal-600 rounded-md"></div>
                <span>Selected</span>
              </div>
            </div>

            <div
              className="border-2 rounded-xl p-6 bg-white"
              style={{ borderColor: "rgb(243,193,39)" }} // <-- Use the amber color for the bus border
            >
              <div className="flex justify-end mb-8">
                <div className="relative">
                  <div className="w-16 h-16 bg-teal-600 rounded-lg flex items-center justify-center shadow-md">
                    <div className="text-xs text-center font-medium text-white">Driver</div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {Array.from({ length: numberOfRows }).map((_, rowIndex) => {
                  const rowNumber = rowIndex + 1;
                  const leftSeats = [`${rowNumber}A`, `${rowNumber}B`];
                  const rightSeats = [`${rowNumber}C`, `${rowNumber}D`];

                  return (
                    <div key={rowIndex} className="flex items-center justify-center gap-4">
                      <div className="w-6 text-center text-xs font-medium text-gray-500">
                        {rowNumber}
                      </div>

                      <div className="flex gap-2">
                        {leftSeats.map((seatId) => {
                          const seat = seatLayout.find((s) => s.id === seatId);
                          if (!seat) return <div key={seatId} className="w-10 h-10" />;

                          return (
                            <button
                              key={seatId}
                              onClick={() => handleSeatClick(seatId)}
                              disabled={!seat.isAvailable}
                              className={`w-10 h-10 rounded-lg text-xs font-bold flex items-center justify-center border-2 transition-all duration-200 hover:scale-105
                                ${selectedSeats.includes(seatId)
                                  ? "bg-teal-500 text-white border-teal-600 shadow-md transform scale-105"
                                  : seat.isAvailable
                                    ? "bg-gray-200 hover:bg-gray-300 border-gray-300 hover:border-gray-400 hover:shadow-sm"
                                    : "bg-gray-400 text-gray-600 cursor-not-allowed border-gray-500 opacity-60"
                                }`}
                            >
                              {seatId}
                            </button>
                          );
                        })}
                      </div>

                      <div className="w-8 border-l-2 border-dashed border-gray-300 h-8 flex items-center justify-center">
                        <div className="text-xs text-gray-400">||</div>
                      </div>

                      <div className="flex gap-2">
                        {rightSeats.map((seatId) => {
                          const seat = seatLayout.find((s) => s.id === seatId);
                          if (!seat) return <div key={seatId} className="w-10 h-10" />;

                          return (
                            <button
                              key={seatId}
                              onClick={() => handleSeatClick(seatId)}
                              disabled={!seat.isAvailable}
                              className={`w-10 h-10 rounded-lg text-xs font-bold flex items-center justify-center border-2 transition-all duration-200 hover:scale-105
                                ${selectedSeats.includes(seatId)
                                  ? "bg-teal-500 text-white border-teal-600 shadow-md transform scale-105"
                                  : seat.isAvailable
                                    ? "bg-gray-200 hover:bg-gray-300 border-gray-300 hover:border-gray-400 hover:shadow-sm"
                                    : "bg-gray-400 text-gray-600 cursor-not-allowed border-gray-500 opacity-60"
                                }`}
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

          <div className="lg:col-span-1 space-y-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Booking Summary</h3>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-700">Selected Seats:</span>
                  <span className="font-semibold text-gray-900">
                    {selectedSeats.length > 0 ? selectedSeats.join(", ") : "None"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Seat Count:</span>
                  <span className="font-semibold text-gray-900">{selectedSeats.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Price per seat:</span>
                  <span className="font-semibold text-gray-900">P {pricePerSeat.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-300 my-2"></div>
                <div className="flex justify-between text-lg">
                  <span className="font-bold text-gray-900">Total Amount:</span>
                  <span className="font-bold text-teal-600 text-xl">P {totalPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-amber-200">
                <h4 className="font-bold text-blue-700 mb-2">Important Notice</h4>
                <p className="text-sm text-blue-600">
                  Boarding and dropping points will be selected in the next step.
                  Please ensure you have your passengers' details ready.
                </p>
              </div>

              <Button
                onClick={onProceed}
                disabled={selectedSeats.length === 0}
                className="w-full h-12 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg"
              >
                {isReturnTrip 
                  ? `CONTINUE TO PASSENGER DETAILS (${selectedSeats.length} seat${selectedSeats.length !== 1 ? 's' : ''})` 
                  : searchData.isReturn 
                    ? `CONTINUE TO RETURN TRIP (${selectedSeats.length} seat${selectedSeats.length !== 1 ? 's' : ''})` 
                    : `CONTINUE TO PASSENGER DETAILS (${selectedSeats.length} seat${selectedSeats.length !== 1 ? 's' : ''})`}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}