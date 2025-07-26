"use client";
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import * as XLSX from "xlsx";
import dynamic from "next/dynamic";

// Dynamically import chart.js components
const Bar = dynamic(() => import("react-chartjs-2").then(mod => mod.Bar), { ssr: false });
const Line = dynamic(() => import("react-chartjs-2").then(mod => mod.Line), { ssr: false });
const Pie = dynamic(() => import("react-chartjs-2").then(mod => mod.Pie), { ssr: false });

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Types
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

interface AgentSales {
  id: string;
  name: string;
  bookings: number;
  revenue: number;
  commission: number;
}

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const COLORS = {
  primary: "#0d9488",
  secondary: "#f59e0b",
  accent: "#3b82f6",
  background: "#f8fafc",
  text: "#0f172a"
};

export default function ReportsPage() {
  const [routeSales, setRouteSales] = useState<RouteSales[]>([]);
  const [agentSales, setAgentSales] = useState<AgentSales[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedRoute, setSelectedRoute] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [timeframe, setTimeframe] = useState<"day" | "week" | "month">("month");

  // KPI Metrics with safe defaults
  const kpis = useMemo(() => {
    const totalRevenue = routeSales.reduce((sum, route) => sum + (route?.totalRevenue || 0), 0);
    const totalBookings = routeSales.reduce((sum, route) => sum + (route?.totalBookings || 0), 0);
    const avgRevenuePerBooking = totalBookings ? totalRevenue / totalBookings : 0;

    // Find best performing route
    const bestRoute = routeSales.length
      ? routeSales.reduce((best, current) =>
          (current?.totalRevenue || 0) > (best?.totalRevenue || 0) ? current : best
        )
      : null;

    // Find best performing agent
    const bestAgent = agentSales.length
      ? agentSales.reduce((best, current) =>
          (current?.revenue || 0) > (best?.revenue || 0) ? current : best
        )
      : null;

    return {
      totalRevenue,
      totalBookings,
      avgRevenuePerBooking,
      bestRoute: bestRoute ? `${bestRoute.routeName} (P${(bestRoute.totalRevenue || 0).toLocaleString()})` : "N/A",
      bestAgent: bestAgent ? `${bestAgent.name} (P${(bestAgent.revenue || 0).toLocaleString()})` : "N/A",
      peakPerformance: bestRoute ? `${bestRoute.bestDay} at ${bestRoute.times[0]?.departureTime || 'N/A'}` : "N/A"
    };
  }, [routeSales, agentSales]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch route sales
        const routeRes = await fetch("/api/reports/sales-by-route");
        if (!routeRes.ok) throw new Error("Failed to fetch sales reports");
        const routeData = await routeRes.json();
        setRouteSales(routeData || []);

        // Fetch agent sales
        const agentRes = await fetch("/api/reports/sales-by-agent");
        const agentData = await agentRes.json();
        setAgentSales(agentData || []);

      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter options
  const routeOptions = useMemo(
    () => [
      { label: "All Routes", value: "all" },
      ...(routeSales || []).map((r) => ({
        label: `${r.routeName} (${r.route})`,
        value: r.route,
      })),
    ],
    [routeSales]
  );

  const monthOptions = useMemo(() => {
    const months = new Set<string>();
    (routeSales || []).forEach((r) => {
      if (r.bestMonth) months.add(r.bestMonth);
    });
    return [
      { label: "All Months", value: "all" },
      ...Array.from(months).map((m) => ({
        label: `${monthNames[parseInt(m.split("-")[1], 10) - 1]} ${m.split("-")[0]}`,
        value: m,
      })),
    ];
  }, [routeSales]);

  // Filtered data with null checks
  const filteredRoutes = useMemo(() => {
    let filtered = routeSales || [];
    if (selectedRoute !== "all") {
      filtered = filtered.filter((r) => r.route === selectedRoute);
    }
    if (selectedMonth !== "all") {
      filtered = filtered.filter((r) => r.bestMonth === selectedMonth);
    }
    return filtered;
  }, [routeSales, selectedRoute, selectedMonth]);

  // Prepare data for visualizations with safe access
  const chartData = useMemo(() => {
    // Default empty dataset structures
    const emptyDataset = {
      labels: [],
      datasets: [{ data: [] }]
    };

    if (!routeSales?.length || !agentSales?.length) {
      return {
        routeComparison: emptyDataset,
        revenueTrend: emptyDataset,
        revenueDistribution: emptyDataset,
        topAgents: emptyDataset
      };
    }

    // Revenue vs Bookings by Route
    const routeLabels = filteredRoutes.map((r) => r.routeName);
    const bookingsData = filteredRoutes.map((r) => r.totalBookings || 0);
    const revenueData = filteredRoutes.map((r) => r.totalRevenue || 0);

    // Revenue trend by month
    const monthMap: Record<string, number> = {};
    routeSales.forEach((r) => {
      if (r.bestMonth) {
        monthMap[r.bestMonth] = (monthMap[r.bestMonth] || 0) + (r.totalRevenue || 0);
      }
    });

    const monthsSorted = Object.keys(monthMap).sort();
    const monthLabels = monthsSorted.map(
      (m) => `${monthNames[parseInt(m.split("-")[1], 10) - 1]} ${m.split("-")[0]}`
    );
    const monthRevenue = monthsSorted.map((m) => monthMap[m]);

    // Revenue distribution by route
    const routeRevenueDistribution = filteredRoutes
      .sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0))
      .slice(0, 5)
      .map((r) => ({ route: r.routeName, revenue: r.totalRevenue || 0 }));

    // Top performing agents
    const topAgents = [...agentSales]
      .sort((a, b) => (b.revenue || 0) - (a.revenue || 0))
      .slice(0, 5)
      .map((a) => ({ agent: a.name, revenue: a.revenue || 0 }));

    return {
      routeComparison: {
        labels: routeLabels,
        datasets: [
          {
            label: "Bookings",
            data: bookingsData,
            backgroundColor: COLORS.secondary,
            borderRadius: 6,
            order: 2,
          },
          {
            label: "Revenue (P)",
            data: revenueData,
            backgroundColor: COLORS.primary,
            borderRadius: 6,
            order: 1,
          },
        ],
      },
      revenueTrend: {
        labels: monthLabels,
        datasets: [
          {
            label: "Monthly Revenue (P)",
            data: monthRevenue,
            fill: true,
            backgroundColor: "rgba(13, 148, 136, 0.1)",
            borderColor: COLORS.primary,
            tension: 0.4,
            pointRadius: 5,
            pointBackgroundColor: COLORS.primary,
          },
        ],
      },
      revenueDistribution: {
        labels: routeRevenueDistribution.map((r) => r.route),
        datasets: [
          {
            data: routeRevenueDistribution.map((r) => r.revenue),
            backgroundColor: [
              "#0d9488", "#0f766e", "#14b8a6",
              "#f59e0b", "#fbbf24"
            ],
            borderWidth: 1,
          },
        ],
      },
      topAgents: {
        labels: topAgents.map((a) => a.agent),
        datasets: [
          {
            label: "Revenue (P)",
            data: topAgents.map((a) => a.revenue),
            backgroundColor: COLORS.accent,
            borderRadius: 6,
          },
        ],
      },
    };
  }, [filteredRoutes, routeSales, agentSales]);

  const downloadExcel = () => {
    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Route data sheet
    const routeRows: any[] = [];
    filteredRoutes.forEach((route) => {
      route.times.forEach((time) => {
        routeRows.push({
          "Route Name": route.routeName,
          "Route Code": route.route,
          "Departure Time": time.departureTime,
          "Bookings": time.bookings,
          "Revenue": time.revenue,
          "Best Day": route.bestDay,
          "Best Month": route.bestMonth,
        });
      });
    });

    if (routeRows.length) {
      const routeSheet = XLSX.utils.json_to_sheet(routeRows);
      XLSX.utils.book_append_sheet(workbook, routeSheet, "Route Performance");
    }

    // Agent data sheet
    const agentRows = agentSales.map((agent) => ({
      "Agent Name": agent.name,
      "Bookings": agent.bookings,
      "Revenue": agent.revenue,
      "Commission": agent.commission,
      "Avg. Ticket Value": agent.bookings ? agent.revenue / agent.bookings : 0,
    }));

    if (agentRows.length) {
      const agentSheet = XLSX.utils.json_to_sheet(agentRows);
      XLSX.utils.book_append_sheet(workbook, agentSheet, "Agent Performance");
    }

    // KPI summary sheet
    const kpiData = [
      ["Metric", "Value"],
      ["Total Revenue", kpis.totalRevenue],
      ["Total Bookings", kpis.totalBookings],
      ["Average Revenue per Booking", kpis.avgRevenuePerBooking],
      ["Top Performing Route", kpis.bestRoute],
      ["Top Performing Agent", kpis.bestAgent],
      ["Peak Performance Time", kpis.peakPerformance]
    ];

    const kpiSheet = XLSX.utils.aoa_to_sheet(kpiData);
    XLSX.utils.book_append_sheet(workbook, kpiSheet, "Performance Summary");
    XLSX.writeFile(workbook, "TransportAnalyticsReport.xlsx");
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="space-y-4 max-w-4xl w-full">
          <Skeleton className="h-10 w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-6 w-3/4 mb-4" />
                <Skeleton className="h-8 w-full" />
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="p-6 h-80">
                <Skeleton className="h-64 w-full" />
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="text-center p-8 max-w-md">
          <CardHeader>
            <CardTitle className="text-red-500">Data Loading Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg mb-4">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-red-500 hover:bg-red-600"
            >
              Retry Loading Data
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main dashboard
  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transport Performance Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Insights and analytics for route optimization and revenue growth
          </p>
        </div>
        <Button
          onClick={downloadExcel}
          className="bg-teal-700 hover:bg-teal-800 text-white shadow flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          Export Full Report
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-teal-50 to-teal-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-gray-700 text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">
              P{(kpis.totalRevenue || 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-amber-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-gray-700 text-sm font-medium">Total Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">
              {(kpis.totalBookings || 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-gray-700 text-sm font-medium">Avg. Ticket Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">
              P{(kpis.avgRevenuePerBooking || 0).toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-cyan-50 to-cyan-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-gray-700 text-sm font-medium">Top Route</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold text-gray-900 truncate">
              {kpis.bestRoute}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-gradient-to-br from-violet-50 to-violet-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-gray-700 text-sm font-medium">Peak Time</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold text-gray-900 truncate">
              {kpis.peakPerformance}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="route-filter" className="block mb-2 font-medium">Route</Label>
              <Select value={selectedRoute} onValueChange={setSelectedRoute}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select route" />
                </SelectTrigger>
                <SelectContent>
                  {routeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="month-filter" className="block mb-2 font-medium">Month</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="timeframe-filter" className="block mb-2 font-medium">Timeframe</Label>
              <Select value={timeframe} onValueChange={(v: any) => setTimeframe(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Daily</SelectItem>
                  <SelectItem value="week">Weekly</SelectItem>
                  <SelectItem value="month">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Route Performance */}
        <Card className="border-0 shadow-lg h-96">
          <CardHeader>
            <CardTitle className="text-gray-900 text-lg">
              Route Performance Analysis
            </CardTitle>
            <CardDescription>
              Comparison of bookings and revenue by route
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Bar
              data={chartData.routeComparison}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: "top" },
                  tooltip: {
                    callbacks: {
                      label: (context) =>
                        `${context.dataset.label}: ${context.parsed.y.toLocaleString()}`
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: { color: "rgba(0,0,0,0.05)" },
                    ticks: {
                      callback: (value) => `P${Number(value).toLocaleString()}`
                    }
                  },
                  x: { grid: { display: false } }
                }
              }}
            />
          </CardContent>
        </Card>

        {/* Revenue Trend */}
        <Card className="border-0 shadow-lg h-96">
          <CardHeader>
            <CardTitle className="text-gray-900 text-lg">
              Revenue Trend Analysis
            </CardTitle>
            <CardDescription>
              Monthly revenue performance over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Line
              data={chartData.revenueTrend}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: "top" },
                  tooltip: {
                    callbacks: {
                      label: (context) =>
                        `Revenue: P${context.parsed.y.toLocaleString()}`
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: { color: "rgba(0,0,0,0.05)" },
                    ticks: {
                      callback: (value) => `P${Number(value).toLocaleString()}`
                    }
                  },
                  x: { grid: { display: false } }
                }
              }}
            />
          </CardContent>
        </Card>

        {/* Revenue Distribution */}
        <Card className="border-0 shadow-lg h-96">
          <CardHeader>
            <CardTitle className="text-gray-900 text-lg">
              Revenue Distribution
            </CardTitle>
            <CardDescription>
              Top revenue-generating routes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Pie
              data={chartData.revenueDistribution}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: "bottom" },
                  tooltip: {
                    callbacks: {
                      label: (context) =>
                        `Revenue: P${Number(context.parsed).toLocaleString()}`
                    }
                  }
                }
              }}
            />
          </CardContent>
        </Card>

        {/* Top Agents */}
        <Card className="border-0 shadow-lg h-96">
          <CardHeader>
            <CardTitle className="text-gray-900 text-lg">
              Top Performing Agents
            </CardTitle>
            <CardDescription>
              Revenue contribution by sales agents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Bar
              data={chartData.topAgents}
              options={{
                indexAxis: "y" as const,
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    callbacks: {
                      label: (context) =>
                        `Revenue: P${context.parsed.x.toLocaleString()}`
                    }
                  }
                },
                scales: {
                  x: {
                    beginAtZero: true,
                    grid: { color: "rgba(0,0,0,0.05)" },
                    ticks: {
                      callback: (value) => `P${Number(value).toLocaleString()}`
                    }
                  },
                  y: { grid: { display: false } }
                }
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Detailed Data */}
      <Tabs defaultValue="routes" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-xs">
          <TabsTrigger value="routes">Route Performance</TabsTrigger>
          <TabsTrigger value="agents">Agent Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="routes">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-gray-900">Route Performance Details</CardTitle>
              <CardDescription>
                Detailed breakdown by departure time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Route</TableHead>
                    <TableHead>Departure</TableHead>
                    <TableHead className="text-right">Bookings</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead>Peak Day</TableHead>
                    <TableHead>Peak Month</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRoutes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        No data available for selected filters
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRoutes.flatMap((route) =>
                      route.times.map((time) => (
                        <TableRow key={`${route.route}-${time.departureTime}`}>
                          <TableCell className="font-medium">{route.routeName}</TableCell>
                          <TableCell>{time.departureTime}</TableCell>
                          <TableCell className="text-right">{time.bookings}</TableCell>
                          <TableCell className="text-right">P{time.revenue.toLocaleString()}</TableCell>
                          <TableCell>{route.bestDay}</TableCell>
                          <TableCell>
                            {monthNames[parseInt(route.bestMonth.split("-")[1], 10) - 1]} {route.bestMonth.split("-")[0]}
                          </TableCell>
                        </TableRow>
                      ))
                    )
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-gray-900">Agent Performance</CardTitle>
              <CardDescription>
                Sales performance by booking agent
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent</TableHead>
                    <TableHead className="text-right">Bookings</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Commission</TableHead>
                    <TableHead className="text-right">Avg. Ticket Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agentSales.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        No agent data available
                      </TableCell>
                    </TableRow>
                  ) : (
                    agentSales.map((agent) => (
                      <TableRow key={agent.id}>
                        <TableCell className="font-medium">{agent.name}</TableCell>
                        <TableCell className="text-right">{agent.bookings || 0}</TableCell>
                        <TableCell className="text-right">P{(agent.revenue || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-right">P{(agent.commission || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          P{agent.bookings ? ((agent.revenue || 0) / agent.bookings).toFixed(2) : 0}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
