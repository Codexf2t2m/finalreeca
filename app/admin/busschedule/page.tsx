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
          <Bus className="w-8 h-8 text-teal-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
            <Bus className="w-6 h-6 mr-2 text-teal-600" />
            Today's Fleet Operations
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 text-sm">
            Filter Routes
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {buses.map(bus => (
          <div key={bus.id} className="bg-white rounded-lg border border-gray-200 hover:border-teal-200 hover:shadow-md transition-all duration-200 group">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-5">
              {/* Bus Identification */}
              <div className="md:col-span-3 flex items-center">
                <div className="bg-teal-100 p-3 rounded-lg flex items-center justify-center group-hover:bg-teal-200 transition-colors">
                  <Bus className="w-6 h-6 text-teal-700" />
                </div>
                <div className="ml-4">
                  <div className="font-semibold text-gray-900">{bus.busNumber}</div>
                  <div className="text-xs text-gray-500">{bus.model}</div>
                </div>
              </div>

              {/* Route Information */}
              <div className="md:col-span-3 flex flex-col justify-center">
                <div className="flex items-center text-sm text-gray-800 font-medium">
                  <MapPin className="w-4 h-4 text-teal-600 mr-1" />
                  {bus.routeOrigin} <ChevronRight className="w-3 h-3 mx-1 text-gray-400" /> {bus.routeDestination}
                </div>
                <div className="flex items-center text-xs text-gray-500 mt-1">
                  <Clock className="w-3 h-3 text-gray-500 mr-1" />
                  Departs at <span className="font-medium ml-1">{bus.departureTime}</span>
                </div>
              </div>

              {/* Occupancy */}
              <div className="md:col-span-3 flex flex-col justify-center">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span className="font-medium">Occupancy</span>
                  <span className="font-semibold">
                    {bus.bookedSeats ?? 0}/{bus.totalSeats ?? 0} seats
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-teal-500 to-teal-600 h-2 rounded-full"
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
                  <div className="text-xs text-gray-500 font-medium">Revenue</div>
                  <div className="text-sm font-bold text-teal-700">
                    BWP {(bus.revenue ?? 0).toLocaleString()}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-9 px-3 border-teal-200 text-teal-700 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-300 flex items-center"
                    onClick={() => viewManifest(bus.id)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Manifest
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-9 w-9 p-0 text-gray-500 hover:bg-teal-50 hover:text-teal-700 flex items-center justify-center"
                    onClick={() => downloadManifest(bus.id)}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Status Indicator */}
            <div className={`px-5 py-2 text-xs font-medium border-t rounded-b-lg ${
              bus.status === "Active" 
                ? "text-teal-800 bg-teal-50 border-teal-100" 
                : "text-gray-600 bg-gray-100 border-gray-200"
            }`}>
              <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                bus.status === "Active" ? "bg-teal-500" : "bg-gray-400"
              }`}></span>
              {bus.status} • Last updated: {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
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