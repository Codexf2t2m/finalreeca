"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, DollarSign, AlertTriangle, Bus, TrendingUp, BarChart3, QrCode, FileText, Clock, ArrowUpRight } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState<"dashboard" | "schedule">("dashboard");
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500 mx-auto"></div>
          <p className="text-gray-600 font-medium">Loading dashboard data...</p>
          <p className="text-sm text-gray-500">Please wait while we prepare your dashboard</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-md space-y-4">
          <div className="inline-flex items-center justify-center rounded-full bg-red-100 p-4">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">Failed to load dashboard</h3>
          <p className="text-gray-600">{error}</p>
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-2">
          <p className="text-gray-600 font-medium">No dashboard data available</p>
          <p className="text-sm text-gray-500">Please check your connection and try again</p>
        </div>
      </div>
    );
  }

  const { stats, recentBookings, morningOccupancy, afternoonOccupancy } = dashboardData;

  return (
    <div className="space-y-8 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Clock className="h-4 w-4" />
            Last 30 days
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-teal-50 p-3">
                  <Users className="h-5 w-5 text-teal-600" />
                </div>
                <Badge variant="secondary" className="bg-green-50 text-green-600">
                  +12%
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Bookings</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalBookings}</p>
                <p className="text-xs text-gray-500 mt-1">This month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-amber-50 p-3">
                  <DollarSign className="h-5 w-5 text-amber-600" />
                </div>
                <Badge variant="secondary" className="bg-green-50 text-green-600">
                  +24%
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <p className="text-2xl font-semibold text-gray-900">P {stats.totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">This month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-red-50 p-3">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <Badge variant="secondary" className="bg-red-50 text-red-600">
                  {stats.pendingRequests > 0 ? 'Action needed' : 'All clear'}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Inquiries</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.pendingRequests}</p>
                <p className="text-xs text-gray-500 mt-1">Awaiting approval</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-green-50 p-3">
                  <Bus className="h-5 w-5 text-green-600" />
                </div>
                <Badge variant="secondary" className="bg-blue-50 text-blue-600">
                  Active
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Today's Departures</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.todayDepartures}</p>
                <p className="text-xs text-gray-500 mt-1">Active schedules</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <Card className="border border-gray-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Quick Actions</CardTitle>
              <CardDescription className="text-sm text-gray-500">
                Common tasks at your fingertips
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Link href="/admin/validate-ticket">
                  <Button
                    variant="outline"
                    className="w-full h-24 flex flex-col items-center justify-center gap-3 border-gray-200 hover:border-teal-200 hover:bg-teal-50"
                  >
                    <div className="rounded-full bg-teal-100 p-3">
                      <QrCode className="h-5 w-5 text-teal-600" />
                    </div>
                    <span className="text-sm font-medium">Validate Tickets</span>
                  </Button>
                </Link>
                
                <Link href="/admin/agents">
                  <Button
                    variant="outline"
                    className="w-full h-24 flex flex-col items-center justify-center gap-3 border-gray-200 hover:border-blue-200 hover:bg-blue-50"
                  >
                    <div className="rounded-full bg-blue-100 p-3">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium">Agents</span>
                  </Button>
                </Link>
                
                <Link href="/admin/fleet">
                  <Button
                    variant="outline"
                    className="w-full h-24 flex flex-col items-center justify-center gap-3 border-gray-200 hover:border-indigo-200 hover:bg-indigo-50"
                  >
                    <div className="rounded-full bg-indigo-100 p-3">
                      <Bus className="h-5 w-5 text-indigo-600" />
                    </div>
                    <span className="text-sm font-medium">Fleet</span>
                  </Button>
                </Link>
                
                <Link href="/admin/busschedule">
                  <Button
                    variant="outline"
                    className="w-full h-24 flex flex-col items-center justify-center gap-3 border-gray-200 hover:border-purple-200 hover:bg-purple-50"
                  >
                    <div className="rounded-full bg-purple-100 p-3">
                      <FileText className="h-5 w-5 text-purple-600" />
                    </div>
                    <span className="text-sm font-medium">Schedule</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Bookings */}
        <div className="lg:col-span-2">
          <Card className="border border-gray-100 shadow-sm h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">Recent Bookings</CardTitle>
                  <CardDescription className="text-sm text-gray-500">
                    Latest customer reservations
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-teal-600 hover:text-teal-700">
                  View all
                  <ArrowUpRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="rounded-lg bg-gray-100 p-3">
                        <Bus className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{booking.trip.routeName}</p>
                        <p className="text-sm text-gray-500">
                          {format(booking.createdAt, "MMM dd, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-teal-600">P {booking.totalPrice}</p>
                      <Badge 
                        variant="outline" 
                        className={
                          booking.bookingStatus === 'confirmed' 
                            ? 'bg-green-50 text-green-600 border-green-100' 
                            : 'bg-yellow-50 text-yellow-600 border-yellow-100'
                        }
                      >
                        {booking.bookingStatus}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bus Occupancy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Morning Occupancy */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Morning Bus Occupancy</CardTitle>
            <CardDescription className="text-sm text-gray-500">
              Departures before 12:00 PM
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {morningOccupancy.map((bus, index) => {
                const occupancyPercentage = Math.round((bus.bookedSeats / bus.totalSeats) * 100);
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900">{bus.bus}</p>
                        <p className="text-sm text-gray-500">Route: {bus.route}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {bus.bookedSeats}/{bus.totalSeats} seats
                        </p>
                        <p className="text-xs text-gray-500">
                          {bus.departureTime}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-full bg-gray-100 rounded-full h-2.5 flex-1">
                        <div
                          className="bg-teal-600 h-2.5 rounded-full"
                          style={{ width: `${occupancyPercentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {occupancyPercentage}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Afternoon Occupancy */}
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Afternoon Bus Occupancy</CardTitle>
            <CardDescription className="text-sm text-gray-500">
              Departures after 12:00 PM
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {afternoonOccupancy.map((bus, index) => {
                const occupancyPercentage = Math.round((bus.bookedSeats / bus.totalSeats) * 100);
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900">{bus.bus}</p>
                        <p className="text-sm text-gray-500">Route: {bus.route}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {bus.bookedSeats}/{bus.totalSeats} seats
                        </p>
                        <p className="text-xs text-gray-500">
                          {bus.departureTime}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-full bg-gray-100 rounded-full h-2.5 flex-1">
                        <div
                          className="bg-teal-600 h-2.5 rounded-full"
                          style={{ width: `${occupancyPercentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {occupancyPercentage}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}