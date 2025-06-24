"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { format, addMinutes } from "date-fns";

const serviceTypes = ["Morning", "Afternoon"];
const routeOptions = [
  "Gaborone → OR Tambo Airport",
  "OR Tambo Airport → Gaborone",
];

const defaultNewService = {
  serviceType: "",
  route: "",
  seats: 50,
  fare: 500,
  departureTime: "07:00",
  durationMinutes: 390,
  promoActive: false,
  serviceLeft: false,
  tripDate: "",
};

function formatDate(date: string | Date) {
  return format(new Date(date), "yyyy-MM-dd");
}

export default function ManageFleet() {
  const [fleet, setFleet] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [newService, setNewService] = useState({ ...defaultNewService });

  // Trips state
  const [trips, setTrips] = useState<any[]>([]);
  const [tripLoading, setTripLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("All");
  const [filterDate, setFilterDate] = useState<string>(formatDate(new Date()));
  const [showReminder, setShowReminder] = useState(false);

  useEffect(() => {
    fetchFleet();
    fetchTrips();
  }, []);

  async function fetchFleet() {
    setLoading(true);
    const res = await fetch("/api/fleet");
    const data = await res.json();
    setFleet(data);
    setLoading(false);
  }

  async function fetchTrips() {
    setTripLoading(true);
    const res = await fetch("/api/trips");
    const data = await res.json();
    setTrips(data);
    setTripLoading(false);

    // Reminder logic: show modal if less than 5 days of trips left
    const daysAhead = 5;
    const today = new Date();
    interface Trip {
      id: string;
      date: string | Date;
      availableSeats: number;
      promoActive: boolean;
      bus: Service;
    }

    interface Service {
      id: string;
      serviceType: string;
      route: string;
      seats: number;
      fare: number;
      departureTime: string;
      durationMinutes: number;
      promoActive: boolean;
      serviceLeft: boolean;
      tripDate: string | Date | null;
    }

    const lastTripDate: Date | null = data.length
      ? (data as Trip[]).map((t: Trip) => new Date(t.date)).sort((a, b) => b.getTime() - a.getTime())[0]
      : null;
    if (lastTripDate) {
      const diff = Math.ceil((lastTripDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (diff < daysAhead) setShowReminder(true);
    }
  }

  async function handleCreateService() {
    if (fleet.length >= 2) return;
    // Only send fields that exist in the schema
    const payload = {
      serviceType: newService.serviceType,
      route: newService.route,
      seats: newService.seats,
      fare: newService.fare,
      departureTime: newService.departureTime,
      durationMinutes: newService.durationMinutes,
      promoActive: newService.promoActive,
      serviceLeft: newService.serviceLeft,
      tripDate: newService.tripDate ? new Date(newService.tripDate) : null,
    };
    const res = await fetch("/api/fleet", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });
    if (res.ok) {
      setNewService({ ...defaultNewService });
      fetchFleet();
    }
  }

  async function handleUpdateService(serviceId: string, update: any) {
    // Only send fields that exist in the schema
    const allowedFields = [
      "serviceType",
      "route",
      "seats",
      "fare",
      "departureTime",
      "durationMinutes",
      "promoActive",
      "serviceLeft",
      "tripDate",
    ];
    const filteredUpdate: any = {};
    for (const key of allowedFields) {
      if (key in update) filteredUpdate[key] = update[key];
    }
    const res = await fetch("/api/fleet", {
      method: "PUT",
      body: JSON.stringify({ id: serviceId, ...filteredUpdate }),
      headers: { "Content-Type": "application/json" },
    });
    setEditingServiceId(null);
    fetchFleet();
  }

  async function handleDeleteService(serviceId: string) {
    await fetch("/api/fleet", {
      method: "DELETE",
      body: JSON.stringify({ id: serviceId }),
      headers: { "Content-Type": "application/json" },
    });
    fetchFleet();
  }

  // Auto-create trips for the next N days for all services
  async function handleAutoCreateTrips(days = 21) {
    await fetch("/api/trips/auto-create", {
      method: "POST",
      body: JSON.stringify({ days }),
      headers: { "Content-Type": "application/json" },
    });
    alert(`Trips created for the next ${days} days!`);
    fetchTrips();
  }

  function formatDuration(minutes: number) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h${m > 0 ? m + "min" : ""}`;
  }

  function getArrival(service: any) {
    if (!service.tripDate) return { date: "-", time: "-" };
    const [h, m] = service.departureTime.split(":").map(Number);
    const depDate = new Date(service.tripDate);
    depDate.setHours(h, m, 0, 0);
    const arrDate = addMinutes(depDate, service.durationMinutes);
    return {
      date: format(arrDate, "dd MMM yyyy"),
      time: format(arrDate, "HH:mm"),
    };
  }

  // Filtered trips
  const filteredTrips = trips.filter((trip: any) => {
    const matchesType = filterType === "All" || trip.bus.serviceType === filterType;
    const matchesDate = !filterDate || formatDate(trip.date) === filterDate;
    return matchesType && matchesDate;
  });

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold mb-6 text-teal-900">Manage Bus Services</h1>
      {/* Create New Service */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="font-semibold text-lg mb-4">Create New Service</h2>
        {fleet.length >= 2 ? (
          <div className="text-red-600 font-semibold mb-2">
            Only 2 services can be created. Delete a service to add another.
          </div>
        ) : (
          <>
            <div className="mb-2 font-semibold">Service Details</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* Service Type Dropdown */}
              <select
                className="border rounded px-2 py-1"
                value={newService.serviceType}
                onChange={e => setNewService(b => ({ ...b, serviceType: e.target.value }))}
              >
                <option value="">Select Service Type</option>
                {serviceTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              {/* Route Dropdown */}
              <select
                className="border rounded px-2 py-1"
                value={newService.route}
                onChange={e => setNewService(b => ({ ...b, route: e.target.value }))}
              >
                <option value="">Select Route</option>
                {routeOptions.map(route => (
                  <option key={route} value={route}>{route}</option>
                ))}
              </select>
              <input
                className="border rounded px-2 py-1"
                type="number"
                min={1}
                placeholder="Seats"
                value={newService.seats}
                onChange={(e) => setNewService((b) => ({ ...b, seats: Number(e.target.value) }))}
              />
              <input
                className="border rounded px-2 py-1"
                type="number"
                min={1}
                placeholder="Fare (P)"
                value={newService.fare}
                onChange={(e) => setNewService((b) => ({ ...b, fare: Number(e.target.value) }))}
              />
              <input
                className="border rounded px-2 py-1"
                type="text"
                placeholder="Departure Time (HH:mm)"
                value={newService.departureTime}
                onChange={(e) => setNewService((b) => ({ ...b, departureTime: e.target.value }))}
              />
              <input
                className="border rounded px-2 py-1"
                type="number"
                min={1}
                placeholder="Duration (minutes)"
                value={newService.durationMinutes}
                onChange={(e) => setNewService((b) => ({ ...b, durationMinutes: Number(e.target.value) }))}
              />
              <input
                className="border rounded px-2 py-1"
                type="date"
                value={newService.tripDate}
                onChange={(e) => setNewService((b) => ({ ...b, tripDate: e.target.value }))}
              />
            </div>
            <div className="mb-2 font-semibold">Promo</div>
            <label className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                checked={newService.promoActive}
                onChange={() =>
                  setNewService((b) => ({ ...b, promoActive: !b.promoActive }))
                }
              />
              <span className="text-sm font-medium text-blue-700">
                Activate Promo: 2+ seats at P350/seat
              </span>
            </label>
            <Button
              onClick={handleCreateService}
              className="bg-teal-600 text-white"
              disabled={fleet.length >= 2}
            >
              Create Service
            </Button>
          </>
        )}
      </div>
      <Button
        onClick={() => handleAutoCreateTrips(21)}
        className="bg-blue-600 text-white mb-8"
      >
        Auto-create Trips for Next 21 Days
      </Button>
      {/* Fleet List */}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="space-y-6">
          {fleet.map((service) => {
            const arrival = getArrival(service);
            const isEditing = editingServiceId === service.id;
            return (
              <div
                key={service.id}
                className="bg-white rounded-lg shadow p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <div className="flex-1">
                  <div className="font-bold text-lg">{service.serviceType} Bus</div>
                  <div className="text-sm text-gray-600 mb-2">{service.route}</div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm mb-2">
                    <div>
                      <div className="font-semibold">Departure</div>
                      <div>
                        <input
                          type="date"
                          className="border rounded px-2 py-1 w-full"
                          value={service.tripDate ? format(new Date(service.tripDate), "yyyy-MM-dd") : ""}
                          disabled={service.serviceLeft || !isEditing}
                          onChange={(e) =>
                            handleUpdateService(service.id, { tripDate: new Date(e.target.value) })
                          }
                        />
                      </div>
                      <div>
                        <input
                          type="time"
                          className="border rounded px-2 py-1 w-full"
                          value={service.departureTime}
                          disabled={service.serviceLeft || !isEditing}
                          onChange={(e) =>
                            handleUpdateService(service.id, { departureTime: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold">Duration</div>
                      {isEditing ? (
                        <input
                          type="number"
                          min={1}
                          className="border rounded px-2 py-1 w-full"
                          value={service.durationMinutes}
                          disabled={service.serviceLeft}
                          onChange={(e) =>
                            handleUpdateService(service.id, { durationMinutes: Number(e.target.value) })
                          }
                        />
                      ) : (
                        <div className="mt-2">{formatDuration(service.durationMinutes)}</div>
                      )}
                      <div className="text-xs text-gray-400">Non-stop journey</div>
                    </div>
                    <div>
                      <div className="font-semibold">Arrival</div>
                      <div className="mt-2">{arrival.date}</div>
                      <div>{arrival.time}</div>
                    </div>
                    <div>
                      <div className="font-semibold">Fare & Seats</div>
                      {isEditing ? (
                        <>
                          <input
                            type="number"
                            min={1}
                            className="border rounded px-2 py-1 w-full mb-1"
                            value={service.fare}
                            disabled={service.serviceLeft}
                            onChange={(e) =>
                              handleUpdateService(service.id, { fare: Number(e.target.value) })
                            }
                          />
                          <input
                            type="number"
                            min={1}
                            className="border rounded px-2 py-1 w-full"
                            value={service.seats}
                            disabled={service.serviceLeft}
                            onChange={(e) =>
                              handleUpdateService(service.id, { seats: Number(e.target.value) })
                            }
                          />
                        </>
                      ) : (
                        <>
                          <div className="mt-2">P {service.fare} / seat</div>
                          <div>Seats: {service.seats}</div>
                        </>
                      )}
                    </div>
                    <div>
                      <div className="font-semibold">Promo</div>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={service.promoActive}
                          disabled={service.serviceLeft || !isEditing}
                          onChange={() =>
                            handleUpdateService(service.id, { promoActive: !service.promoActive })
                          }
                        />
                        <span className="text-sm font-medium text-blue-700">
                          2+ seats at P350/seat
                        </span>
                      </label>
                      {service.promoActive && (
                        <span className="text-xs text-green-700 font-semibold">
                          Promo Active!
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 min-w-[140px]">
                  {service.serviceLeft ? (
                    <span className="px-4 py-2 bg-gray-200 text-gray-600 rounded font-semibold text-center">
                      Service Left
                    </span>
                  ) : (
                    <>
                      {isEditing ? (
                        <Button
                          className="bg-teal-600 text-white"
                          onClick={() => setEditingServiceId(null)}
                        >
                          Save
                        </Button>
                      ) : (
                        <Button
                          className="bg-blue-600 text-white"
                          onClick={() => setEditingServiceId(service.id)}
                        >
                          Update
                        </Button>
                      )}
                      <Button
                        className="bg-red-600 text-white"
                        onClick={() => handleUpdateService(service.id, { serviceLeft: true })}
                        disabled={!service.tripDate}
                      >
                        Mark as Service Left
                      </Button>
                      <Button
                        className="bg-gray-600 text-white"
                        onClick={() => handleDeleteService(service.id)}
                        disabled={service.serviceLeft}
                      >
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reminder Modal */}
      {showReminder && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md">
            <h2 className="text-xl font-bold mb-2 text-red-700">Auto-create Trips Reminder</h2>
            <p className="mb-4">
              Less than 5 days of trips are scheduled. Please run <b>Auto-create Trips</b> to ensure users can book in advance.
            </p>
            <Button
              className="bg-blue-600 text-white"
              onClick={() => {
                setShowReminder(false);
                handleAutoCreateTrips(21);
              }}
            >
              Auto-create Trips for Next 21 Days
            </Button>
            <Button
              className="ml-2"
              onClick={() => setShowReminder(false)}
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* Trips Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="font-semibold text-lg mb-4">Scheduled Trips</h2>
        <div className="flex gap-4 mb-4 flex-wrap">
          <select
            className="border rounded px-2 py-1"
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
          >
            <option value="All">All Types</option>
            <option value="Morning">Morning</option>
            <option value="Afternoon">Afternoon</option>
          </select>
          <input
            type="date"
            className="border rounded px-2 py-1"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
          />
          <Button onClick={fetchTrips}>Refresh</Button>
        </div>
        {tripLoading ? (
          <div>Loading trips...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-2 py-1 border">Date</th>
                  <th className="px-2 py-1 border">Service</th>
                  <th className="px-2 py-1 border">Route</th>
                  <th className="px-2 py-1 border">Departure</th>
                  <th className="px-2 py-1 border">Seats</th>
                  <th className="px-2 py-1 border">Promo</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrips.map((trip: any) => (
                  <tr key={trip.id} className="hover:bg-gray-50">
                    <td className="border px-2 py-1">{formatDate(trip.date)}</td>
                    <td className="border px-2 py-1">{trip.bus.serviceType}</td>
                    <td className="border px-2 py-1">{trip.bus.route}</td>
                    <td className="border px-2 py-1">{trip.bus.departureTime}</td>
                    <td className="border px-2 py-1">{trip.availableSeats}</td>
                    <td className="border px-2 py-1">
                      {trip.promoActive ? (
                        <span className="text-green-700 font-semibold">Promo</span>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}
                {filteredTrips.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-gray-400">
                      No trips found for selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}