'use client';
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Define interfaces for your data structures
interface Trip {
  id: string;
  route: string;
  date: string;
  departureTime: string;
  availableSeats: number;
  serviceType: string;
  fare: number;
  durationMinutes: number;
  promoActive: boolean;
  hasDeparted: boolean;
}

interface Route {
  id: string;
  name: string;
}

interface Time {
  id: string;
  time: string;
}

interface TripFormProps {
  trip: Trip | null;
  onSave: (trip: Trip) => void;
  routes: Route[];
  times: Time[];
}

interface AutomateTripsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (trips: Trip[]) => void;
  routes: Route[];
  times: Time[];
}

const AutomateTripsModal: React.FC<AutomateTripsModalProps> = ({ isOpen, onClose, onSave, routes, times }) => {
  const [baseTrips, setBaseTrips] = useState<Trip[]>([]);

  useEffect(() => {
    if (isOpen) {
      const initialBaseTrips: Trip[] = [
        {
          id: '1',
          route: routes[0].name,
          date: new Date().toISOString().split('T')[0],
          departureTime: times[0].time,
          availableSeats: 50,
          serviceType: 'Morning',
          fare: 400,
          durationMinutes: 480,
          promoActive: false,
          hasDeparted: false,
        },
        {
          id: '2',
          route: routes[0].name,
          date: new Date().toISOString().split('T')[0],
          departureTime: times[1].time,
          availableSeats: 50,
          serviceType: 'Afternoon',
          fare: 400,
          durationMinutes: 480,
          promoActive: false,
          hasDeparted: false,
        },
        {
          id: '3',
          route: routes[1].name,
          date: new Date().toISOString().split('T')[0],
          departureTime: times[2].time,
          availableSeats: 50,
          serviceType: 'Morning',
          fare: 400,
          durationMinutes: 480,
          promoActive: false,
          hasDeparted: false,
        },
        {
          id: '4',
          route: routes[1].name,
          date: new Date().toISOString().split('T')[0],
          departureTime: times[3].time,
          availableSeats: 50,
          serviceType: 'Afternoon',
          fare: 400,
          durationMinutes: 480,
          promoActive: false,
          hasDeparted: false,
        },
      ];
      setBaseTrips(initialBaseTrips);
    }
  }, [isOpen, routes, times]);

  const handleInputChange = (index: number, field: string, value: any) => {
    const updatedBaseTrips = [...baseTrips];
    updatedBaseTrips[index] = { ...updatedBaseTrips[index], [field]: value };
    setBaseTrips(updatedBaseTrips);
  };

  const handleSave = () => {
    const generateWeeklyTrips = (): Trip[] => {
      const trips: Trip[] = [];
      const date = new Date();
      for (let i = 0; i < 14; i++) {
        const currentDate = new Date(date);
        currentDate.setDate(currentDate.getDate() + i);

        baseTrips.forEach((trip: Trip) => {
          trips.push({
            ...trip,
            id: `${currentDate.toISOString().split('T')[0]}-${trip.route}-${trip.departureTime}`,
            date: currentDate.toISOString().split('T')[0],
          });
        });
      }
      return trips;
    };

    onSave(generateWeeklyTrips());
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-full max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Base Trips</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {baseTrips.map((trip, index) => (
            <div key={trip.id} className="border p-4 rounded-lg shadow-sm">
              <h3 className="font-bold text-lg">{trip.route} - {trip.departureTime}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Available Seats</label>
                  <Input
                    type="number"
                    value={trip.availableSeats}
                    onChange={(e) => handleInputChange(index, 'availableSeats', parseInt(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Service Type</label>
                  <Select
                    value={trip.serviceType}
                    onValueChange={(value) => handleInputChange(index, 'serviceType', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select service type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Morning">Morning</SelectItem>
                      <SelectItem value="Afternoon">Afternoon</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fare</label>
                  <Input
                    type="number"
                    value={trip.fare}
                    onChange={(e) => handleInputChange(index, 'fare', parseInt(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Duration (Minutes)</label>
                  <Input
                    type="number"
                    value={trip.durationMinutes}
                    onChange={(e) => handleInputChange(index, 'durationMinutes', parseInt(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`promoActive-${index}`}
                    checked={trip.promoActive}
                    onCheckedChange={(checked) => handleInputChange(index, 'promoActive', checked)}
                  />
                  <label htmlFor={`promoActive-${index}`} className="text-sm font-medium text-gray-700">Promo Active</label>
                </div>
              </div>
            </div>
          ))}
        </div>
        <Button onClick={handleSave} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white">
          Save and Generate Weekly Trips
        </Button>
      </DialogContent>
    </Dialog>
  );
};

const FleetManagementPage = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedRoute, setSelectedRoute] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAutomateModalOpen, setIsAutomateModalOpen] = useState(false);
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);

  const routes: Route[] = [
    { id: '1', name: 'Gaborone to OR Tambo Airport' },
    { id: '2', name: 'OR Tambo Airport to Gaborone' },
  ];

  const times: Time[] = [
    { id: '1', time: '07:00' },
    { id: '2', time: '15:00' },
    { id: '3', time: '08:00' },
    { id: '4', time: '17:00' },
  ];

  const handleAutomateWeeklyTrips = () => {
    setIsAutomateModalOpen(true);
  };

  const handleSaveAutomatedTrips = (newTrips: Trip[]) => {
    setTrips([...trips, ...newTrips]);
  };

  const handleOpenModal = (trip: Trip | null = null) => {
    // Prevent editing if trip has departed
    if (trip && trip.hasDeparted) return;
    setCurrentTrip(trip);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentTrip(null);
  };

  const handleSaveTrip = (trip: Trip) => {
    if (currentTrip) {
      setTrips(trips.map(t => t.id === trip.id ? trip : t));
    } else {
      setTrips([...trips, trip]);
    }
    handleCloseModal();
  };

  const handleMarkDeparted = (tripId: string) => {
    setTrips(trips.map(trip =>
      trip.id === tripId ? { ...trip, hasDeparted: true } : trip
    ));
  };

  const filteredTrips = trips.filter(trip => {
    const tripDate = new Date(trip.date);
    const selectedDateStart = new Date(selectedDate);
    selectedDateStart.setHours(0, 0, 0, 0);
    const selectedDateEnd = new Date(selectedDate);
    selectedDateEnd.setHours(23, 59, 59, 999);

    return tripDate >= selectedDateStart && tripDate <= selectedDateEnd;
  });

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-amber-50 to-teal-50">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b shadow-sm">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-xl font-bold text-teal-900">Fleet Management Dashboard</h1>
            <div>
              <Button onClick={handleAutomateWeeklyTrips} className="bg-blue-600 hover:bg-blue-700 text-white">
                Automate Trips
              </Button>
            </div>
          </div>
        </header>
        <div className="container mx-auto px-4 py-8 flex-1">
          <Tabs defaultValue="schedule">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="schedule">Daily Schedule</TabsTrigger>
              <TabsTrigger value="timetable">Route Timetable</TabsTrigger>
            </TabsList>

            <TabsContent value="schedule">
              <h2 className="text-2xl font-bold mb-4">Daily Schedule</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Route</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Departure Time</TableHead>
                    <TableHead>Available Seats</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTrips.map((trip) => (
                    <TableRow key={trip.id}>
                      <TableCell>{trip.route}</TableCell>
                      <TableCell>{trip.date}</TableCell>
                      <TableCell>{trip.departureTime}</TableCell>
                      <TableCell>{trip.availableSeats}</TableCell>
                      <TableCell>{trip.hasDeparted ? 'Departed' : 'Not Departed'}</TableCell>
                      <TableCell>
                        <Button
                          onClick={() => handleOpenModal(trip)}
                          className="mr-2"
                          disabled={trip.hasDeparted}
                        >
                          Edit
                        </Button>
                        {!trip.hasDeparted && (
                          <Button onClick={() => handleMarkDeparted(trip.id)}>Mark as Departed</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="timetable">
              <h2 className="text-2xl font-bold mb-4">Route Timetable</h2>
              <div className="mb-4 flex space-x-4">
                <Select onValueChange={setSelectedRoute}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a route" />
                  </SelectTrigger>
                  <SelectContent>
                    {routes.map((route) => (
                      <SelectItem key={route.id} value={route.name}>{route.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input type="date" value={selectedDate.toISOString().split('T')[0]} onChange={(e) => setSelectedDate(new Date(e.target.value))} />
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Route</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Departure Time</TableHead>
                    <TableHead>Available Seats</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTrips.filter(trip => selectedRoute ? trip.route === selectedRoute : true).map((trip) => (
                    <TableRow key={trip.id}>
                      <TableCell>{trip.route}</TableCell>
                      <TableCell>{trip.date}</TableCell>
                      <TableCell>{trip.departureTime}</TableCell>
                      <TableCell>{trip.availableSeats}</TableCell>
                      <TableCell>
                        <Button
                          onClick={() => handleOpenModal(trip)}
                          disabled={trip.hasDeparted}
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentTrip ? 'Edit Trip' : 'Add Trip'}</DialogTitle>
          </DialogHeader>
          {/* If editing a departed trip, don't show the form */}
          {currentTrip && currentTrip.hasDeparted ? (
            <div className="text-red-600 font-semibold py-8 text-center">
              This trip has already departed and cannot be edited.
            </div>
          ) : (
            <TripForm trip={currentTrip} onSave={handleSaveTrip} routes={routes} times={times} />
          )}
        </DialogContent>
      </Dialog>

      <AutomateTripsModal
        isOpen={isAutomateModalOpen}
        onClose={() => setIsAutomateModalOpen(false)}
        onSave={handleSaveAutomatedTrips}
        routes={routes}
        times={times}
      />
    </div>
  );
};

const TripForm: React.FC<TripFormProps> = ({ trip, onSave, routes, times }) => {
  const [formData, setFormData] = useState<Trip>(
    trip || {
      id: '',
      route: '',
      date: new Date().toISOString().split('T')[0],
      departureTime: '',
      availableSeats: 0,
      serviceType: '',
      fare: 0,
      durationMinutes: 0,
      promoActive: false,
      hasDeparted: false,
    }
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : false;

    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Select onValueChange={(value) => setFormData({ ...formData, route: value })} value={formData.route}>
        <SelectTrigger>
          <SelectValue placeholder="Select a route" />
        </SelectTrigger>
        <SelectContent>
          {routes.map((route) => (
            <SelectItem key={route.id} value={route.name}>{route.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input name="date" type="date" value={formData.date} onChange={handleInputChange} required />
      <Select onValueChange={(value) => setFormData({ ...formData, departureTime: value })} value={formData.departureTime}>
        <SelectTrigger>
          <SelectValue placeholder="Select departure time" />
        </SelectTrigger>
        <SelectContent>
          {times.map((time) => (
            <SelectItem key={time.id} value={time.time}>{time.time}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input name="availableSeats" type="number" value={formData.availableSeats} onChange={handleInputChange} placeholder="Available Seats" required />
      <Input name="serviceType" value={formData.serviceType} onChange={handleInputChange} placeholder="Service Type" required />
      <Input name="fare" type="number" value={formData.fare} onChange={handleInputChange} placeholder="Fare" required />
      <Input name="durationMinutes" type="number" value={formData.durationMinutes} onChange={handleInputChange} placeholder="Duration in Minutes" required />
      <div className="flex items-center space-x-2">
        <Checkbox id="promoActive" checked={formData.promoActive} onCheckedChange={(checked: boolean) => setFormData({ ...formData, promoActive: checked })} />
        <label htmlFor="promoActive">Promo Active</label>
      </div>
      <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">Save Trip</Button>
    </form>
  );
};

export default FleetManagementPage;
