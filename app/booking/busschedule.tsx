import { useEffect, useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { format, addDays, parseISO, isValid } from "date-fns";
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
}

const morningBusImg = "/images/scania-irizar-vip.png";
const afternoonBusImg = "/images/scania-irizar-vip.png";

interface BusSchedulesProps {
  searchData: SearchData;
  onSelectBus: (bus: any) => void;
  boardingPoints: Record<string, BoardingPoint[]>;
}

// Cache for trips data
const tripsCache = new Map<string, { data: Trip[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export default function BusSchedules({ searchData, onSelectBus, boardingPoints }: BusSchedulesProps) {
  const [selectedDay, setSelectedDay] = useState(0);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const [showReturnTrips, setShowReturnTrips] = useState(!!searchData.returnDate);

  // Memoized date utilities
  const dateUtils = useMemo(() => {
    const isValidDate = (date: any): date is Date | string => {
      return date && !isNaN(new Date(date).getTime());
    };

    const toISODateString = (date: Date | string | null | undefined) => {
      if (!date || !isValidDate(date)) return "";
      try {
        const d = new Date(date);
        return d.toISOString().split('T')[0];
      } catch {
        return "";
      }
    };

    const safeFormat = (date: Date | string | null, formatStr: string) => {
      if (!date || !isValidDate(date)) return "Select Date";
      try {
        const parsedDate = typeof date === 'string' ? parseISO(date) : date;
        return isValid(parsedDate) ? format(parsedDate, formatStr) : "Invalid Date";
      } catch {
        return "Invalid Date";
      }
    };

    return { isValidDate, toISODateString, safeFormat };
  }, []);

  // Memoized days array
  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      let baseDate;
      try {
        baseDate = new Date(searchData.departureDate);
        if (isNaN(baseDate.getTime())) throw new Error("Invalid date");
      } catch {
        baseDate = new Date();
      }
      
      const date = addDays(baseDate, i);
      return {
        date,
        dayName: dateUtils.safeFormat(date, "EEE"),
        dayNumber: dateUtils.safeFormat(date, "dd"),
        month: dateUtils.safeFormat(date, "MMM"),
      };
    });
  }, [searchData.departureDate, dateUtils]);

  // Optimized fetch with caching
  const fetchTrips = useCallback(async () => {
    const returnDateStr = searchData.returnDate ? dateUtils.toISODateString(searchData.returnDate) : '';
    const cacheKey = `${searchData.from}-${searchData.to}-${dateUtils.toISODateString(searchData.departureDate)}-${returnDateStr}`;
    const cached = tripsCache.get(cacheKey);
    
    // Check if we have valid cached data
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setTrips(cached.data);
      return;
    }

    setLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams({
        from: searchData.from,
        to: searchData.to,
        departureDate: dateUtils.toISODateString(searchData.departureDate)
      });
      
      if (searchData.returnDate) {
        params.append('returnDate', dateUtils.toISODateString(searchData.returnDate));
      }
      
      const url = `/api/trips?${params.toString()}`;
      console.log('Fetching trips from:', url);
      
      const res = await fetch(url);
      
      console.log('Response status:', res.status);
      console.log('Response ok:', res.ok);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Error response:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }
        throw new Error(errorData.message || `HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data: Trip[] = await res.json();
      console.log('Fetched trips:', data);
      
      // Cache the results
      tripsCache.set(cacheKey, { data, timestamp: Date.now() });
      setTrips(data);
    } catch (error) {
      console.error("Error fetching trips:", error);
      // Show error message to user
      alert(`Error loading trips: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTrips([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  }, [searchData, dateUtils]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  // Memoized filtered trips
  const { filteredTrips, filteredReturnTrips } = useMemo(() => {
    const selectedDate = days[selectedDay]?.date;
    const selectedDateStr = dateUtils.toISODateString(selectedDate);
    const returnDateStr = searchData.returnDate ? dateUtils.toISODateString(searchData.returnDate) : "";

    const outboundTrips = trips.filter((trip) => {
      const tripDate = dateUtils.toISODateString(trip.departureDate);
      return (
        trip.routeOrigin.toLowerCase() === searchData.from.toLowerCase() &&
        trip.routeDestination.toLowerCase() === searchData.to.toLowerCase() &&
        tripDate === selectedDateStr &&
        tripDate
      );
    });

    const returnTrips = trips.filter((trip) => {
      const tripDate = dateUtils.toISODateString(trip.departureDate);
      return (
        trip.routeOrigin.toLowerCase() === searchData.to.toLowerCase() &&
        trip.routeDestination.toLowerCase() === searchData.from.toLowerCase() &&
        tripDate === returnDateStr &&
        tripDate
      );
    });

    return {
      filteredTrips: outboundTrips,
      filteredReturnTrips: returnTrips
    };
  }, [trips, selectedDay, days, searchData, dateUtils]);

  // Memoized trip card component
  const TripCard = useCallback(({ trip, isReturnTrip = false }: { trip: Trip; isReturnTrip?: boolean }) => {
    const isMorning = trip.serviceType.includes("Morning");
    const busImg = isMorning ? morningBusImg : afternoonBusImg;
    const durationHours = Math.floor(trip.durationMinutes / 60);
    const durationMinutes = trip.durationMinutes % 60;
    
    let departureDate: Date | null = null;
    let arrivalDate: Date | null = null;
    
    try {
      departureDate = new Date(trip.departureDate);
      if (!isNaN(departureDate.getTime())) {
        arrivalDate = new Date(departureDate);
        arrivalDate.setMinutes(arrivalDate.getMinutes() + trip.durationMinutes);
      }
    } catch {
      // Handle invalid dates gracefully
    }
    
    const isFull = trip.availableSeats === 0;
    const handleSelectBus = () => {
      onSelectBus({
        ...trip,
        isReturnTrip,
        route: `${trip.routeOrigin} → ${trip.routeDestination}`,
      });
    };

    const handleRequestBus = () => {
      onSelectBus({
        ...trip,
        isRequest: true,
        isReturnTrip,
        route: `${trip.routeOrigin} → ${trip.routeDestination}`,
      });
    };

    return (
      <div className="grid grid-cols-6 gap-4 p-4 items-center hover:bg-gray-50 transition-colors">
        <div className="col-span-2">
          <div className="flex items-center space-x-3">
            <div className="w-28 h-20 bg-gray-100 rounded-lg flex items-center justify-center relative overflow-hidden">
              <Image 
                src={busImg} 
                alt={`${trip.serviceType} bus`} 
                width={84} 
                height={56} 
                className="object-contain"
                priority={true}
              />
            </div>
            <div>
              <div className="font-semibold text-gray-900">{trip.serviceType}</div>
              <div className="text-sm text-gray-600">
                {trip.routeOrigin} → {trip.routeDestination}
              </div>
              <div className="text-xs text-gray-500">{trip.totalSeats} seats</div>
            </div>
          </div>
        </div>
        <div>
          <div className="flex items-center text-gray-900">
            <span className="font-semibold text-lg">{trip.departureTime}</span>
          </div>
          <div className="text-xs text-gray-500">
            {departureDate ? dateUtils.safeFormat(departureDate, "dd MMM yyyy") : "N/A"}
          </div>
        </div>
        <div className="text-center">
          <div className="font-medium text-gray-900">
            {durationHours}h {durationMinutes > 0 ? `${durationMinutes}min` : ''}
          </div>
          <div className="text-xs text-gray-500">Non-stop</div>
        </div>
        <div>
          <div className="flex items-center text-gray-900">
            <span className="font-semibold text-lg">
              {arrivalDate ? dateUtils.safeFormat(arrivalDate, "HH:mm") : "N/A"}
            </span>
          </div>
          <div className="text-xs text-gray-500">
            {arrivalDate ? dateUtils.safeFormat(arrivalDate, "dd MMM yyyy") : "N/A"}
          </div>
        </div>
        <div className="text-right">
          <div className="font-bold text-xl text-teal-600 mb-2">P {trip.fare}/-</div>
          <div className={`text-xs mb-2 font-medium ${isFull ? "text-red-600" : "text-green-600"}`}>
            {isFull ? "✗ Bus Full" : `✓ ${trip.availableSeats} seats available`}
          </div>
          {!isFull ? (
            <Button
              onClick={handleSelectBus}
              className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 text-sm"
            >
              SELECT SEATS
            </Button>
          ) : (
            <Button
              onClick={handleRequestBus}
              className="bg-amber-500 hover:bg-amber-600 text-gray-900 px-4 py-2 text-sm font-semibold"
            >
              REQUEST
            </Button>
          )}
        </div>
      </div>
    );
  }, [onSelectBus, dateUtils]);

  return (
    <div className="max-w-5xl mx-auto mt-8">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
        {/* Header with route information */}
        <div className="p-6 border-b bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-800 capitalize">
                {searchData.from} → {searchData.to}
              </h2>
              <p className="text-sm text-gray-600">
                {dateUtils.safeFormat(searchData.departureDate, "EEEE, MMMM do, yyyy")}
              </p>
            </div>
            {searchData.returnDate && (
              <div className="mt-2 md:mt-0">
                <h2 className="text-xl font-bold text-gray-800 capitalize">
                  {searchData.to} → {searchData.from}
                </h2>
                <p className="text-sm text-gray-600">
                  {dateUtils.safeFormat(searchData.returnDate, "EEEE, MMMM do, yyyy")}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Date selector */}
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

        {/* Trips list */}
        <div className="divide-y">
          <div className="grid grid-cols-6 gap-4 p-4 bg-gray-100 text-sm font-semibold text-gray-700">
            <div className="col-span-2">Bus Details</div>
            <div>Departure</div>
            <div>Duration</div>
            <div>Arrival</div>
            <div className="text-right">Fare & Action</div>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading trips...</p>
            </div>
          ) : filteredTrips.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              No trips found for this day.
            </div>
          ) : (
            filteredTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))
          )}
        </div>

        {/* Return trips section */}
        {searchData.returnDate && (
          <div className="p-6 border-t bg-gradient-to-r from-gray-50 to-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                {searchData.to} → {searchData.from} on {dateUtils.safeFormat(searchData.returnDate, "EEE, MMM do")}
              </h3>
              <Button 
                variant="outline"
                onClick={() => setShowReturnTrips(!showReturnTrips)}
                className="text-teal-600 border-teal-600 hover:bg-teal-50"
              >
                {showReturnTrips ? "Hide" : "Show"} Return Trips
              </Button>
            </div>
            
            {showReturnTrips && (
              <div className="divide-y">
                {filteredReturnTrips.length === 0 ? (
                  <div className="p-8 text-center bg-white rounded-lg border border-gray-200">
                    <p className="text-gray-500 mb-4">No return trips found for selected date</p>
                    <Button
                      onClick={() => onSelectBus({
                        id: `request-${Date.now()}`,
                        routeOrigin: searchData.to,
                        routeDestination: searchData.from,
                        departureDate: searchData.returnDate?.toISOString() || '',
                        isRequest: true,
                        isReturnTrip: true,
                        route: `${searchData.to} → ${searchData.from}`,
                      })}
                      className="bg-amber-500 hover:bg-amber-600 text-gray-900"
                    >
                      Request Custom Return Trip
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-6 gap-4 p-4 bg-gray-100 text-sm font-semibold text-gray-700">
                      <div className="col-span-2">Bus Details</div>
                      <div>Departure</div>
                      <div>Duration</div>
                      <div>Arrival</div>
                      <div className="text-right">Fare & Action</div>
                    </div>
                    {filteredReturnTrips.map((trip) => (
                      <TripCard key={trip.id} trip={trip} isReturnTrip={true} />
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}