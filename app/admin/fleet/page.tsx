'use client';
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Trip {
  id?: string;
  routeName: string;
  departureDate: string;
  departureTime: string;
  totalSeats: number;
  availableSeats: number;
  serviceType: string;
  fare: number;
  durationMinutes: number;
  promoActive: boolean;
  hasDeparted: boolean;
  routeOrigin: string;
  routeDestination: string;
  boardingPoint: string;
  droppingPoint: string;
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

const LoadingSpinner = () => (
  <div className="flex justify-center items-center">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

const ErrorModal = ({ message, onClose }: { message: string | null; onClose: () => void }) => (
  <Dialog open={!!message} onOpenChange={onClose}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Error</DialogTitle>
      </DialogHeader>
      <p className="text-red-600">{message}</p>
      <Button onClick={onClose} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white">
        Close
      </Button>
    </DialogContent>
  </Dialog>
);

const AutomateTripsModal: React.FC<AutomateTripsModalProps> = ({ isOpen, onClose, onSave, routes, times }) => {
  const [baseTrips, setBaseTrips] = useState<Trip[]>([]);

  useEffect(() => {
    if (isOpen) {
      const initialBaseTrips: Trip[] = [
        {
          routeName: routes[0]?.name || '',
          departureTime: times[0]?.time || '07:00',
          totalSeats: 60,
          availableSeats: 60,
          serviceType: 'Morning Bus',
          fare: 500,
          durationMinutes: 480,
          promoActive: false,
          hasDeparted: false,
          routeOrigin: 'Gaborone',
          routeDestination: 'OR Tambo Airport',
          boardingPoint: 'Gaborone Station',
          droppingPoint: 'OR Tambo Airport',
          departureDate: new Date().toISOString()
        },
        {
          routeName: routes[0]?.name || '',
          departureTime: times[1]?.time || '15:00',
          totalSeats: 60,
          availableSeats: 60,
          serviceType: 'Afternoon Bus',
          fare: 500,
          durationMinutes: 480,
          promoActive: false,
          hasDeparted: false,
          routeOrigin: 'Gaborone',
          routeDestination: 'OR Tambo Airport',
          boardingPoint: 'Gaborone Station',
          droppingPoint: 'OR Tambo Airport',
          departureDate: new Date().toISOString()
        },
        {
          routeName: routes[1]?.name || '',
          departureTime: times[2]?.time || '08:00',
          totalSeats: 60,
          availableSeats: 60,
          serviceType: 'Morning Bus',
          fare: 500,
          durationMinutes: 480,
          promoActive: false,
          hasDeparted: false,
          routeOrigin: 'OR Tambo Airport',
          routeDestination: 'Gaborone',
          boardingPoint: 'OR Tambo Airport',
          droppingPoint: 'Gaborone Station',
          departureDate: new Date().toISOString()
        },
        {
          routeName: routes[1]?.name || '',
          departureTime: times[3]?.time || '17:00',
          totalSeats: 60,
          availableSeats: 60,
          serviceType: 'Afternoon Bus',
          fare: 500,
          durationMinutes: 480,
          promoActive: false,
          hasDeparted: false,
          routeOrigin: 'OR Tambo Airport',
          routeDestination: 'Gaborone',
          boardingPoint: 'OR Tambo Airport',
          droppingPoint: 'Gaborone Station',
          departureDate: new Date().toISOString()
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

  const handleSave = async () => {
    const generateYearlyTrips = (): Trip[] => {
      const trips: Trip[] = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let i = 0; i < 365; i++) {
        const tripDate = new Date(today);
        tripDate.setDate(today.getDate() + i);

        baseTrips.forEach((baseTrip) => {
          const [hours, minutes] = baseTrip.departureTime.split(':').map(Number);
          const departureDateTime = new Date(tripDate);
          departureDateTime.setHours(hours, minutes, 0, 0);

          const newTrip = {
            ...baseTrip,
            departureDate: departureDateTime.toISOString()
          };
          trips.push(newTrip);
        });
      }
      return trips;
    };

    const tripsToSave = generateYearlyTrips();
    onSave(tripsToSave);
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
            <div key={index} className="border p-4 rounded-lg shadow-sm">
              <h3 className="font-bold text-lg">{trip.routeName} - {trip.departureTime}</h3>
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
                      <SelectItem value="Morning Bus">Morning Bus</SelectItem>
                      <SelectItem value="Afternoon Bus">Afternoon Bus</SelectItem>
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
          Save and Generate Yearly Trips
        </Button>
      </DialogContent>
    </Dialog>
  );
};

const TripForm: React.FC<TripFormProps> = ({ trip, onSave, routes, times }) => {
  const [formData, setFormData] = useState<Trip>(
    trip || {
      routeName: '',
      departureDate: new Date().toISOString(),
      departureTime: '',
      totalSeats: 60,
      availableSeats: 60,
      serviceType: 'Morning Bus',
      fare: 500,
      durationMinutes: 480,
      promoActive: false,
      hasDeparted: false,
      routeOrigin: '',
      routeDestination: '',
      boardingPoint: '',
      droppingPoint: '',
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
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Route</label>
        <Select
          onValueChange={(value) => {
            setFormData({ ...formData, routeName: value });
          }}
          value={formData.routeName}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a route" />
          </SelectTrigger>
          <SelectContent>
            {routes.map((route) => (
              <SelectItem key={route.id} value={route.name}>{route.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Date</label>
        <Input
          name="departureDate"
          type="date"
          value={new Date(formData.departureDate).toISOString().split('T')[0]}
          onChange={(e) => {
            setFormData({
              ...formData,
              departureDate: new Date(e.target.value).toISOString()
            });
          }}
          required
        />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Departure Time</label>
        <Select
          onValueChange={(value) => {
            setFormData({ ...formData, departureTime: value });
          }}
          value={formData.departureTime}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select departure time" />
          </SelectTrigger>
          <SelectContent>
            {times.map((time) => (
              <SelectItem key={time.id} value={time.time}>{time.time}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Available Seats</label>
        <Input
          name="availableSeats"
          type="number"
          value={formData.availableSeats}
          onChange={handleInputChange}
          placeholder="Available Seats"
          required
        />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Total Seats</label>
        <Input
          name="totalSeats"
          type="number"
          value={formData.totalSeats}
          onChange={handleInputChange}
          placeholder="Total Seats"
          required
        />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Service Type</label>
        <Select
          onValueChange={(value) => {
            setFormData({ ...formData, serviceType: value });
          }}
          value={formData.serviceType}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select service type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Morning Bus">Morning Bus</SelectItem>
            <SelectItem value="Afternoon Bus">Afternoon Bus</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Fare</label>
        <Input
          name="fare"
          type="number"
          value={formData.fare}
          onChange={handleInputChange}
          placeholder="Fare"
          required
        />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Duration (Minutes)</label>
        <Input
          name="durationMinutes"
          type="number"
          value={formData.durationMinutes}
          onChange={handleInputChange}
          placeholder="Duration in Minutes"
          required
        />
      </div>
      <div className="flex items-center space-x-2 pt-2">
        <Checkbox
          id="promoActive"
          checked={formData.promoActive}
          onCheckedChange={(checked: boolean) => {
            setFormData({ ...formData, promoActive: checked });
          }}
        />
        <label htmlFor="promoActive" className="text-sm font-medium text-gray-700">Promo Active</label>
      </div>
      <div className="flex items-center space-x-2 pt-2">
        <Checkbox
          id="hasDeparted"
          checked={formData.hasDeparted}
          onCheckedChange={(checked: boolean) => {
            setFormData({ ...formData, hasDeparted: checked });
          }}
          disabled={!!trip}
        />
        <label htmlFor="hasDeparted" className="text-sm font-medium text-gray-700">Has Departed</label>
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Route Origin</label>
        <Input
          name="routeOrigin"
          value={formData.routeOrigin || ''}
          onChange={handleInputChange}
          placeholder="Route Origin"
        />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Route Destination</label>
        <Input
          name="routeDestination"
          value={formData.routeDestination || ''}
          onChange={handleInputChange}
          placeholder="Route Destination"
        />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Boarding Point</label>
        <Input
          name="boardingPoint"
          value={formData.boardingPoint || ''}
          onChange={handleInputChange}
          placeholder="Boarding Point"
        />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Dropping Point</label>
        <Input
          name="droppingPoint"
          value={formData.droppingPoint || ''}
          onChange={handleInputChange}
          placeholder="Dropping Point"
        />
      </div>
      <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white w-full">
        {trip ? 'Update Trip' : 'Create Trip'}
      </Button>
    </form>
  );
};

const FleetManagementPage = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedRoute, setSelectedRoute] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAutomateModalOpen, setIsAutomateModalOpen] = useState(false);
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/trips');
      if (!response.ok) {
        throw new Error('Failed to fetch trips');
      }
      const data = await response.json();
      setTrips(data);
    } catch (error) {
      console.error('Error fetching trips:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutomateWeeklyTrips = () => {
    setIsAutomateModalOpen(true);
  };

  const handleSaveAutomatedTrips = async (newTrips: Trip[]) => {
    setIsLoading(true);
    try {
      for (const trip of newTrips) {
        const response = await fetch('/api/trips', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(trip),
        });
        if (!response.ok) {
          throw new Error('Failed to save trip');
        }
      }
      fetchTrips();
    } catch (error) {
      console.error('Error saving trips:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (trip: Trip | null = null) => {
    if (trip && trip.hasDeparted) return;
    setCurrentTrip(trip);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentTrip(null);
  };

  const handleSaveTrip = async (trip: Trip) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/trips', {
        method: trip.id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(trip),
      });
      if (!response.ok) {
        throw new Error('Failed to save trip');
      }
      const data = await response.json();
      setTrips(prevTrips => {
        if (trip.id) {
          return prevTrips.map(t => t.id === trip.id ? data : t);
        } else {
          return [...prevTrips, data];
        }
      });
      handleCloseModal();
    } catch (error) {
      console.error('Error saving trip:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkDeparted = async (tripId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/trips', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: tripId, hasDeparted: true }),
      });
      if (!response.ok) {
        throw new Error('Failed to mark trip as departed');
      }
      const data = await response.json();
      setTrips(prevTrips => prevTrips.map(t => t.id === tripId ? data : t));
    } catch (error) {
      console.error('Error marking trip as departed:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTrip = async (tripId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/trips', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: tripId }),
      });
      if (!response.ok) {
        throw new Error('Failed to delete trip');
      }
      setTrips(prevTrips => prevTrips.filter(t => t.id !== tripId));
    } catch (error) {
      console.error('Error deleting trip:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTrips = trips.filter(trip => {
    const tripDate = new Date(trip.departureDate);
    const selectedDateStart = new Date(selectedDate);
    selectedDateStart.setHours(0, 0, 0, 0);
    const selectedDateEnd = new Date(selectedDate);
    selectedDateEnd.setHours(23, 59, 59, 999);
    return tripDate >= selectedDateStart && tripDate <= selectedDateEnd;
  });

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-amber-50 to-teal-50">
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b shadow-sm">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-xl font-bold text-teal-900">Fleet Management Dashboard</h1>
            <div className="flex space-x-2">
              <Button onClick={handleAutomateWeeklyTrips} className="bg-blue-600 hover:bg-blue-700 text-white">
                Automate Trips
              </Button>
              <Button onClick={() => handleOpenModal()} className="bg-green-600 hover:bg-green-700 text-white">
                Add Trip
              </Button>
            </div>
          </div>
        </header>
        <div className="container mx-auto px-4 py-8 flex-1">
          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <Tabs defaultValue="schedule">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="schedule">Daily Schedule</TabsTrigger>
                <TabsTrigger value="timetable">Route Timetable</TabsTrigger>
              </TabsList>
              <TabsContent value="schedule">
                <h2 className="text-2xl font-bold mb-4">Daily Schedule</h2>
                <div className="mb-4">
                  <Input
                    type="date"
                    value={selectedDate.toISOString().split('T')[0]}
                    onChange={(e) => setSelectedDate(new Date(e.target.value))}
                    className="w-64"
                  />
                </div>
                {filteredTrips.length === 0 ? (
                  <p className="text-center text-gray-500">No trips at this time</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Route</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Seats</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTrips.map((trip) => (
                        <TableRow key={trip.id}>
                          <TableCell>{trip.routeName}</TableCell>
                          <TableCell>{new Date(trip.departureDate).toLocaleDateString()}</TableCell>
                          <TableCell>{trip.departureTime}</TableCell>
                          <TableCell>{trip.serviceType}</TableCell>
                          <TableCell>{trip.availableSeats}/{trip.totalSeats}</TableCell>
                          <TableCell>{trip.hasDeparted ? 'Departed' : 'Scheduled'}</TableCell>
                          <TableCell className="flex space-x-2">
                            <Button
                              onClick={() => handleOpenModal(trip)}
                              className="mr-2"
                              disabled={trip.hasDeparted}
                              size="sm"
                            >
                              Edit
                            </Button>
                            {!trip.hasDeparted && (
                              <>
                                <Button
                                  onClick={() => handleMarkDeparted(trip.id!)}
                                  size="sm"
                                  className="bg-yellow-500 hover:bg-yellow-600"
                                >
                                  Mark Departed
                                </Button>
                                <Button
                                  onClick={() => handleDeleteTrip(trip.id!)}
                                  size="sm"
                                  className="bg-red-500 hover:bg-red-600"
                                >
                                  Delete
                                </Button>
                              </>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
              <TabsContent value="timetable">
                <h2 className="text-2xl font-bold mb-4">Route Timetable</h2>
                <div className="mb-4 flex space-x-4">
                  <Select onValueChange={setSelectedRoute}>
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="Select a route" />
                    </SelectTrigger>
                    <SelectContent>
                      {routes.map((route) => (
                        <SelectItem key={route.id} value={route.name}>{route.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="date"
                    value={selectedDate.toISOString().split('T')[0]}
                    onChange={(e) => setSelectedDate(new Date(e.target.value))}
                    className="w-64"
                  />
                </div>
                {filteredTrips.filter(trip => selectedRoute ? trip.routeName === selectedRoute : true).length === 0 ? (
                  <p className="text-center text-gray-500">No trips at this time</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Route</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Seats</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTrips
                        .filter(trip => selectedRoute ? trip.routeName === selectedRoute : true)
                        .map((trip) => (
                          <TableRow key={trip.id}>
                            <TableCell>{trip.routeName}</TableCell>
                            <TableCell>{new Date(trip.departureDate).toLocaleDateString()}</TableCell>
                            <TableCell>{trip.departureTime}</TableCell>
                            <TableCell>{trip.serviceType}</TableCell>
                            <TableCell>{trip.availableSeats}/{trip.totalSeats}</TableCell>
                            <TableCell className="flex space-x-2">
                              <Button
                                onClick={() => handleOpenModal(trip)}
                                disabled={trip.hasDeparted}
                                size="sm"
                              >
                                Edit
                              </Button>
                              {!trip.hasDeparted && (
                                <Button
                                  onClick={() => handleDeleteTrip(trip.id!)}
                                  size="sm"
                                  className="bg-red-500 hover:bg-red-600"
                                >
                                  Delete
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{currentTrip ? 'Edit Trip' : 'Add Trip'}</DialogTitle>
          </DialogHeader>
          {currentTrip && currentTrip.hasDeparted ? (
            <div className="text-red-600 font-semibold py-8 text-center">
              This trip has already departed and cannot be edited.
            </div>
          ) : (
            <TripForm
              trip={currentTrip}
              onSave={handleSaveTrip}
              routes={routes}
              times={times}
            />
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
      <ErrorModal message={error} onClose={() => setError(null)} />
    </div>
  );
};

export default FleetManagementPage;
