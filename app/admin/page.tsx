"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, DollarSign, AlertTriangle, Bus, TrendingUp, BarChart3, QrCode, FileText } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

interface Trip {
  id: string;
  routeName: string;
  routeOrigin: string;
  routeDestination: string;
  departureDate: Date;
  departureTime: string;
  totalSeats: number;
}

interface Booking {
  id: string;
  createdAt: Date;
  totalPrice: number;
  bookingStatus: string;
  trip: Trip;
  seatCount: number;
}

interface DashboardData {
  stats: {
    totalBookings: number;
    totalRevenue: number;
    pendingRequests: number;
    todayDepartures: number;
  };
  recentBookings: Booking[];
  morningOccupancy: {
    bus: string;
    route: string;
    totalSeats: number;
    bookedSeats: number;
    departureTime: string;
  }[];
  afternoonOccupancy: {
    bus: string;
    route: string;
    totalSeats: number;
    bookedSeats: number;
    departureTime: string;
  }[];
}

export default function DashboardOverview() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/dashboard');
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        const data: DashboardData = await response.json();
        setDashboardData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500 mx-auto"></div>
          <p className="mt-4 text-teal-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
          <p className="mt-4 text-red-500">Error: {error}</p>
          <Button
            className="mt-4 bg-teal-600 hover:bg-teal-700 text-white"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No dashboard data available</p>
        </div>
      </div>
    );
  }

  const { stats, recentBookings, morningOccupancy, afternoonOccupancy } = dashboardData;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-teal-50 to-teal-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-teal-600">Total Bookings</p>
                <p className="text-3xl font-bold text-teal-900">{stats.totalBookings}</p>
                <p className="text-xs text-teal-600 mt-1">This month</p>
              </div>
              <div className="p-3 bg-teal-600 rounded-full">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-amber-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-600">Total Revenue</p>
                <p className="text-3xl font-bold text-amber-900">P {stats.totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-amber-600 mt-1">This month</p>
              </div>
              <div className="p-3 bg-amber-600 rounded-full">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Pending Requests</p>
                <p className="text-3xl font-bold text-red-900">{stats.pendingRequests}</p>
                <p className="text-xs text-red-600 mt-1">Awaiting approval</p>
              </div>
              <div className="p-3 bg-red-600 rounded-full">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Today's Departures</p>
                <p className="text-3xl font-bold text-green-900">{stats.todayDepartures}</p>
                <p className="text-xs text-green-600 mt-1">Active schedules</p>
              </div>
              <div className="p-3 bg-green-600 rounded-full">
                <Bus className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-teal-900">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/admin/validate-ticket" className="block">
              <Button
                variant="outline"
                className="w-full h-20 border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-800 flex flex-col items-center justify-center"
              >
                <QrCode className="h-6 w-6 mb-1" />
                <span>Validate Tickets</span>
              </Button>
            </Link>
            <Button
              variant="outline"
              className="w-full h-20 border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 flex flex-col items-center justify-center"
            >
              <FileText className="h-6 w-6 mb-1" />
              <span>Generate Reports</span>
            </Button>
            <Link href="/admin/fleet" className="block">
              <Button
                variant="outline"
                className="w-full h-20 border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800 flex flex-col items-center justify-center"
              >
                <Bus className="h-6 w-6 mb-1" />
                <span>Manage Fleet</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-teal-900">
              <TrendingUp className="h-5 w-5" />
              Recent Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-900">{booking.trip.routeName}</p>
                    <p className="text-xs text-gray-500">{format(booking.createdAt, "MMM dd, yyyy")}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-teal-600">P {booking.totalPrice}</p>
                    <Badge className="text-xs bg-green-100 text-green-800">
                      {booking.bookingStatus}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Bus Occupancy */}
        <div className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-teal-900">
                <BarChart3 className="h-5 w-5" />
                Morning Bus Occupancy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {morningOccupancy.map((bus, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-900">{bus.bus}</p>
                        <p className="text-sm text-gray-600">Route: {bus.route}</p>
                        <p className="text-sm text-gray-600">Departure: {bus.departureTime}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {bus.bookedSeats}/{bus.totalSeats} seats
                        </p>
                        <p className="text-xs text-gray-500">
                          {Math.round((bus.bookedSeats / bus.totalSeats) * 100)}% full
                        </p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-teal-600 h-2 rounded-full"
                        style={{ width: `${(bus.bookedSeats / bus.totalSeats) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-teal-900">
                <BarChart3 className="h-5 w-5" />
                Afternoon Bus Occupancy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {afternoonOccupancy.map((bus, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-900">{bus.bus}</p>
                        <p className="text-sm text-gray-600">Route: {bus.route}</p>
                        <p className="text-sm text-gray-600">Departure: {bus.departureTime}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {bus.bookedSeats}/{bus.totalSeats} seats
                        </p>
                        <p className="text-xs text-gray-500">
                          {Math.round((bus.bookedSeats / bus.totalSeats) * 100)}% full
                        </p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-teal-600 h-2 rounded-full"
                        style={{ width: `${(bus.bookedSeats / bus.totalSeats) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
