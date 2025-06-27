import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { format, addDays, parseISO } from "date-fns";
import Image from "next/image";
import { BoardingPoint, SearchData } from "@/lib/types";

interface Trip {
  id: string;
  routeOrigin: string;
  routeDestination: string;
  departureDate: string;
  departureTime: string;
  durationMinutes: number;
  fare: number;
  availableSeats: number;
  serviceType: string;
  totalSeats: number;
  boardingPoint: string;
  droppingPoint: string;
}

const safeParseDate = (date: string | Date | null | undefined): Date | null => {
  if (!date) return null;
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    return !isNaN(parsedDate.getTime()) ? parsedDate : null;
  } catch (e) {
    console.error("Error parsing date:", e);
    return null;
  }
};

const safeFormatDate = (date: string | Date | null | undefined, dateFormat: string): string => {
  const parsedDate = safeParseDate(date);
  if (!parsedDate) return "Invalid Date";
  try {
    return format(parsedDate, dateFormat);
  } catch (e) {
    console.error("Error formatting date:", e);
    return "Invalid Date";
  }
};

const safeAddMinutes = (date: Date | null | undefined, minutes: number): Date | null => {
  const parsedDate = safeParseDate(date);
  if (!parsedDate) return null;
  try {
    const newDate = new Date(parsedDate);
    newDate.setMinutes(newDate.getMinutes() + minutes);
    return newDate;
  } catch (e) {
    console.error("Error adding minutes to date:", e);
    return null;
  }
};

const morningBusImg = "/images/scania-irizar-vip.png";
const afternoonBusImg = "/images/scania-irizar-vip.png";

interface BusSchedulesProps {
  searchData: SearchData;
  onSelectBus: (bus: any) => void;
  boardingPoints: Record<string, BoardingPoint[]>;
}

interface NormalizeFn {
  (str: string | undefined | null): string;
}

const normalize: NormalizeFn = (str) => (str || "").toLowerCase().replace(/\s+/g, "");

export default function BusSchedules({ searchData, onSelectBus, boardingPoints }: BusSchedulesProps) {
  const [selectedDay, setSelectedDay] = useState(0);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [returnTrips, setReturnTrips] = useState<Trip[]>([]);
  const [showReturnTrips, setShowReturnTrips] = useState(false);

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = searchData.departureDate ? 
      addDays(safeParseDate(searchData.departureDate) || new Date(), i) : 
      addDays(new Date(), i);
    
    return {
      date,
      dayName: safeFormatDate(date, "EEE"),
      dayNumber: safeFormatDate(date, "dd"),
      month: safeFormatDate(date, "MMM"),
    };
  });

  useEffect(() => {
    async function fetchTrips() {
      setLoading(true);
      try {
        const res = await fetch("/api/trips");
        if (!res.ok) throw new Error("Failed to fetch trips");
        
        const data: Trip[] = await res.json();
        setTrips(data);
        
        if (searchData.returnDate) {
          setReturnTrips(data); // Use same data for return trips
        }
      } catch (error) {
        console.error("Error fetching trips:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchTrips();
  }, [searchData]);

  const selectedDate = days[selectedDay].date;
  const selectedDateStr = safeFormatDate(selectedDate, "yyyy-MM-dd");

  const filteredTrips = trips.filter((trip) => {
    const routeMatch = 
      normalize(trip.routeOrigin) === normalize(searchData.from) && 
      normalize(trip.routeDestination) === normalize(searchData.to);
    
    const tripDate = safeFormatDate(trip.departureDate, "yyyy-MM-dd");
    const dateMatch = tripDate === selectedDateStr;
    
    return routeMatch && dateMatch;
  });

  const filteredReturnTrips = returnTrips.filter((trip) => {
    const routeMatch = 
      normalize(trip.routeOrigin) === normalize(searchData.to) && 
      normalize(trip.routeDestination) === normalize(searchData.from);
    
    const returnDate = searchData.returnDate ? 
      safeFormatDate(searchData.returnDate.toString(), "yyyy-MM-dd") : "";
    
    const tripDate = safeFormatDate(trip.departureDate, "yyyy-MM-dd");
    const dateMatch = tripDate === returnDate;
    
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
                {safeFormatDate(searchData.departureDate?.toString(), "EEEE, MMMM do, yyyy")}
              </p>
            </div>
            {searchData.returnDate && (
              <div className="mt-2 md:mt-0">
                <h2 className="text-xl font-bold text-gray-800 capitalize">
                  {searchData.to} → {searchData.from}
                </h2>
                <p className="text-sm text-gray-600">
                  {safeFormatDate(searchData.returnDate?.toString(), "EEEE, MMMM do, yyyy")}
                </p>
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
                selectedDay === index ? "bg-teal-600 text-white font-medium shadow-md" : "hover:bg-gray-100 text-gray-700"
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
            filteredTrips.map((trip) => {
              const isMorning = trip.serviceType.includes("Morning");
              const busImg = isMorning ? morningBusImg : afternoonBusImg;
              const departureTime = trip.departureTime;
              const duration = `${Math.floor(trip.durationMinutes / 60)}h${trip.durationMinutes % 60 ? trip.durationMinutes % 60 + "min" : ""}`;
              const arrivalDate = safeAddMinutes(safeParseDate(trip.departureDate), trip.durationMinutes);
              const arrivalTime = arrivalDate ? safeFormatDate(arrivalDate, "HH:mm") : "Invalid Time";
              const isFull = trip.availableSeats === 0;
              const fare = trip.fare;
              const seats = trip.totalSeats;
              const serviceType = trip.serviceType;

              return (
                <div key={trip.id} className="grid grid-cols-6 gap-4 p-4 items-center hover:bg-gray-50 transition-colors">
                  <div className="col-span-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-28 h-20 bg-gray-100 rounded-lg flex items-center justify-center relative overflow-hidden">
                        <Image 
                          src={busImg} 
                          alt={`${serviceType} bus`} 
                          width={84} 
                          height={56} 
                          className="object-contain" 
                        />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{serviceType}</div>
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
                    <div className="text-xs text-gray-500">{safeFormatDate(trip.departureDate, "dd MMM yyyy")}</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-gray-900">{duration}</div>
                    <div className="text-xs text-gray-500">Non-stop</div>
                  </div>
                  <div>
                    <div className="flex items-center text-gray-900">
                      <span className="font-semibold text-lg">{arrivalTime}</span>
                    </div>
                    <div className="text-xs text-gray-500">{arrivalDate ? safeFormatDate(arrivalDate, "dd MMM yyyy") : "Invalid Date"}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-xl text-teal-600 mb-2">P {fare}/-</div>
                    <div className={`text-xs mb-2 font-medium ${isFull ? "text-red-600" : "text-green-600"}`}>
                      {isFull ? "✗ Bus Full" : `✓ ${trip.availableSeats} seats available`}
                    </div>
                    {!isFull ? (
                      <Button
                        onClick={() => onSelectBus({
                          ...trip,
                          route: `${trip.routeOrigin} → ${trip.routeDestination}`,
                        })}
                        className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 text-sm"
                      >
                        SELECT SEATS
                      </Button>
                    ) : (
                      <Button
                        onClick={() => onSelectBus({
                          ...trip,
                          isRequest: true,
                          route: `${trip.routeOrigin} → ${trip.routeDestination}`,
                        })}
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

        {searchData.returnDate && (
          <div className="p-6 border-t bg-gradient-to-r from-gray-50 to-gray-100">
            <label className="flex items-center gap-2 mb-4">
              <input 
                type="checkbox" 
                checked={showReturnTrips} 
                onChange={() => setShowReturnTrips(!showReturnTrips)} 
              />
              <span className="text-sm font-medium text-blue-700">Show Return Trips</span>
            </label>
            {showReturnTrips && (
              <div className="divide-y">
                <div className="grid grid-cols-6 gap-4 p-4 bg-gray-100 text-sm font-semibold text-gray-700">
                  <div className="col-span-2">Bus Details</div>
                  <div>Departure</div>
                  <div>Duration</div>
                  <div>Arrival</div>
                  <div className="text-right">Fare & Action</div>
                </div>
                {filteredReturnTrips.length === 0 ? (
                  <div className="p-8 text-center col-span-6 text-gray-400">No return trips found for this day.</div>
                ) : (
                  filteredReturnTrips.map((trip) => {
                    const isMorning = trip.serviceType.includes("Morning");
                    const busImg = isMorning ? morningBusImg : afternoonBusImg;
                    const departureTime = trip.departureTime;
                    const duration = `${Math.floor(trip.durationMinutes / 60)}h${trip.durationMinutes % 60 ? trip.durationMinutes % 60 + "min" : ""}`;
                    const arrivalDate = safeAddMinutes(safeParseDate(trip.departureDate), trip.durationMinutes);
                    const arrivalTime = arrivalDate ? safeFormatDate(arrivalDate, "HH:mm") : "Invalid Time";
                    const isFull = trip.availableSeats === 0;
                    const fare = trip.fare;
                    const seats = trip.totalSeats;
                    const serviceType = trip.serviceType;

                    return (
                      <div key={trip.id} className="grid grid-cols-6 gap-4 p-4 items-center hover:bg-gray-50 transition-colors">
                        <div className="col-span-2">
                          <div className="flex items-center space-x-3">
                            <div className="w-28 h-20 bg-gray-100 rounded-lg flex items-center justify-center relative overflow-hidden">
                              <Image 
                                src={busImg} 
                                alt={`${serviceType} bus`} 
                                width={84} 
                                height={56} 
                                className="object-contain" 
                              />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{serviceType}</div>
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
                          <div className="text-xs text-gray-500">{safeFormatDate(trip.departureDate, "dd MMM yyyy")}</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-gray-900">{duration}</div>
                          <div className="text-xs text-gray-500">Non-stop</div>
                        </div>
                        <div>
                          <div className="flex items-center text-gray-900">
                            <span className="font-semibold text-lg">{arrivalTime}</span>
                          </div>
                          <div className="text-xs text-gray-500">{arrivalDate ? safeFormatDate(arrivalDate, "dd MMM yyyy") : "Invalid Date"}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-xl text-teal-600 mb-2">P {fare}/-</div>
                          <div className={`text-xs mb-2 font-medium ${isFull ? "text-red-600" : "text-green-600"}`}>
                            {isFull ? "✗ Bus Full" : `✓ ${trip.availableSeats} seats available`}
                          </div>
                          {!isFull ? (
                            <Button
                              onClick={() => onSelectBus({
                                ...trip,
                                isReturnTrip: true,
                                route: `${trip.routeOrigin} → ${trip.routeDestination}`,
                              })}
                              className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 text-sm"
                            >
                              SELECT SEATS
                            </Button>
                          ) : (
                            <Button
                              onClick={() => onSelectBus({
                                ...trip,
                                isRequest: true,
                                isReturnTrip: true,
                                route: `${trip.routeOrigin} → ${trip.routeDestination}`,
                              })}
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
            )}
          </div>
        )}
      </div>
    </div>
  );
}