'use client'
import { useEffect, useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { format, addDays, parseISO, isValid } from "date-fns";
import Image from "next/image";
import { BoardingPoint, SearchData } from "@/lib/types";
import { 
  Wifi, 
  Luggage, 
  Snowflake, 
  Coffee, 
  BatteryCharging,
  Bus,
  Clock,
  Calendar,
  MapPin,
  ArrowRight,
  DollarSign,
  Users
} from "lucide-react";

// Define color variables based on company colors
const colors = {
  primary: '#009393',       // Teal
  secondary: '#febf00',     // Gold
  accent: '#958c55',        // Olive
  muted: '#fdbe00a4',       // Light gray
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

const morningBusImg = "/images/nbg.png";
const afternoonBusImg = "/images/nbg.png";

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

    const cached = tripsCache.get(url);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
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
    if (!selectedDate) return [];

    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    return trips.filter((trip) => {
      const tripDate = new Date(trip.departureDate);
      const matchesDate = tripDate >= startOfDay && tripDate <= endOfDay;
      const matchesRoute = trip.routeOrigin.toLowerCase() === searchData.from.toLowerCase() &&
                          trip.routeDestination.toLowerCase() === searchData.to.toLowerCase();
      return matchesRoute && matchesDate;
    });
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
      { icon: <Wifi className="w-4 h-4" style={{ color: colors.accent }} />, label: "WiFi" },
      { icon: <Luggage className="w-4 h-4" style={{ color: colors.accent }} />, label: "Baggage" },
      { icon: <Snowflake className="w-4 h-4" style={{ color: colors.accent }} />, label: "AC" },
      { icon: <Coffee className="w-4 h-4" style={{ color: colors.accent }} />, label: "Snack" },
      { icon: <BatteryCharging className="w-4 h-4" style={{ color: colors.accent }} />, label: "Charging" },
    ];

    return (
      <div className="mb-4">
        {/* Mobile Card Design */}
        <div className="md:hidden bg-white rounded-xl shadow-md border hover:shadow-lg transition-all duration-200">
          {/* Card Header */}
          <div className="px-4 py-3 border-b bg-gray-50 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: colors.primary }}
                >
                  {trip.serviceType.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{trip.serviceType}</div>
                  <div className="text-xs text-gray-500">{trip.totalSeats} seats</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg" style={{ color: colors.primary }}>
                  P{trip.fare}
                </div>
                <div className="text-xs text-gray-500">One-way</div>
              </div>
            </div>
          </div>

          {/* Journey Details */}
          <div className="px-4 py-4">
            {/* Bus Image */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                <Image
                  src={busImg}
                  alt={`${trip.serviceType} bus`}
                  width={64}
                  height={48}
                  className="object-contain"
                  priority={true}
                />
              </div>
            </div>

            {/* Time and Route */}
            <div className="flex items-center justify-between mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {trip.departureTime}
                </div>
                <div className="text-sm text-gray-600 max-w-20 truncate">
                  {trip.routeOrigin}
                </div>
              </div>
              
              <div className="flex-1 px-4">
                <div className="flex items-center justify-center mb-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.secondary }}></div>
                  <div className="flex-1 h-0.5 bg-gray-300 mx-2"></div>
                  <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {durationHours}h {durationMinutes > 0 ? `${durationMinutes}m` : ''}
                  </div>
                  <div className="flex-1 h-0.5 bg-gray-300 mx-2"></div>
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.secondary }}></div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500">Direct</div>
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {arrivalDate ? dateUtils.safeFormat(arrivalDate, "HH:mm") : "N/A"}
                </div>
                <div className="text-sm text-gray-600 max-w-20 truncate">
                  {trip.routeDestination}
                </div>
              </div>
            </div>

            {/* Features and Availability */}
            <div className="flex items-center justify-between border-t pt-3">
              <div className="flex space-x-2">
                {features.slice(0, 4).map((feature, idx) => (
                  <div key={idx} className="flex items-center" title={feature.label}>
                    {feature.icon}
                  </div>
                ))}
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-gray-400" />
                <span className={`text-sm font-medium ${
                  isDeparted ? "text-red-600" :
                  isFull ? "text-red-600" : "text-green-600"
                }`}>
                  {isDeparted ? "Departed" :
                   isFull ? "Full" : `${trip.availableSeats} left`}
                </span>
              </div>
            </div>

            {/* Action Button */}
            <div className="mt-4">
              {isDeparted ? (
                <Button 
                  disabled
                  className="w-full bg-gray-300 text-gray-500 cursor-not-allowed"
                >
                  Bus Departed
                </Button>
              ) : !isFull ? (
                <Button
                  onClick={handleSelectBus}
                  className="w-full text-white font-semibold py-3 rounded-lg"
                  style={{ backgroundColor: colors.primary }}
                >
                  Select
                </Button>
              ) : (
                <Button
                  onClick={handleRequestBus}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-gray-900 font-semibold py-3 rounded-lg"
                >
                  Request
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Layout (Original) */}
        <div className="hidden md:flex md:grid md:grid-cols-6 gap-4 p-4 items-center hover:bg-gray-50 transition-colors rounded-lg border-b">
          {/* Bus Details */}
          <div className="w-full md:col-span-2">
            <div className="flex items-center space-x-3">
              <div className="w-20 md:w-28 h-16 md:h-20 bg-gray-100 rounded-lg flex items-center justify-center relative overflow-hidden">
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
                <div className="text-sm text-gray-600 hidden md:block">
                  {trip.routeOrigin} → {trip.routeDestination}
                </div>
                <div className="text-xs text-gray-500 hidden md:block">{trip.totalSeats} seats</div>
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

          {/* Desktop Departure */}
          <div className="hidden md:block">
            <div className="flex items-center text-gray-900">
              <span className="font-semibold text-lg">{trip.departureTime}</span>
            </div>
            <div className="text-xs text-gray-500">
              {departureDate ? dateUtils.safeFormat(departureDate, "dd MMM yyyy") : "N/A"}
            </div>
          </div>

          {/* Desktop Duration */}
          <div className="hidden md:block text-center">
            <div className="font-medium text-gray-900">
              {durationHours}h {durationMinutes > 0 ? `${durationMinutes}min` : ''}
            </div>
            <div className="text-xs text-gray-500">Non-stop</div>
          </div>

          {/* Desktop Arrival */}
          <div className="hidden md:block">
            <div className="flex items-center text-gray-900">
              <span className="font-semibold text-lg">
                {arrivalDate ? dateUtils.safeFormat(arrivalDate, "HH:mm") : "N/A"}
              </span>
            </div>
            <div className="text-xs text-gray-500">
              {arrivalDate ? dateUtils.safeFormat(arrivalDate, "dd MMM yyyy") : "N/A"}
            </div>
          </div>

          {/* Fare & Action */}
          <div className="w-full md:w-auto text-right mt-2 md:mt-0">
            <div className="flex items-center justify-end md:justify-start">
              <DollarSign className="w-4 h-4 mr-1 md:hidden" />
              <span className="font-bold text-lg md:text-xl" style={{ color: colors.primary }}>
                P {trip.fare}/-
              </span>
            </div>
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
        
        {/* Day Selector */}
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
        
        {/* Desktop Table Headers */}
        <div className="divide-y">
          <div className="hidden md:grid grid-cols-6 gap-4 p-4 bg-gray-100 text-sm font-semibold" style={{ color: colors.dark }}>
            <div className="col-span-2">Bus Details</div>
            <div>Departure</div>
            <div>Duration</div>
            <div>Arrival</div>
            <div className="text-right">Fare & Action</div>
          </div>

          {/* Content Area */}
          <div className="p-4 md:p-0">
            {/* Loading State */}
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading trips...</p>
              </div>
            ) : filteredTrips.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                No trips found for this day.
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
    </div>
  );
}