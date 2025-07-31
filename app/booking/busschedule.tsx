import { useEffect, useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { format, addDays, parseISO, isValid } from "date-fns";
import Image from "next/image";
import { BoardingPoint, SearchData } from "@/lib/types";
import { Wifi, Luggage, Snowflake, Coffee, BatteryCharging } from "lucide-react";

// Define color variables based on company colors
const colors = {
  primary: '#009393',       // Teal
  secondary: '#febf00',     // Gold
  accent: '#958c55',        // Olive
  muted: '#f5f5f5',         // Light gray
  dark: '#1a1a1a',          // Dark gray
  light: '#ffffff',         // White
  destructive: '#ef4444'    // Red (kept for errors)
};

interface Trip {
  id: string;
  routeOrigin: string;
  routeDestination: string;
  departureDate: string | Date;
  departureTime: string;
  durationMinutes: number;
  fare: number;
  availableSeats: number;
  serviceType: string;
  totalSeats: number;
  promoActive?: boolean;
  promoPrice?: number;
  hasDeparted?: boolean;
}

const morningBusImg = "/images/scania-irizar-vip.png";
const afternoonBusImg = "/images/scania-irizar-vip.png";

interface BusSchedulesProps {
  searchData: SearchData;
  onSelectBus: (bus: any, isReturnTrip?: boolean) => void;
  boardingPoints: Record<string, BoardingPoint[]>;
  isReturnTrip?: boolean;
}

const tripsCache = new Map<string, { data: Trip[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export default function BusSchedules({
  searchData,
  onSelectBus,
  boardingPoints,
  isReturnTrip = false
}: BusSchedulesProps) {
  const [selectedDay, setSelectedDay] = useState(0);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);

  const dateUtils = useMemo(() => {
    const isValidDate = (date: any): date is Date | string => {
      return date && !isNaN(new Date(date).getTime());
    };

    const toISODateString = (date: Date | string | null | undefined) => {
      if (!date || !isValidDate(date)) return "";
      try {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
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

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      let baseDate;
      try {
        const inputDate = new Date(searchData.departureDate);
        if (isNaN(inputDate.getTime())) throw new Error("Invalid date");
        baseDate = new Date(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate());
      } catch {
        const today = new Date();
        baseDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
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

  const fetchTrips = useCallback(async () => {
    const departureDateStr = dateUtils.toISODateString(days[selectedDay]?.date);
    const params = new URLSearchParams({
      from: searchData.from,
      to: searchData.to,
      departureDate: departureDateStr
    });
    const url = `/api/trips?${params.toString()}`;
    console.log('Fetching trips with URL:', url);
    console.log('Search params:', {
      from: searchData.from,
      to: searchData.to,
      departureDate: departureDateStr,
      selectedDay,
      selectedDate: days[selectedDay]?.date
    });

    const cached = tripsCache.get(url);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('Using cached trips:', cached.data.length);
      setTrips(cached.data);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(url);
      if (!res.ok) {
        const errorText = await res.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }
        throw new Error(errorData.message || `HTTP ${res.status}: ${res.statusText}`);
      }
      const data: Trip[] = await res.json();

      console.log('Received trips from API:', {
        count: data.length,
        trips: data.map(t => ({
          id: t.id,
          departureDate: t.departureDate,
          departureTime: t.departureTime,
          route: `${t.routeOrigin} → ${t.routeDestination}`,
          availableSeats: t.availableSeats,
          hasDeparted: t.hasDeparted
        }))
      });

      tripsCache.set(url, { data, timestamp: Date.now() });
      setTrips(data);
    } catch (error) {
      console.error("Error fetching trips:", error);
      alert(`Error loading trips: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTrips([]);
    } finally {
      setLoading(false);
    }
  }, [searchData, dateUtils, selectedDay, days]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips, selectedDay]);

  const filteredTrips = useMemo(() => {
    const selectedDate = days[selectedDay]?.date;
    if (!selectedDate) {
      console.log('No selected date available');
      return [];
    }

    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    console.log('Filtering trips for date range:', {
      selectedDate: selectedDate.toISOString(),
      startOfDay: startOfDay.toISOString(),
      endOfDay: endOfDay.toISOString(),
      totalTrips: trips.length,
      searchData: `${searchData.from} → ${searchData.to}`
    });

    const filtered = trips.filter((trip) => {
      const tripDate = new Date(trip.departureDate);
      const matchesDate = tripDate >= startOfDay && tripDate <= endOfDay;
      const matchesRoute = trip.routeOrigin.toLowerCase() === searchData.from.toLowerCase() &&
                          trip.routeDestination.toLowerCase() === searchData.to.toLowerCase();
      const result = matchesRoute && matchesDate;

      if (result) {
        console.log('Trip matches:', {
          tripId: trip.id,
          tripDate: tripDate.toISOString(),
          route: `${trip.routeOrigin} → ${trip.routeDestination}`,
          departureTime: trip.departureTime,
          hasDeparted: trip.hasDeparted,
          availableSeats: trip.availableSeats
        });
      }

      return result;
    });

    console.log('Filtered trips result:', {
      filteredCount: filtered.length,
      selectedDay,
      selectedDate: days[selectedDay]?.date?.toISOString(),
      searchRoute: `${searchData.from} → ${searchData.to}`,
      allTripsCount: trips.length
    });

    return filtered;
  }, [trips, selectedDay, days, searchData]);

  const TripCard = useCallback(({ trip }: { trip: Trip }) => {
    const isMorning = trip.serviceType.includes("Morning");
    const busImg = isMorning ? morningBusImg : afternoonBusImg;
    const durationHours = Math.floor(trip.durationMinutes / 60);
    const durationMinutes = trip.durationMinutes % 60;
    let departureDate: Date | null = null;
    let arrivalDate: Date | null = null;

    try {
      const depDateStr = typeof trip.departureDate === "string"
        ? trip.departureDate
        : (trip.departureDate as Date).toISOString();
      const depTimeStr = trip.departureTime || "00:00";
      const [hours, minutes] = depTimeStr.split(":").map(Number);
      departureDate = new Date(depDateStr);
      if (!isNaN(departureDate.getTime())) {
        departureDate.setHours(hours, minutes, 0, 0);
        arrivalDate = new Date(departureDate);
        arrivalDate.setMinutes(arrivalDate.getMinutes() + trip.durationMinutes);
      }
    } catch {
      // Handle invalid dates gracefully
    }

    const isDeparted = trip.hasDeparted || false;
    const isFull = trip.availableSeats === 0;

    const handleSelectBus = () => {
      onSelectBus({
        ...trip,
        isReturnTrip,
        route: `${trip.routeOrigin} → ${trip.routeDestination}`,
      }, isReturnTrip);
    };

    const handleRequestBus = () => {
      onSelectBus({
        ...trip,
        isRequest: true,
        isReturnTrip,
        route: `${trip.routeOrigin} → ${trip.routeDestination}`,
      }, isReturnTrip);
    };

    const features = [
      { icon: <Wifi className="w-5 h-5" style={{ color: colors.accent }} />, label: "WiFi" },
      { icon: <Luggage className="w-5 h-5" style={{ color: colors.accent }} />, label: "Baggage" },
      { icon: <Snowflake className="w-5 h-5" style={{ color: colors.accent }} />, label: "AC" },
      { icon: <Coffee className="w-5 h-5" style={{ color: colors.accent }} />, label: "Snack" },
      { icon: <BatteryCharging className="w-5 h-5" style={{ color: colors.accent }} />, label: "Charging" },
    ];

    return (
      <div className="flex flex-col md:grid md:grid-cols-6 gap-4 p-4 items-center hover:bg-gray-50 transition-colors rounded-lg mb-2">
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
              <div className="font-semibold text-gray-900 flex items-center">
                {trip.serviceType}
                {isDeparted && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Departed
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-600">
                {trip.routeOrigin} → {trip.routeDestination}
              </div>
              <div className="text-xs text-gray-500">{trip.totalSeats} seats</div>
              <div className="flex gap-2 mt-1">
                {features.map((f, idx) => (
                  <span key={idx} title={f.label} className="flex items-center">
                    {f.icon}
                  </span>
                ))}
              </div>
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
          <div className="font-bold text-xl" style={{ color: colors.primary }}>P {trip.fare}/-</div>
          <div className={`text-xs mb-2 font-medium ${
            isDeparted ? "text-red-600" :
            isFull ? "text-red-600" : "text-green-600"
          }`}>
            {isDeparted ? "" :
             isFull ? "Bus Full" : `✓ ${trip.availableSeats} seats available`}
          </div>
          {isDeparted ? (
            <div className="text-red-600 font-medium">Bus Departed</div>
          ) : !isFull ? (
            <Button
              onClick={handleSelectBus}
              className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 text-sm w-full md:w-auto"
            >
              BOOK SEATS
            </Button>
          ) : (
            <Button
              onClick={handleRequestBus}
              className="bg-amber-500 hover:bg-amber-600 text-gray-900 px-4 py-2 text-sm font-semibold w-full md:w-auto"
            >
              REQUEST
            </Button>
          )}
        </div>
      </div>
    );
  }, [onSelectBus, dateUtils, isReturnTrip]);

  return (
    <div className="max-w-5xl mx-auto mt-8">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
        <div className="p-6 border-b" style={{ backgroundColor: colors.muted }}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h2 className="text-xl font-bold" style={{ color: colors.dark }}>
                {isReturnTrip ? 'RETURN TRIP: ' : ''}
                {searchData.from} → {searchData.to}
              </h2>
              <p className="text-sm" style={{ color: colors.accent }}>
                {dateUtils.safeFormat(searchData.departureDate, "EEEE, MMMM do, yyyy")}
              </p>
            </div>
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
          <div className="grid grid-cols-6 gap-4 p-4 bg-gray-100 text-sm font-semibold" style={{ color: colors.dark }}>
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
              <div className="mt-4 text-sm">
                <p><strong>Debug info:</strong></p>
                <p>Selected date: {dateUtils.toISODateString(days[selectedDay]?.date)}</p>
                <p>Total trips available: {trips.length}</p>
                <p>Route: {searchData.from} → {searchData.to}</p>
                <p>Selected day index: {selectedDay}</p>
                <p>Days array length: {days.length}</p>

                {trips.length > 0 && (
                  <div className="mt-2">
                    <p><strong>Available trips:</strong></p>
                    {trips.slice(0, 3).map(trip => (
                      <p key={trip.id} className="text-xs">
                        {new Date(trip.departureDate).toLocaleDateString()} {trip.departureTime} -
                        {trip.routeOrigin} → {trip.routeDestination}
                        {trip.hasDeparted ? ' (Departed)' : ` (${trip.availableSeats} seats)`}
                      </p>
                    ))}
                    {trips.length > 3 && <p className="text-xs">... and {trips.length - 3} more</p>}
                  </div>
                )}
              </div>
              <Button
                onClick={() => onSelectBus({
                  id: `request-${Date.now()}`,
                  routeOrigin: searchData.from,
                  routeDestination: searchData.to,
                  departureDate: days[selectedDay]?.date.toISOString() || '',
                  isRequest: true,
                  route: `${searchData.from} → ${searchData.to}`,
                }, isReturnTrip)}
                className="mt-4 bg-amber-500 hover:bg-amber-600 text-gray-900"
              >
                Request Custom Trip
              </Button>
            </div>
          ) : (
            filteredTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
