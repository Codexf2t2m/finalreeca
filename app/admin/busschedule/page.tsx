'use client';
import { useEffect, useState } from "react";
import { Download, Eye } from "lucide-react";
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
    return <div className="text-center py-12 text-teal-600">Loading schedules...</div>;
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-teal-900 mb-4">Bus Schedules & Occupancy</h2>
      <div className="space-y-6">
        {buses.map(bus => (
          <div key={bus.id} className="bg-white rounded-xl shadow p-6 flex flex-col md:flex-row justify-between items-center gap-6">
            {/* Bus Info */}
            <div className="flex-1">
              <div className="font-bold text-lg text-teal-900">{bus.busNumber} <span className="font-normal text-gray-500">{bus.model}</span></div>
              <div className="flex items-center gap-2 text-gray-700 mt-1">
                <span>{bus.routeOrigin} &rarr; {bus.routeDestination}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 mt-1">
                <span>{bus.departureTime}</span>
                <span>|</span>
                <span>{new Date(bus.departureDate).toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
              </div>
            </div>
            {/* Occupancy */}
            <div className="flex-1 text-center">
              <div className="font-medium text-gray-700 mb-1">Seat Occupancy</div>
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Total Seats: <b>{bus.totalSeats ?? 0}</b></span>
                <span>Booked: <b>{bus.bookedSeats ?? 0}</b></span>
                <span>Available: <b>{bus.availableSeats ?? (bus.totalSeats ?? 0) - (bus.bookedSeats ?? 0)}</b></span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className="bg-teal-600 h-2 rounded-full"
                  style={{
                    width: `${
                      bus.totalSeats && bus.bookedSeats
                        ? Math.round((bus.bookedSeats / bus.totalSeats) * 100)
                        : 0
                    }%`
                  }}
                ></div>
              </div>
              <div className="text-xs text-teal-700">
                {bus.totalSeats && bus.bookedSeats
                  ? Math.round((bus.bookedSeats / bus.totalSeats) * 100)
                  : 0
                }%
              </div>
            </div>
            {/* Revenue & Actions */}
            <div className="flex-1 text-right">
              <div className="font-medium text-gray-700 mb-1">Revenue & Status</div>
              <div className="text-2xl font-bold text-teal-900 mb-1">
                P {(bus.revenue ?? 0).toLocaleString()}
              </div>
              <div className="mb-2">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${bus.status === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {bus.status}
                </span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex items-center gap-1" onClick={() => viewManifest(bus.id)}>
                  <Eye className="w-4 h-4" /> View Manifest
                </Button>
                <Button size="sm" variant="outline" className="flex items-center gap-1" onClick={() => downloadManifest(bus.id)}>
                  <Download className="w-4 h-4" /> Download Manifest
                </Button>
              </div>
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