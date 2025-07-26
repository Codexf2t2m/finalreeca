'use client';
import { useEffect, useState } from "react";
import { Download, Eye, ChevronRight, Clock, MapPin, Users, TrendingUp, Bus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ScheduleBus {
  id: string;
  busNumber: string;
  model: string;
  routeOrigin: string;
  routeDestination: string;
  departureDate: string;
  departureTime: string;
  totalSeats: number;
  bookedSeats: number;
  availableSeats: number;
  revenue: number;
  status: string;
}

export default function BusScheduleTab() {
  const [buses, setBuses] = useState<ScheduleBus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch today's bus schedules from your API
    fetch("/api/fleet")
      .then(res => res.json())
      .then(data => {
        const today = new Date().toISOString().split("T")[0];
        const todaysBuses = data.filter((bus: any) =>
          bus.departureDate?.startsWith(today)
        );
        setBuses(todaysBuses);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse flex space-x-4">
          <Bus className="w-8 h-8 text-[#008e8e]" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-normal text-gray-800 flex items-center">
            <Bus className="w-5 h-5 mr-2 text-[#008e8e]" />
            Today's Fleet Operations
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" className="border-gray-200 text-gray-600 hover:bg-gray-50 text-sm">
            Filter Routes
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {buses.map(bus => (
          <div key={bus.id} className="bg-white rounded-lg border border-gray-100 hover:border-[#008e8e]/20 hover:shadow-sm transition-all duration-200">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-5">
              {/* Bus Identification */}
              <div className="md:col-span-3 flex items-center">
                <div className="bg-[#008e8e]/10 p-3 rounded-lg flex items-center justify-center">
                  <Bus className="w-6 h-6 text-[#008e8e]" />
                </div>
                <div className="ml-4">
                  <div className="font-medium text-gray-800">{bus.busNumber}</div>
                  <div className="text-xs text-gray-500">{bus.model}</div>
                </div>
              </div>

              {/* Route Information */}
              <div className="md:col-span-3 flex flex-col justify-center">
                <div className="flex items-center text-sm text-gray-700">
                  <MapPin className="w-4 h-4 text-[#008e8e] mr-1" />
                  {bus.routeOrigin} <ChevronRight className="w-3 h-3 mx-1 text-gray-400" /> {bus.routeDestination}
                </div>
                <div className="flex items-center text-xs text-gray-500 mt-1">
                  <Clock className="w-3 h-3 text-gray-400 mr-1" />
                  Departs at {bus.departureTime}
                </div>
              </div>

              {/* Occupancy */}
              <div className="md:col-span-3 flex flex-col justify-center">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Occupancy</span>
                  <span className="font-medium">
                    {bus.bookedSeats ?? 0}/{bus.totalSeats ?? 0} seats
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className="bg-[#008e8e] h-1.5 rounded-full"
                    style={{
                      width: `${bus.totalSeats && bus.bookedSeats
                        ? Math.round((bus.bookedSeats / bus.totalSeats) * 100)
                        : 0}%`
                    }}
                  ></div>
                </div>
              </div>

              {/* Revenue & Status */}
              <div className="md:col-span-3 flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500">Revenue</div>
                  <div className="text-sm font-medium text-gray-800">
                    BWP {(bus.revenue ?? 0).toLocaleString()}
                  </div>
                </div>
                <div className="flex space-x-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 text-gray-500 hover:bg-[#008e8e]/10 hover:text-[#008e8e]"
                    onClick={() => viewManifest(bus.id)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 text-gray-500 hover:bg-[#008e8e]/10 hover:text-[#008e8e]"
                    onClick={() => downloadManifest(bus.id)}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Status Indicator */}
            <div className={`px-5 py-2 text-xs font-medium border-t border-gray-100 ${
              bus.status === "Active" 
                ? "text-[#008e8e] bg-[#008e8e]/5" 
                : "text-gray-500 bg-gray-50"
            }`}>
              {bus.status} • Updated: {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Dummy handlers for manifest actions
function viewManifest(busId: string) {
  window.open(`/admin/manifest/${busId}`, "_blank");
}
function downloadManifest(busId: string) {
  window.open(`/admin/manifest/${busId}?download=true`, "_blank");
}