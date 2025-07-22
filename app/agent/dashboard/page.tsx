"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function AgentDashboard() {
  const [agent, setAgent] = useState<{ name: string; email: string; id: string } | null>(null);
  const [stats, setStats] = useState<{ bookings: number; revenue: number }>({ bookings: 0, revenue: 0 });
  const [bookings, setBookings] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/agent/me").then(async res => {
      if (res.ok) setAgent(await res.json());
      else window.location.href = "/agent/auth";
    });
  }, []);

  useEffect(() => {
    if (agent?.id) {
      fetch(`/api/agent/${agent.id}/bookings`)
        .then(async res => {
          if (res.ok) {
            const data = await res.json();
            setBookings(data.bookings || []);
            setStats({
              bookings: data.bookings.length,
              revenue: data.bookings.reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0),
            });
          }
        });
    }
  }, [agent?.id]);

  if (!agent) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading agent dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Image 
              src="https://scontent.fgbe3-1.fna.fbcdn.net/v/t39.30808-6/490440252_1108879161279186_7731004643176883427_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=104&ccb=1-7&_nc_sid=833d8c&_nc_eui2=AeEXHmXGZsRP_9hvRcmdOEBk1-JoOeb96jnX4mg55v3qOZBZJk_3ZtUDnkXWsqOJ0IhmI6r6fzVsgQ541COknQUo&_nc_ohc=qRS4Bz3FuxIQ7kNvwFvlWhZ&_nc_oc=AdlJXNS-BXp_pSUen_jXzQCNhY1-LWYPAuILnR1Jy_W_-245a1ev24y6kX3FaUuBd_k&_nc_zt=23&_nc_ht=scontent.fgbe3-1.fna&_nc_gid=pDFB9BfJQub07_dmy5UkHQ&oh=00_AfS8ZIeeyr9ny3UaJd9MhbsoPtUzsAyNUWTlzyUCH944hA&oe=6881E529" 
              alt="Bus Company Logo"
              width={60}
              height={60}
              className="rounded-md"
            />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Agent Dashboard</h1>
              <p className="text-sm text-gray-500">Manage bookings and clients</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{agent.name}</p>
              <p className="text-xs text-gray-500">{agent.email}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-800 font-bold">
              {agent.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-l-4 border-teal-500 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">TOTAL BOOKINGS</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-gray-900">{stats.bookings}</div>
                <div className="p-3 rounded-full bg-teal-100 text-teal-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500">All time bookings</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-amber-500 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">TOTAL REVENUE</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-gray-900">P{stats.revenue.toFixed(2)}</div>
                <div className="p-3 rounded-full bg-amber-100 text-amber-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500">Generated revenue</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">QUICK ACTIONS</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-3">
                <Button 
                  onClick={() => router.push("/")}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 text-sm"
                >
                  New Booking
                </Button>
                <Button 
                  variant="outline"
                  className="text-sm"
                  onClick={() => router.push("/")}
                >
                  View Schedule
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Bookings Section */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Recent Bookings</h2>
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push("/")}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                New Booking
              </Button>
              <Button variant="outline" size="sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            {bookings.length === 0 ? (
              <div className="p-12 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings yet</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating a new booking.</p>
                <div className="mt-6">
                  <Button
                    onClick={() => router.push("/")}
                    className="bg-teal-600 hover:bg-teal-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    New Booking
                  </Button>
                </div>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trip Details
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Seats
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{b.orderId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
                            {b.userName?.charAt(0).toUpperCase() || 'C'}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{b.userName || 'Customer'}</div>
                            <div className="text-sm text-gray-500">{b.userEmail || ''}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="text-sm font-medium text-gray-900">{b.trip?.routeName}</div>
                        <div className="text-xs text-gray-500">
                          {b.trip?.departureTime} • {b.trip?.busType}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(b.trip?.departureDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {b.seatCount} seats
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        P{b.totalPrice?.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button variant="ghost" size="sm" className="text-teal-600 hover:text-teal-900">
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {bookings.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing <span className="font-medium">1</span> to <span className="font-medium">{bookings.length}</span> of{' '}
                <span className="font-medium">{bookings.length}</span> bookings
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" disabled>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled>
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}