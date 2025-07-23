'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

interface Trip {
  id?: string;
  serviceType: string;
  routeName: string;
  routeOrigin: string;
  routeDestination: string;
  departureDate: string | Date;
  departureTime: string;
  totalSeats: number;
  availableSeats: number;
  fare: number;
  durationMinutes: number;
  boardingPoint: string;
  droppingPoint: string;
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
  onSave: (trips: Trip[], startDate: string, endDate: string) => void;
  routes: Route[];
  times: Time[];
  lastTripDate: string | null;
}

interface BulkUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: any) => void;
  routes: Route[];
  times: Time[];
}

interface SQLQueryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExecute: (query: string) => void;
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

const SQLQueryModal: React.FC<SQLQueryModalProps> = ({ isOpen, onClose, onExecute }) => {
  const [query, setQuery] = useState('');
  const [queryType, setQueryType] = useState('custom');

  const predefinedQueries = {
    createTrips: `-- Create trips for a date range
WITH dates AS (
  SELECT generate_series(
    DATE '2025-07-25',
    DATE '2026-02-25',
    INTERVAL '1 day'
  ) AS trip_date
),
base_trips AS (
  SELECT
    'Gaborone to OR Tambo Airport' AS "routeName",
    '07:00' AS "departureTime",
    'Morning Bus' AS "serviceType",
    'Gaborone' AS "routeOrigin",
    'OR Tambo Airport' AS "routeDestination",
    'Mogobe Plaza' AS "boardingPoint",
    'OR Tambo Airport' AS "droppingPoint"
  UNION ALL
  SELECT
    'Gaborone to OR Tambo Airport', '15:00', 'Afternoon Bus',
    'Gaborone', 'OR Tambo Airport', 'Mogobe Plaza', 'OR Tambo Airport'
  UNION ALL
  SELECT
    'OR Tambo Airport to Gaborone', '08:00', 'Morning Bus',
    'OR Tambo Airport', 'Gaborone', 'OR Tambo Airport', 'Mogobe Plaza'
  UNION ALL
  SELECT
    'OR Tambo Airport to Gaborone', '17:00', 'Afternoon Bus',
    'OR Tambo Airport', 'Gaborone', 'OR Tambo Airport', 'Mogobe Plaza'
)
INSERT INTO public."Trip" (
  id, "availableSeats", "routeOrigin", "routeDestination", "departureTime",
  "createdAt", "updatedAt", "boardingPoint", "departureDate",
  "droppingPoint", "durationMinutes", fare, "hasDeparted",
  "occupiedSeats", "promoActive", "routeName", "serviceType", "totalSeats"
)
SELECT
  gen_random_uuid()::text AS id,
  60 AS "availableSeats",
  bt."routeOrigin",
  bt."routeDestination",
  bt."departureTime",
  NOW() AS "createdAt",
  NOW() AS "updatedAt",
  bt."boardingPoint",
  (d.trip_date + bt."departureTime"::time) AS "departureDate",
  bt."droppingPoint",
  390 AS "durationMinutes",
  500 AS fare,
  false AS "hasDeparted",
  NULL AS "occupiedSeats",
  false AS "promoActive",
  bt."routeName",
  bt."serviceType",
  60 AS "totalSeats"
FROM dates d
CROSS JOIN base_trips bt;`,

    updateFares: `-- Update fares for specific routes and time periods
UPDATE public."Trip"
SET fare = 550, "updatedAt" = NOW()
WHERE "routeName" = 'Gaborone to OR Tambo Airport'
  AND "departureDate" >= '2025-07-25'
  AND "hasDeparted" = false;`,

    updateSeats: `-- Update available seats for all future trips
UPDATE public."Trip"
SET "availableSeats" = 55, "totalSeats" = 55, "updatedAt" = NOW()
WHERE "departureDate" >= CURRENT_DATE
  AND "hasDeparted" = false;`,

    deleteFutureTrips: `-- Delete all future trips that haven't departed
DELETE FROM public."Trip"
WHERE "departureDate" >= CURRENT_DATE
  AND "hasDeparted" = false;`,

    getLastTripDate: `-- Get the last trip date in the database
SELECT MAX("departureDate") as last_trip_date
FROM public."Trip";`
  };

  const handleQueryTypeChange = (type: string) => {
    setQueryType(type);
    if (type !== 'custom') {
      setQuery(predefinedQueries[type as keyof typeof predefinedQueries] || '');
    } else {
      setQuery('');
    }
  };

  const handleExecute = () => {
    onExecute(query);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Execute SQL Query</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Query Type</label>
            <Select value={queryType} onValueChange={handleQueryTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select query type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Custom Query</SelectItem>
                <SelectItem value="createTrips">Create Trips for Date Range</SelectItem>
                <SelectItem value="updateFares">Update Fares</SelectItem>
                <SelectItem value="updateSeats">Update Seats</SelectItem>
                <SelectItem value="deleteFutureTrips">Delete Future Trips</SelectItem>
                <SelectItem value="getLastTripDate">Get Last Trip Date</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">SQL Query</label>
            <Textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter your SQL query here..."
              rows={15}
              className="font-mono text-sm"
            />
          </div>
          <div className="flex space-x-2">
            <Button onClick={handleExecute} className="bg-green-600 hover:bg-green-700 text-white">
              Execute Query
            </Button>
            <Button onClick={onClose} variant="outline">
              Cancel
            </Button>
          </div>
          <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded">
            <strong>Warning:</strong> Be careful when executing SQL queries directly.
            Make sure to backup your data before running destructive operations.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const BulkUpdateModal: React.FC<BulkUpdateModalProps> = ({ isOpen, onClose, onSave, routes, times }) => {
  const [updateType, setUpdateType] = useState('');
  const [filters, setFilters] = useState({
    routeName: 'all',
    startDate: '',
    endDate: '',
    hasDeparted: false
  });
  const [updates, setUpdates] = useState({
    fare: '',
    availableSeats: '',
    totalSeats: '',
    serviceType: '',
    departureTime: '',
    boardingPoint: '',
    droppingPoint: ''
  });

  const handleSave = () => {
    onSave({ filters, updates, updateType });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-full max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Update Trips</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Filters (Which trips to update)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Route</label>
                <Select value={filters.routeName} onValueChange={(value) => setFilters({...filters, routeName: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="All routes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All routes</SelectItem>
                    {routes.map((route) => (
                      <SelectItem key={route.id} value={route.name}>{route.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">End Date</label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={filters.hasDeparted}
                  onCheckedChange={(checked) => setFilters({...filters, hasDeparted: checked as boolean})}
                />
                <label className="text-sm font-medium text-gray-700">Include Departed Trips</label>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-3">Updates (Leave blank to keep current value)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Fare</label>
                <Input
                  type="number"
                  value={updates.fare}
                  onChange={(e) => setUpdates({...updates, fare: e.target.value})}
                  placeholder="New fare amount"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Available Seats</label>
                <Input
                  type="number"
                  value={updates.availableSeats}
                  onChange={(e) => setUpdates({...updates, availableSeats: e.target.value})}
                  placeholder="New available seats"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Total Seats</label>
                <Input
                  type="number"
                  value={updates.totalSeats}
                  onChange={(e) => setUpdates({...updates, totalSeats: e.target.value})}
                  placeholder="New total seats"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Service Type</label>
                <Select value={updates.serviceType} onValueChange={(value) => setUpdates({...updates, serviceType: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Keep current" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Keep current</SelectItem>
                    <SelectItem value="Morning Bus">Morning Bus</SelectItem>
                    <SelectItem value="Afternoon Bus">Afternoon Bus</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Departure Time</label>
                <Select value={updates.departureTime} onValueChange={(value) => setUpdates({...updates, departureTime: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Keep current" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Keep current</SelectItem>
                    {times.map((time) => (
                      <SelectItem key={time.id} value={time.time}>{time.time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Boarding Point</label>
                <Input
                  value={updates.boardingPoint}
                  onChange={(e) => setUpdates({...updates, boardingPoint: e.target.value})}
                  placeholder="New boarding point"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Dropping Point</label>
                <Input
                  value={updates.droppingPoint}
                  onChange={(e) => setUpdates({...updates, droppingPoint: e.target.value})}
                  placeholder="New dropping point"
                />
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
              Update Trips
            </Button>
            <Button onClick={onClose} variant="outline">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const AutomateTripsModal: React.FC<AutomateTripsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  routes,
  times,
  lastTripDate
}) => {
  const [baseTrips, setBaseTrips] = useState<Trip[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Set default start date to day after last trip or today
      const defaultStartDate = lastTripDate ?
        new Date(new Date(lastTripDate).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] :
        new Date().toISOString().split('T')[0];

      setStartDate(defaultStartDate);

      // Set default end date to 6 months from start
      const defaultEndDate = new Date();
      defaultEndDate.setMonth(defaultEndDate.getMonth() + 6);
      setEndDate(defaultEndDate.toISOString().split('T')[0]);

      const initialBaseTrips: Trip[] = [
        {
          routeName: 'Gaborone to OR Tambo Airport',
          departureTime: '07:00',
          totalSeats: 60,
          availableSeats: 60,
          serviceType: 'Morning Bus',
          fare: 500,
          durationMinutes: 390,
          promoActive: false,
          hasDeparted: false,
          routeOrigin: 'Gaborone',
          routeDestination: 'OR Tambo Airport',
          boardingPoint: 'Mogobe Plaza',
          droppingPoint: 'OR Tambo Airport',
          departureDate: new Date().toISOString()
        },
        {
          routeName: 'Gaborone to OR Tambo Airport',
          departureTime: '15:00',
          totalSeats: 60,
          availableSeats: 60,
          serviceType: 'Afternoon Bus',
          fare: 500,
          durationMinutes: 390,
          promoActive: false,
          hasDeparted: false,
          routeOrigin: 'Gaborone',
          routeDestination: 'OR Tambo Airport',
          boardingPoint: 'Mogobe Plaza',
          droppingPoint: 'OR Tambo Airport',
          departureDate: new Date().toISOString()
        },
        {
          routeName: 'OR Tambo Airport to Gaborone',
          departureTime: '08:00',
          totalSeats: 60,
          availableSeats: 60,
          serviceType: 'Morning Bus',
          fare: 500,
          durationMinutes: 390,
          promoActive: false,
          hasDeparted: false,
          routeOrigin: 'OR Tambo Airport',
          routeDestination: 'Gaborone',
          boardingPoint: 'OR Tambo Airport',
          droppingPoint: 'Mogobe Plaza',
          departureDate: new Date().toISOString()
        },
        {
          routeName: 'OR Tambo Airport to Gaborone',
          departureTime: '17:00',
          totalSeats: 60,
          availableSeats: 60,
          serviceType: 'Afternoon Bus',
          fare: 500,
          durationMinutes: 390,
          promoActive: false,
          hasDeparted: false,
          routeOrigin: 'OR Tambo Airport',
          routeDestination: 'Gaborone',
          boardingPoint: 'OR Tambo Airport',
          droppingPoint: 'Mogobe Plaza',
          departureDate: new Date().toISOString()
        },
      ];
      setBaseTrips(initialBaseTrips);
    }
  }, [isOpen, lastTripDate]);

  const handleInputChange = (index: number, field: string, value: any) => {
    const updatedBaseTrips = [...baseTrips];
    updatedBaseTrips[index] = { ...updatedBaseTrips[index], [field]: value };
    setBaseTrips(updatedBaseTrips);
  };

  const handleSave = () => {
    onSave(baseTrips, startDate, endDate);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-full max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Automated Trips</DialogTitle>
        </DialogHeader>

        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1"
              />
              {lastTripDate && (
                <p className="text-sm text-gray-600 mt-1">
                  Last trip in database: {new Date(lastTripDate).toLocaleDateString()}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Base Trip Templates</h3>
          {baseTrips.map((trip, index) => (
            <div key={index} className="border p-4 rounded-lg shadow-sm">
              <h4 className="font-bold text-md mb-3">{trip.routeName} - {trip.departureTime}</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  <label className="block text-sm font-medium text-gray-700">Total Seats</label>
                  <Input
                    type="number"
                    value={trip.totalSeats}
                    onChange={(e) => handleInputChange(index, 'totalSeats', parseInt(e.target.value))}
                    className="mt-1"
                  />
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
                <div>
                  <label className="block text-sm font-medium text-gray-700">Boarding Point</label>
                  <Input
                    value={trip.boardingPoint}
                    onChange={(e) => handleInputChange(index, 'boardingPoint', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Dropping Point</label>
                  <Input
                    value={trip.droppingPoint}
                    onChange={(e) => handleInputChange(index, 'droppingPoint', e.target.value)}
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

        <div className="flex space-x-2 mt-6">
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
            Generate Trips via SQL
          </Button>
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
        </div>
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
      durationMinutes: 390,
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
  const [isBulkUpdateModalOpen, setIsBulkUpdateModalOpen] = useState(false);
  const [isSQLModalOpen, setIsSQLModalOpen] = useState(false);
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoDepart, setAutoDepart] = useState(true);
  const [lastTripDate, setLastTripDate] = useState<string | null>(null);

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
    fetchLastTripDate();
  }, []);

  useEffect(() => {
    if (!autoDepart) return;

    const interval = setInterval(() => {
      const now = new Date();
      trips.forEach(trip => {
        if (!trip.hasDeparted && trip.id && trip.departureDate && trip.departureTime) {
          try {
            const tripDate = new Date(trip.departureDate);
            const [hours, minutes] = trip.departureTime.split(":").map(Number);
            tripDate.setHours(hours, minutes, 0, 0);

            if (now >= tripDate) {
              handleMarkDeparted(trip.id);
            }
          } catch (error) {
            console.error('Error processing trip departure:', error);
          }
        }
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [autoDepart, trips]);

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

  const fetchLastTripDate = async () => {
    try {
      const response = await fetch('/api/trips/last-date');
      if (response.ok) {
        const data = await response.json();
        setLastTripDate(data.lastTripDate);
      }
    } catch (error) {
      console.error('Error fetching last trip date:', error);
    }
  };

  const handleExecuteSQL = async (query: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/trips/execute-sql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error('Failed to execute SQL query');
      }

      const result = await response.json();

      // Refresh trips and last trip date after SQL execution
      await fetchTrips();
      await fetchLastTripDate();

      // Show success message or result
      alert(`Query executed successfully. ${result.affectedRows || 0} rows affected.`);
    } catch (error) {
      console.error('Error executing SQL query:', error);
      setError(error instanceof Error ? error.message : 'Failed to execute SQL query');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkUpdate = async (updateData: any) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/trips/bulk-update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error('Failed to bulk update trips');
      }

      const result = await response.json();
      fetchTrips();
      alert(`Bulk update successful. ${result.updatedCount} trips updated.`);
    } catch (error) {
      console.error('Error bulk updating trips:', error);
      setError(error instanceof Error ? error.message : 'Failed to bulk update trips');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutomateTrips = () => {
    setIsAutomateModalOpen(true);
  };

  const handleSaveAutomatedTrips = async (baseTrips: Trip[], startDate: string, endDate: string) => {
    setIsLoading(true);
    try {
      // Generate SQL query for bulk trip creation
      const sqlQuery = `
-- Enable pgcrypto if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

WITH dates AS (
  SELECT generate_series(
    DATE '${startDate}',
    DATE '${endDate}',
    INTERVAL '1 day'
  ) AS trip_date
),
base_trips AS (
  ${baseTrips.map((trip, index) => `
  SELECT
    '${trip.routeName}' AS "routeName",
    '${trip.departureTime}' AS "departureTime",
    '${trip.serviceType}' AS "serviceType",
    '${trip.routeOrigin}' AS "routeOrigin",
    '${trip.routeDestination}' AS "routeDestination",
    '${trip.boardingPoint}' AS "boardingPoint",
    '${trip.droppingPoint}' AS "droppingPoint",
    ${trip.availableSeats} AS "availableSeats",
    ${trip.totalSeats} AS "totalSeats",
    ${trip.fare} AS fare,
    ${trip.durationMinutes} AS "durationMinutes",
    ${trip.promoActive} AS "promoActive"
  ${index < baseTrips.length - 1 ? 'UNION ALL' : ''}`).join('')}
)
INSERT INTO public."Trip" (
  id, "availableSeats", "routeOrigin", "routeDestination", "departureTime",
  "createdAt", "updatedAt", "boardingPoint", "departureDate",
  "droppingPoint", "durationMinutes", fare, "hasDeparted",
  "occupiedSeats", "promoActive", "routeName", "serviceType", "totalSeats"
)
SELECT
  gen_random_uuid()::text AS id,
  bt."availableSeats",
  bt."routeOrigin",
  bt."routeDestination",
  bt."departureTime",
  NOW() AS "createdAt",
  NOW() AS "updatedAt",
  bt."boardingPoint",
  (d.trip_date + bt."departureTime"::time) AS "departureDate",
  bt."droppingPoint",
  bt."durationMinutes",
  bt.fare,
  false AS "hasDeparted",
  NULL AS "occupiedSeats",
  bt."promoActive",
  bt."routeName",
  bt."serviceType",
  bt."totalSeats"
FROM dates d
CROSS JOIN base_trips bt;`;

      await handleExecuteSQL(sqlQuery);
    } catch (error) {
      console.error('Error creating automated trips:', error);
      setError(error instanceof Error ? error.message : 'Failed to create automated trips');
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
    if (!confirm('Are you sure you want to delete this trip?')) return;

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
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center mb-2">
              <h1 className="text-xl font-bold text-teal-900">Fleet Management Dashboard</h1>
              <div className="flex space-x-2 items-center">
                <Switch checked={autoDepart} onCheckedChange={setAutoDepart} />
                <span className="ml-2 text-sm font-medium text-indigo-700">Auto Depart</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="text-xs">
                {autoDepart ? (
                  <div className="text-green-700">Auto Depart is ON: Buses will be marked as departed automatically when their time is due.</div>
                ) : (
                  <div className="text-red-700">Auto Depart is OFF: Buses will NOT be marked as departed automatically.</div>
                )}
                {lastTripDate && (
                  <div className="text-gray-600 mt-1">
                    Last trip in database: {new Date(lastTripDate).toLocaleDateString()}
                  </div>
                )}
              </div>

              <div className="flex space-x-2">
                <Button onClick={() => setIsSQLModalOpen(true)} className="bg-purple-600 hover:bg-purple-700 text-white">
                  SQL Query
                </Button>
                <Button onClick={() => setIsBulkUpdateModalOpen(true)} className="bg-orange-600 hover:bg-orange-700 text-white">
                  Bulk Update
                </Button>
                <Button onClick={handleAutomateTrips} className="bg-blue-600 hover:bg-blue-700 text-white">
                  Automate Trips
                </Button>
                <Button onClick={() => handleOpenModal()} className="bg-green-600 hover:bg-green-700 text-white">
                  Add Trip
                </Button>
              </div>
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
                  <p className="text-center text-gray-500">No trips scheduled for this date</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Route</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Seats</TableHead>
                        <TableHead>Fare</TableHead>
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
                          <TableCell>P{trip.fare}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded text-xs ${
                              trip.hasDeparted ? 'bg-gray-200 text-gray-700' : 'bg-green-200 text-green-700'
                            }`}>
                              {trip.hasDeparted ? 'Departed' : 'Scheduled'}
                            </span>
                          </TableCell>
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
                      <SelectItem value="">All routes</SelectItem>
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
                  <p className="text-center text-gray-500">No trips scheduled for this route and date</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Route</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Seats</TableHead>
                        <TableHead>Boarding</TableHead>
                        <TableHead>Dropping</TableHead>
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
                            <TableCell>{trip.boardingPoint}</TableCell>
                            <TableCell>{trip.droppingPoint}</TableCell>
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
      {/* Trip Form Modal */}
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
      {/* Automate Trips Modal */}
      <AutomateTripsModal
        isOpen={isAutomateModalOpen}
        onClose={() => setIsAutomateModalOpen(false)}
        onSave={handleSaveAutomatedTrips}
        routes={routes}
        times={times}
        lastTripDate={lastTripDate}
      />
      {/* Bulk Update Modal */}
      <BulkUpdateModal
        isOpen={isBulkUpdateModalOpen}
        onClose={() => setIsBulkUpdateModalOpen(false)}
        onSave={handleBulkUpdate}
        routes={routes}
        times={times}
      />
      {/* SQL Query Modal */}
      <SQLQueryModal
        isOpen={isSQLModalOpen}
        onClose={() => setIsSQLModalOpen(false)}
        onExecute={handleExecuteSQL}
      />
      {/* Error Modal */}
      <ErrorModal message={error} onClose={() => setError(null)} />
    </div>
  );
};

export default FleetManagementPage;
