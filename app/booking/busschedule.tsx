// src/components/booking/BusSchedules.tsx
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { format, addDays } from "date-fns";
import Image from "next/image";
import { BoardingPoint, SearchData } from "@/lib/types";

const morningBusImg = "/images/scania-irizar-vip.png";
const afternoonBusImg = "/images/scania-irizar-vip.png";

interface BusSchedulesProps {
  searchData: SearchData;
  onSelectBus: (bus: any) => void;
  boardingPoints: Record<string, BoardingPoint[]>;
}

const normalize = (str: string) => (str || "").toLowerCase().replace(/\s+/g, "");

export default function BusSchedules({
  searchData,
  onSelectBus,
  boardingPoints,
}: BusSchedulesProps) {
  const [selectedDay, setSelectedDay] = useState(0);
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = searchData.departureDate
      ? addDays(new Date(searchData.departureDate), i)
      : addDays(new Date(), i);
    return {
      date,
      dayName: format(date, "EEE"),
      dayNumber: format(date, "dd"),
      month: format(date, "MMM"),
    };
  });

  useEffect(() => {
    async function fetchTrips() {
      setLoading(true);
      const res = await fetch("/api/trips");
      const data = await res.json();
      setTrips(data);
      setLoading(false);

      // Debug: log all trips from API
      console.log("Trips from API:", data);
    }
    fetchTrips();
  }, [searchData]);

  // Debug: log search values
  const selectedDate = days[selectedDay].date;
  const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
  console.log("searchData.from:", searchData.from, "searchData.to:", searchData.to, "selectedDateStr:", selectedDateStr);

  // Filter trips for selected day, route, and direction
  const filteredTrips = trips.filter((trip: any) => {
    // Debug: log what is being compared for each trip
    console.log(
      "Comparing trip:",
      "routeOrigin:", trip.routeOrigin,
      "routeDestination:", trip.routeDestination,
      "tripDate:", format(new Date(trip.date), "yyyy-MM-dd")
    );
    console.log(
      "Comparing normalized:",
      "trip.routeOrigin:", normalize(trip.routeOrigin),
      "searchData.from:", normalize(searchData.from),
      "trip.routeDestination:", normalize(trip.routeDestination),
      "searchData.to:", normalize(searchData.to),
      "trip.date:", format(new Date(trip.date), "yyyy-MM-dd"),
      "selectedDateStr:", selectedDateStr
    );
    const routeMatch =
      normalize(trip.routeOrigin) === normalize(searchData.from) &&
      normalize(trip.routeDestination) === normalize(searchData.to);
    const dateMatch = format(new Date(trip.date), "yyyy-MM-dd") === selectedDateStr;
    // Debug: log match result
    console.log(
      "Result for this trip:",
      "routeMatch:", routeMatch,
      "dateMatch:", dateMatch
    );
    return routeMatch && dateMatch;
  });

  if (!searchData) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">Please search for available buses.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto mt-8">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
        <div className="p-6 border-b bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-800 capitalize">
                {searchData.from} → {searchData.to}
              </h2>
              <p className="text-sm text-gray-600">
                {searchData.departureDate ? format(searchData.departureDate, "EEEE, MMMM do, yyyy") : ""}
              </p>
            </div>
            {searchData.returnDate && (
              <div className="mt-2 md:mt-0">
                <h2 className="text-xl font-bold text-gray-800 capitalize">
                  {searchData.to} → {searchData.from}
                </h2>
                <p className="text-sm text-gray-600">{format(searchData.returnDate, "EEEE, MMMM do, yyyy")}</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex overflow-x-auto border-b bg-gray-50">
          {days.map((day, index) => (
            <button
              key={index}
              onClick={() => setSelectedDay(index)}
              className={`flex-shrink-0 py-4 px-6 text-center focus:outline-none transition-colors ${
                selectedDay === index
                  ? "bg-teal-600 text-white font-medium shadow-md"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
            >
              <div className="text-sm">{day.dayName}</div>
              <div className="text-lg font-semibold">{day.dayNumber}</div>
              <div className="text-xs opacity-75">{day.month}</div>
            </button>
          ))}
        </div>

        <div className="divide-y">
          <div className="grid grid-cols-6 gap-4 p-4 bg-gray-100 text-sm font-semibold text-gray-700">
            <div className="col-span-2">Bus Details</div>
            <div>Departure</div>
            <div>Duration</div>
            <div>Arrival</div>
            <div className="text-right">Fare & Action</div>
          </div>

          {loading ? (
            <div className="p-8 text-center col-span-6">Loading trips...</div>
          ) : filteredTrips.length === 0 ? (
            <div className="p-8 text-center col-span-6 text-gray-400">No trips found for this day.</div>
          ) : (
            filteredTrips.map((trip: any) => {
              const bus = trip.bus || {};
              const isMorning = bus.serviceType === "Morning" || trip.serviceType === "Morning";
              const busImg = isMorning ? morningBusImg : afternoonBusImg;
              const departureTime = bus.departureTime || trip.departureTime
                ? (bus.departureTime || format(new Date(trip.date), "HH:mm"))
                : format(new Date(trip.date), "HH:mm");
              const durationMinutes = bus.durationMinutes || trip.durationMinutes || 0;
              const duration = `${Math.floor(durationMinutes / 60)}h${durationMinutes % 60 ? durationMinutes % 60 + "min" : ""}`;
              const arrivalDate = new Date(trip.date);
              arrivalDate.setMinutes(arrivalDate.getMinutes() + durationMinutes);
              const arrivalTime = format(arrivalDate, "HH:mm");
              const isFull = trip.availableSeats === 0;
              const fare = bus.fare || trip.fare || 0;
              const seats = bus.seats || trip.availableSeats || 0;
              const serviceType = bus.serviceType || trip.serviceType || "";

              return (
                <div key={trip.id} className="grid grid-cols-6 gap-4 p-4 items-center hover:bg-gray-50 transition-colors">
                  <div className="col-span-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-28 h-20 bg-gray-100 rounded-lg flex items-center justify-center relative overflow-hidden">
                        <Image
                          src={busImg}
                          alt={serviceType + " bus"}
                          width={84}
                          height={56}
                          className="object-contain"
                        />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{serviceType} Bus</div>
                        <div className="text-sm text-gray-600">
                          {trip.routeOrigin} → {trip.routeDestination}
                        </div>
                        <div className="text-xs text-gray-500">{seats} seats</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center text-gray-900">
                      <span className="font-semibold text-lg">{departureTime}</span>
                    </div>
                    <div className="text-xs text-gray-500">{format(trip.date, "dd MMM yyyy")}</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-gray-900">{duration}</div>
                    <div className="text-xs text-gray-500">Non-stop</div>
                  </div>
                  <div>
                    <div className="flex items-center text-gray-900">
                      <span className="font-semibold text-lg">{arrivalTime}</span>
                    </div>
                    <div className="text-xs text-gray-500">{format(arrivalDate, "dd MMM yyyy")}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-xl text-teal-600 mb-2">P {fare}/-</div>
                    <div className={`text-xs mb-2 font-medium ${isFull ? "text-red-600" : "text-green-600"}`}>
                      {isFull ? "✗ Bus Full" : `✓ ${trip.availableSeats} seats available`}
                    </div>
                    {!isFull ? (
                      <Button
                        onClick={() =>
                          onSelectBus({
                            ...bus,
                            tripId: trip.id,
                            tripDate: trip.date,
                            availableSeats: trip.availableSeats,
                            fare: fare,
                            serviceType: serviceType,
                            route: `${trip.routeOrigin} → ${trip.routeDestination}`,
                          })
                        }
                        className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 text-sm"
                      >
                        SELECT SEATS
                      </Button>
                    ) : (
                      <Button
                        onClick={() =>
                          onSelectBus({
                            ...bus,
                            isRequest: true,
                            tripId: trip.id,
                            tripDate: trip.date,
                          })
                        }
                        className="bg-amber-500 hover:bg-amber-600 text-gray-900 px-4 py-2 text-sm font-semibold"
                      >
                        REQUEST
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
