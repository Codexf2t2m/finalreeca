"use client";
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";
import dynamic from "next/dynamic";

// Dynamically import chart.js components (for SSR compatibility)
const Bar = dynamic(() => import("react-chartjs-2").then(mod => mod.Bar), { ssr: false });
const Line = dynamic(() => import("react-chartjs-2").then(mod => mod.Line), { ssr: false });

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

// Types for API data
interface RouteSales {
  routeName: string;
  route: string;
  totalBookings: number;
  totalRevenue: number;
  times: {
    departureTime: string;
    bookings: number;
    revenue: number;
  }[];
  bestDay: string;
  bestMonth: string;
}

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function ReportsPage() {
  const [routeSales, setRouteSales] = useState<RouteSales[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedRoute, setSelectedRoute] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");

  useEffect(() => {
    const fetchRouteSales = async () => {
      try {
        const response = await fetch("/api/reports/sales-by-route");
        if (!response.ok) throw new Error("Failed to fetch sales reports");
        const data = await response.json();
        setRouteSales(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    };
    fetchRouteSales();
  }, []);

  // Get all unique routes and months for filters
  const routeOptions = useMemo(
    () => [
      { label: "All Routes", value: "all" },
      ...routeSales.map((r) => ({
        label: `${r.routeName} (${r.route})`,
        value: r.route,
      })),
    ],
    [routeSales]
  );

  const monthOptions = useMemo(() => {
    const months = new Set<string>();
    routeSales.forEach((r) => {
      if (r.bestMonth) months.add(r.bestMonth);
    });
    return [
      { label: "All Months", value: "all" },
      ...Array.from(months).map((m) => ({
        label: monthNames[parseInt(m.split("-")[1], 10) - 1] + " " + m.split("-")[0],
        value: m,
      })),
    ];
  }, [routeSales]);

  // Filtered data
  const filteredRoutes = useMemo(() => {
    let filtered = routeSales;
    if (selectedRoute !== "all") {
      filtered = filtered.filter((r) => r.route === selectedRoute);
    }
    if (selectedMonth !== "all") {
      filtered = filtered.filter((r) => r.bestMonth === selectedMonth);
    }
    return filtered;
  }, [routeSales, selectedRoute, selectedMonth]);

  // Aggregate for charts
  const chartData = useMemo(() => {
    // Bar: Bookings per route
    const labels = filteredRoutes.map((r) => r.routeName);
    const bookings = filteredRoutes.map((r) => r.totalBookings);
    const revenue = filteredRoutes.map((r) => r.totalRevenue);

    // Line: Revenue per month (across all routes)
    const monthMap: Record<string, number> = {};
    routeSales.forEach((r) => {
      if (r.bestMonth) {
        monthMap[r.bestMonth] = (monthMap[r.bestMonth] || 0) + r.totalRevenue;
      }
    });
    const monthsSorted = Object.keys(monthMap).sort();
    const monthLabels = monthsSorted.map(
      (m) => monthNames[parseInt(m.split("-")[1], 10) - 1] + " " + m.split("-")[0]
    );
    const monthRevenue = monthsSorted.map((m) => monthMap[m]);

    return {
      bar: {
        labels,
        datasets: [
          {
            label: "Bookings",
            data: bookings,
            backgroundColor: "#14b8a6",
            borderRadius: 6,
          },
          {
            label: "Revenue (P)",
            data: revenue,
            backgroundColor: "#fbbf24",
            borderRadius: 6,
          },
        ],
      },
      line: {
        labels: monthLabels,
        datasets: [
          {
            label: "Total Revenue (P)",
            data: monthRevenue,
            fill: false,
            borderColor: "#14b8a6",
            backgroundColor: "#14b8a6",
            tension: 0.3,
            pointRadius: 5,
            pointBackgroundColor: "#fbbf24",
          },
        ],
      },
    };
  }, [filteredRoutes, routeSales]);

  const downloadAsExcel = () => {
    // Flatten data for Excel
    const rows: any[] = [];
    filteredRoutes.forEach((route) => {
      route.times.forEach((time) => {
        rows.push({
          "Route Name": route.routeName,
          "Route": route.route,
          "Departure Time": time.departureTime,
          "Bookings": time.bookings,
          "Revenue": time.revenue,
          "Best Day": route.bestDay,
          "Best Month": route.bestMonth,
        });
      });
    });
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "SalesByRoute");
    XLSX.writeFile(workbook, "SalesByRoute.xlsx");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500 mx-auto"></div>
          <p className="mt-4 text-teal-600">Loading sales reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="mt-4 text-red-500">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold text-teal-900">Sales & Profit Dashboard</h1>
        <div className="flex gap-2">
          <Button
            onClick={downloadAsExcel}
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            Download as Excel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Route</label>
          <select
            className="border rounded px-3 py-2"
            value={selectedRoute}
            onChange={(e) => setSelectedRoute(e.target.value)}
          >
            {routeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Best Month</label>
          <select
            className="border rounded px-3 py-2"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            {monthOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-teal-900 text-lg">Bookings & Revenue by Route</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Bar
                data={chartData.bar}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { position: "top" as const },
                    title: { display: false },
                  },
                  scales: {
                    y: { beginAtZero: true },
                  },
                }}
              />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-teal-900 text-lg">Revenue Trend by Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Line
                data={chartData.line}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { display: true, position: "top" as const },
                  },
                  scales: {
                    y: { beginAtZero: true },
                  },
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-teal-900">Detailed Route Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Route Name
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Route
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Departure Time
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bookings
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Best Day
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Best Month
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRoutes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-400">
                      No data found for selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredRoutes.flatMap((route) =>
                    route.times.map((time) => (
                      <tr key={route.route + time.departureTime}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                          {route.routeName}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                          {route.route}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                          {time.departureTime}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                          {time.bookings}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                          P {time.revenue.toLocaleString()}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                          {route.bestDay}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                          {route.bestMonth}
                        </td>
                      </tr>
                    ))
                  )
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
