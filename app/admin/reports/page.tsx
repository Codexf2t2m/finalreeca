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
import { Download, ArrowUpRight, Calendar, Route, User, BarChart2 } from "lucide-react";

// Dynamic imports for better performance
const BarChart = dynamic(() => import("react-chartjs-2").then(mod => mod.Bar), { ssr: false });
const LineChart = dynamic(() => import("react-chartjs-2").then(mod => mod.Line), { ssr: false });
const PieChart = dynamic(() => import("react-chartjs-2").then(mod => mod.Pie), { ssr: false });

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

interface ConsultantSales {
  id: string;
  name: string;
  bookings: number;
  revenue: number;
  commission: number;
}

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
  const [consultantSales, setConsultantSales] = useState<ConsultantSales[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedRoute, setSelectedRoute] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [timeframe, setTimeframe] = useState<"day" | "week" | "month">("month");

  // KPI Metrics with safe defaults
  const kpis = useMemo(() => {
    const safeRouteSales = routeSales || [];
    const safeAgentSales = agentSales || [];
    
    const totalRevenue = safeRouteSales.reduce((sum, route) => sum + (route?.totalRevenue || 0), 0);
    const totalBookings = safeRouteSales.reduce((sum, route) => sum + (route?.totalBookings || 0), 0);
    const avgRevenuePerBooking = totalBookings > 0 ? totalRevenue / totalBookings : 0;

    const bestRoute = safeRouteSales.length > 0
      ? safeRouteSales.reduce((best, current) =>
          (current?.totalRevenue || 0) > (best?.totalRevenue || 0) ? current : best
        )
      : null;

    const bestAgent = safeAgentSales.length > 0
      ? safeAgentSales.reduce((best, current) =>
          (current?.revenue || 0) > (best?.revenue || 0) ? current : best
        )
      : null;

    return {
      totalRevenue,
      totalBookings,
      avgRevenuePerBooking,
      bestRoute: bestRoute 
        ? `${bestRoute.routeName || 'Unknown'} (P${(bestRoute.totalRevenue || 0).toLocaleString()})` 
        : "N/A",
      bestAgent: bestAgent 
        ? `${bestAgent.name || 'Unknown'} (P${(bestAgent.revenue || 0).toLocaleString()})` 
        : "N/A",
      peakPerformance: bestRoute 
        ? `${bestRoute.bestDay || 'Unknown'} at ${bestRoute.times?.[0]?.departureTime || 'N/A'}` 
        : "N/A"
    };
  }, [routeSales, agentSales]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const [routeRes, agentRes, consultantRes] = await Promise.all([
          fetch("/api/reports/sales-by-route").then(res => {
            if (!res.ok) throw new Error("Failed to fetch route sales");
            return res.json();
          }),
          fetch("/api/reports/sales-by-agent").then(res => {
            if (!res.ok) throw new Error("Failed to fetch agent sales");
            return res.json();
          }),
          fetch("/api/reports/sales-by-consultant").then(res => {
            if (!res.ok) throw new Error("Failed to fetch consultant sales");
            return res.json();
          }),
        ]);

        setRouteSales(Array.isArray(routeRes) ? routeRes : []);
        setAgentSales(Array.isArray(agentRes) ? agentRes : []);
        setConsultantSales(Array.isArray(consultantRes) ? consultantRes : []);

      } catch (err) {
        console.error("Fetch error:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred");
        setRouteSales([]);
        setAgentSales([]);
        setConsultantSales([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter options with memoization
  const { routeOptions, monthOptions } = useMemo(() => {
    const safeRouteSales = routeSales || [];
    
    const routeOpts = [
      { label: "All Routes", value: "all" },
      ...safeRouteSales.map((r) => ({
        label: `${r.routeName || 'Unknown'} (${r.route || 'N/A'})`,
        value: r.route || '',
      })),
    ];

    const months = new Set<string>();
    safeRouteSales.forEach((r) => {
      if (r.bestMonth) months.add(r.bestMonth);
    });
    
    const monthOpts = [
      { label: "All Months", value: "all" },
      ...Array.from(months).map((m) => {
        const [year, month] = m.split("-");
        return {
          label: `${new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'long' })} ${year}`,
          value: m,
        };
      }),
    ];

    return { routeOptions: routeOpts, monthOptions: monthOpts };
  }, [routeSales]);

  // Filtered data
  const filteredRoutes = useMemo(() => {
    const safeRouteSales = routeSales || [];
    let filtered = safeRouteSales;
    
    if (selectedRoute !== "all") {
      filtered = filtered.filter((r) => r.route === selectedRoute);
    }
    if (selectedMonth !== "all") {
      filtered = filtered.filter((r) => r.bestMonth === selectedMonth);
    }
    return filtered;
  }, [routeSales, selectedRoute, selectedMonth]);

  // Chart data preparation
  const chartData = useMemo(() => {
    const safeRouteSales = routeSales || [];
    const safeAgentSales = agentSales || [];
    const safeConsultantSales = consultantSales || [];
    const safeFilteredRoutes = filteredRoutes || [];

    // Revenue vs Bookings by Route
    const routeLabels = safeFilteredRoutes.map((r) => r.routeName || 'Unknown');
    const bookingsData = safeFilteredRoutes.map((r) => r.totalBookings || 0);
    const revenueData = safeFilteredRoutes.map((r) => r.totalRevenue || 0);

    // Revenue trend by month
    const monthMap: Record<string, number> = {};
    safeRouteSales.forEach((r) => {
      if (r.bestMonth) {
        monthMap[r.bestMonth] = (monthMap[r.bestMonth] || 0) + (r.totalRevenue || 0);
      }
    });

    const monthsSorted = Object.keys(monthMap).sort();
    const monthLabels = monthsSorted.map((m) => {
      const [year, month] = m.split("-");
      return `${new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'short' })} ${year}`;
    });
    const monthRevenue = monthsSorted.map((m) => monthMap[m]);

    // Top performing data
    const topRoutes = [...safeFilteredRoutes]
      .sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0))
      .slice(0, 5);

    const topAgents = [...safeAgentSales]
      .sort((a, b) => (b.revenue || 0) - (a.revenue || 0))
      .slice(0, 5);

    const topConsultants = [...safeConsultantSales]
      .sort((a, b) => (b.revenue || 0) - (a.revenue || 0))
      .slice(0, 5);

    return {
      routeComparison: {
        labels: routeLabels,
        datasets: [
          {
            label: "Bookings",
            data: bookingsData,
            backgroundColor: "#f59e0b",
            borderRadius: 6,
            order: 2,
          },
          {
            label: "Revenue (P)",
            data: revenueData,
            backgroundColor: "#0d9488",
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
            borderColor: "#0d9488",
            tension: 0.4,
            pointRadius: 5,
            pointBackgroundColor: "#0d9488",
          },
        ],
      },
      revenueDistribution: {
        labels: topRoutes.map((r) => r.routeName || 'Unknown'),
        datasets: [
          {
            data: topRoutes.map((r) => r.totalRevenue || 0),
            backgroundColor: [
              "#0d9488", "#0f766e", "#14b8a6",
              "#f59e0b", "#fbbf24"
            ],
            borderWidth: 1,
          },
        ],
      },
      topAgents: {
        labels: topAgents.map((a) => a.name || 'Unknown'),
        datasets: [
          {
            label: "Revenue (P)",
            data: topAgents.map((a) => a.revenue || 0),
            backgroundColor: "#3b82f6",
            borderRadius: 6,
          },
        ],
      },
      topConsultants: {
        labels: topConsultants.map((c) => c.name || 'Unknown'),
        datasets: [
          {
            label: "Revenue (P)",
            data: topConsultants.map((c) => c.revenue || 0),
            backgroundColor: "#9333ea",
            borderRadius: 6,
          },
        ],
      },
    };
  }, [filteredRoutes, routeSales, agentSales, consultantSales]);

  // Enhanced Excel export with proper error handling
  const downloadExcel = () => {
    try {
      const workbook = XLSX.utils.book_new();
      
      // 1. Summary Sheet
      const summaryData = [
        ["Transport Performance Summary", "", "", ""],
        ["Generated", new Date().toLocaleString(), "", ""],
        ["", "", "", ""],
        ["Key Metrics", "Value", "", ""],
        ["Total Revenue", `P${kpis.totalRevenue.toLocaleString()}`, "", ""],
        ["Total Bookings", kpis.totalBookings.toLocaleString(), "", ""],
        ["Average Revenue per Booking", `P${kpis.avgRevenuePerBooking.toFixed(2)}`, "", ""],
        ["Top Performing Route", kpis.bestRoute, "", ""],
        ["Top Performing Agent", kpis.bestAgent, "", ""],
        ["Peak Performance Time", kpis.peakPerformance, "", ""]
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

      // 2. Route Performance Sheet
      const routeHeaders = ["Route Name", "Route Code", "Departure Time", "Bookings", "Revenue", "Best Day", "Best Month"];
      const routeRows = (filteredRoutes || []).flatMap((route) =>
        (route.times || []).map((time) => [
          route.routeName || '',
          route.route || '',
          time.departureTime || '',
          time.bookings || 0,
          time.revenue || 0,
          route.bestDay || '',
          route.bestMonth || ''
        ])
      );

      if (routeRows.length > 0) {
        const routeSheet = XLSX.utils.aoa_to_sheet([routeHeaders, ...routeRows]);
        XLSX.utils.book_append_sheet(workbook, routeSheet, "Route Performance");
      }

      // 3. Agent Performance Sheet
      const agentHeaders = ["Agent Name", "Bookings", "Revenue", "Commission", "Avg. Ticket Value"];
      const agentRows = (agentSales || []).map((agent) => [
        agent.name || '',
        agent.bookings || 0,
        agent.revenue || 0,
        agent.commission || 0,
        agent.bookings ? (agent.revenue || 0) / agent.bookings : 0
      ]);

      if (agentRows.length > 0) {
        const agentSheet = XLSX.utils.aoa_to_sheet([agentHeaders, ...agentRows]);
        XLSX.utils.book_append_sheet(workbook, agentSheet, "Agent Performance");
      }

      // 4. Consultant Performance Sheet
      const consultantHeaders = ["Consultant Name", "Bookings", "Revenue", "Commission", "Avg. Ticket Value"];
      const consultantRows = (consultantSales || []).map((consultant) => [
        consultant.name || '',
        consultant.bookings || 0,
        consultant.revenue || 0,
        consultant.commission || 0,
        consultant.bookings ? (consultant.revenue || 0) / consultant.bookings : 0
      ]);

      if (consultantRows.length > 0) {
        const consultantSheet = XLSX.utils.aoa_to_sheet([consultantHeaders, ...consultantRows]);
        XLSX.utils.book_append_sheet(workbook, consultantSheet, "Consultant Performance");
      }

      // Generate Excel file
      XLSX.writeFile(workbook, `Transport_Analytics_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
      console.error("Error generating Excel file:", err);
      alert("Failed to generate Excel report. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="p-3">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-6 w-full" />
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="p-4 h-64 sm:h-80">
                <Skeleton className="h-full w-full" />
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Data</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-gray-600">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Transport Analytics</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Comprehensive insights for optimizing operations
          </p>
        </div>
        <Button
          onClick={downloadExcel}
          className="bg-teal-600 hover:bg-teal-700 text-white shadow text-sm sm:text-base"
          size="sm"
        >
          <Download className="h-4 w-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Export Full Report</span>
          <span className="sm:hidden">Export</span>
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Card className="bg-white shadow-sm border border-gray-100">
          <CardHeader className="pb-2 p-3">
            <div className="flex items-center gap-2 text-gray-500">
              <BarChart2 className="h-4 w-4" />
              <CardTitle className="text-xs sm:text-sm font-medium">Total Revenue</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-3">
            <p className="text-lg sm:text-xl font-bold text-gray-900">
              P{(kpis.totalRevenue || 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border border-gray-100">
          <CardHeader className="pb-2 p-3">
            <div className="flex items-center gap-2 text-gray-500">
              <Route className="h-4 w-4" />
              <CardTitle className="text-xs sm:text-sm font-medium">Total Bookings</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-3">
            <p className="text-lg sm:text-xl font-bold text-gray-900">
              {(kpis.totalBookings || 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border border-gray-100">
          <CardHeader className="pb-2 p-3">
            <div className="flex items-center gap-2 text-gray-500">
              <ArrowUpRight className="h-4 w-4" />
              <CardTitle className="text-xs sm:text-sm font-medium">Avg. Ticket</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-3">
            <p className="text-lg sm:text-xl font-bold text-gray-900">
              P{(kpis.avgRevenuePerBooking || 0).toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border border-gray-100">
          <CardHeader className="pb-2 p-3">
            <div className="flex items-center gap-2 text-gray-500">
              <Route className="h-4 w-4" />
              <CardTitle className="text-xs sm:text-sm font-medium">Top Route</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-3">
            <p className="text-sm sm:text-base font-bold text-gray-900 line-clamp-1">
              {kpis.bestRoute}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border border-gray-100">
          <CardHeader className="pb-2 p-3">
            <div className="flex items-center gap-2 text-gray-500">
              <Calendar className="h-4 w-4" />
              <CardTitle className="text-xs sm:text-sm font-medium">Peak Time</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-3">
            <p className="text-sm sm:text-base font-bold text-gray-900 line-clamp-1">
              {kpis.peakPerformance}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white shadow-sm border border-gray-100">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label htmlFor="route-filter" className="block mb-1 text-xs sm:text-sm font-medium text-gray-700">
                Route
              </Label>
              <Select value={selectedRoute} onValueChange={setSelectedRoute}>
                <SelectTrigger className="w-full text-xs sm:text-sm h-9 sm:h-10">
                  <SelectValue placeholder="Select route" />
                </SelectTrigger>
                <SelectContent>
                  {routeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs sm:text-sm">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="month-filter" className="block mb-1 text-xs sm:text-sm font-medium text-gray-700">
                Month
              </Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-full text-xs sm:text-sm h-9 sm:h-10">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs sm:text-sm">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="timeframe-filter" className="block mb-1 text-xs sm:text-sm font-medium text-gray-700">
                Timeframe
              </Label>
              <Select value={timeframe} onValueChange={(v: any) => setTimeframe(v)}>
                <SelectTrigger className="w-full text-xs sm:text-sm h-9 sm:h-10">
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day" className="text-xs sm:text-sm">Daily</SelectItem>
                  <SelectItem value="week" className="text-xs sm:text-sm">Weekly</SelectItem>
                  <SelectItem value="month" className="text-xs sm:text-sm">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-4">
        {/* Route Performance */}
        <Card className="bg-white shadow-sm border border-gray-100 h-64 sm:h-80">
          <CardHeader className="p-4">
            <CardTitle className="text-base sm:text-lg font-semibold text-gray-900">
              Route Performance
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-gray-600">
              Bookings vs Revenue by route
            </CardDescription>
          </CardHeader>
          <CardContent className="p-2 sm:p-4 h-[calc(100%-80px)]">
            <BarChart
              data={chartData.routeComparison}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: "top", labels: { boxWidth: 12, font: { size: 10 } } },
                  tooltip: {
                    callbacks: {
                      label: (context) => {
                        const value = context.parsed?.y ?? context.parsed?.x ?? context.parsed;
                        return value !== undefined 
                          ? `${context.dataset.label || ''}: ${value.toLocaleString()}${(context.dataset.label || '').includes('Revenue') ? 'P' : ''}`
                          : '';
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: { color: "rgba(0,0,0,0.05)" },
                    ticks: {
                      callback: (value) => `P${Number(value).toLocaleString()}`,
                      font: { size: 9 }
                    }
                  },
                  x: { 
                    grid: { display: false },
                    ticks: { font: { size: 9 } }
                  }
                }
              }}
            />
          </CardContent>
        </Card>

        {/* Revenue Trend */}
        <Card className="bg-white shadow-sm border border-gray-100 h-64 sm:h-80">
          <CardHeader className="p-4">
            <CardTitle className="text-base sm:text-lg font-semibold text-gray-900">
              Revenue Trend
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-gray-600">
              Monthly revenue performance
            </CardDescription>
          </CardHeader>
          <CardContent className="p-2 sm:p-4 h-[calc(100%-80px)]">
            <LineChart
              data={chartData.revenueTrend}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: "top", labels: { boxWidth: 12, font: { size: 10 } } },
                  tooltip: {
                    callbacks: {
                      label: (context) => {
                        const value = context.parsed?.y ?? context.parsed?.x ?? context.parsed;
                        return value !== undefined ? `P${value.toLocaleString()}` : '';
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: { color: "rgba(0,0,0,0.05)" },
                    ticks: {
                      callback: (value) => `P${Number(value).toLocaleString()}`,
                      font: { size: 9 }
                    }
                  },
                  x: { 
                    grid: { display: false },
                    ticks: { font: { size: 9 } }
                  }
                }
              }}
            />
          </CardContent>
        </Card>

        {/* Revenue Distribution */}
        <Card className="bg-white shadow-sm border border-gray-100 h-64 sm:h-80">
          <CardHeader className="p-4">
            <CardTitle className="text-base sm:text-lg font-semibold text-gray-900">
              Revenue Distribution
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-gray-600">
              Top revenue-generating routes
            </CardDescription>
          </CardHeader>
          <CardContent className="p-2 sm:p-4 h-[calc(100%-80px)]">
            <PieChart
              data={chartData.revenueDistribution}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { 
                    position: "bottom",
                    labels: { 
                      boxWidth: 12,
                      font: { size: 10 },
                      padding: 10
                    }
                  },
                  tooltip: {
                    callbacks: {
                      label: (context) => {
                        const value = context.parsed ?? 0;
                        return `P${Number(value).toLocaleString()} (${Math.round(value / kpis.totalRevenue * 100)}%)`;
                      }
                    }
                  }
                }
              }}
            />
          </CardContent>
        </Card>

        {/* Top Agents */}
        <Card className="bg-white shadow-sm border border-gray-100 h-64 sm:h-80">
          <CardHeader className="p-4">
            <CardTitle className="text-base sm:text-lg font-semibold text-gray-900">
              Top Agents
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-gray-600">
              Revenue by sales agent
            </CardDescription>
          </CardHeader>
          <CardContent className="p-2 sm:p-4 h-[calc(100%-80px)]">
            <BarChart
              data={chartData.topAgents}
              options={{
                indexAxis: "y" as const,
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    callbacks: {
                      label: (context) => {
                        const value = context.parsed?.x ?? context.parsed?.y ?? context.parsed;
                        return value !== undefined ? `P${value.toLocaleString()}` : '';
                      }
                    }
                  }
                },
                scales: {
                  x: {
                    beginAtZero: true,
                    grid: { color: "rgba(0,0,0,0.05)" },
                    ticks: {
                      callback: (value) => `P${Number(value).toLocaleString()}`,
                      font: { size: 9 }
                    }
                  },
                  y: { 
                    grid: { display: false },
                    ticks: { font: { size: 9 } }
                  }
                }
              }}
            />
          </CardContent>
        </Card>

        {/* Top Consultants */}
        <Card className="bg-white shadow-sm border border-gray-100 h-64 sm:h-80">
          <CardHeader className="p-4">
            <CardTitle className="text-base sm:text-lg font-semibold text-gray-900">
              Top Consultants
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-gray-600">
              Revenue by sales consultant
            </CardDescription>
          </CardHeader>
          <CardContent className="p-2 sm:p-4 h-[calc(100%-80px)]">
            <BarChart
              data={chartData.topConsultants}
              options={{
                indexAxis: "y" as const,
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    callbacks: {
                      label: (context) => {
                        const value = context.parsed?.x ?? context.parsed?.y ?? context.parsed;
                        return value !== undefined ? `P${value.toLocaleString()}` : '';
                      }
                    }
                  }
                },
                scales: {
                  x: {
                    beginAtZero: true,
                    grid: { color: "rgba(0,0,0,0.05)" },
                    ticks: {
                      callback: (value) => `P${Number(value).toLocaleString()}`,
                      font: { size: 9 }
                    }
                  },
                  y: { 
                    grid: { display: false },
                    ticks: { font: { size: 9 } }
                  }
                }
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Detailed Data */}
      <Tabs defaultValue="routes" className="w-full">
        <TabsList className="bg-white border border-gray-200 w-full overflow-x-auto">
          <TabsTrigger 
            value="routes" 
            className="data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 text-xs sm:text-sm whitespace-nowrap"
          >
            Route Performance
          </TabsTrigger>
          <TabsTrigger 
            value="agents" 
            className="data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 text-xs sm:text-sm whitespace-nowrap"
          >
            Agent Performance
          </TabsTrigger>
          <TabsTrigger 
            value="consultants" 
            className="data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 text-xs sm:text-sm whitespace-nowrap"
          >
            Consultant Performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="routes">
          <Card className="bg-white shadow-sm border border-gray-100">
            <CardHeader className="p-4">
              <CardTitle className="text-base sm:text-lg font-semibold text-gray-900">
                Route Performance Details
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-gray-600">
                Breakdown by departure time
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table className="min-w-[600px] sm:min-w-full">
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-medium text-gray-700 text-xs sm:text-sm">Route</TableHead>
                      <TableHead className="font-medium text-gray-700 text-xs sm:text-sm">Departure</TableHead>
                      <TableHead className="font-medium text-gray-700 text-xs sm:text-sm text-right">Bookings</TableHead>
                      <TableHead className="font-medium text-gray-700 text-xs sm:text-sm text-right">Revenue</TableHead>
                      <TableHead className="font-medium text-gray-700 text-xs sm:text-sm">Peak Day</TableHead>
                      <TableHead className="font-medium text-gray-700 text-xs sm:text-sm">Peak Month</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRoutes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500 text-sm">
                          No data available for selected filters
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRoutes.flatMap((route) =>
                        (route.times || []).map((time) => (
                          <TableRow 
                            key={`${route.route || ''}-${time.departureTime || ''}`} 
                            className="hover:bg-gray-50"
                          >
                            <TableCell className="font-medium text-xs sm:text-sm">{route.routeName || 'Unknown'}</TableCell>
                            <TableCell className="text-xs sm:text-sm">{time.departureTime || 'N/A'}</TableCell>
                            <TableCell className="text-right text-xs sm:text-sm">{(time.bookings || 0).toLocaleString()}</TableCell>
                            <TableCell className="text-right text-xs sm:text-sm">P{(time.revenue || 0).toLocaleString()}</TableCell>
                            <TableCell className="text-xs sm:text-sm">{route.bestDay || 'N/A'}</TableCell>
                            <TableCell className="text-xs sm:text-sm">
                              {route.bestMonth 
                                ? new Date(route.bestMonth).toLocaleString('default', { month: 'short' }) 
                                : 'N/A'}
                            </TableCell>
                          </TableRow>
                        ))
                      )
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents">
          <Card className="bg-white shadow-sm border border-gray-100">
            <CardHeader className="p-4">
              <CardTitle className="text-base sm:text-lg font-semibold text-gray-900">
                Agent Performance
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-gray-600">
                Sales performance by agent
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table className="min-w-[600px] sm:min-w-full">
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-medium text-gray-700 text-xs sm:text-sm">Agent</TableHead>
                      <TableHead className="font-medium text-gray-700 text-xs sm:text-sm text-right">Bookings</TableHead>
                      <TableHead className="font-medium text-gray-700 text-xs sm:text-sm text-right">Revenue</TableHead>
                      <TableHead className="font-medium text-gray-700 text-xs sm:text-sm text-right">Commission</TableHead>
                      <TableHead className="font-medium text-gray-700 text-xs sm:text-sm text-right">Avg. Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agentSales.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500 text-sm">
                          No agent data available
                        </TableCell>
                      </TableRow>
                    ) : (
                      agentSales.map((agent) => (
                        <TableRow key={agent.id || ''} className="hover:bg-gray-50">
                          <TableCell className="font-medium text-xs sm:text-sm">{agent.name || 'Unknown'}</TableCell>
                          <TableCell className="text-right text-xs sm:text-sm">{(agent.bookings || 0).toLocaleString()}</TableCell>
                          <TableCell className="text-right text-xs sm:text-sm">P{(agent.revenue || 0).toLocaleString()}</TableCell>
                          <TableCell className="text-right text-xs sm:text-sm">P{(agent.commission || 0).toLocaleString()}</TableCell>
                          <TableCell className="text-right text-xs sm:text-sm">
                            P{agent.bookings ? ((agent.revenue || 0) / agent.bookings).toFixed(2) : 0}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consultants">
          <Card className="bg-white shadow-sm border border-gray-100">
            <CardHeader className="p-4">
              <CardTitle className="text-base sm:text-lg font-semibold text-gray-900">
                Consultant Performance
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-gray-600">
                Sales performance by consultant
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table className="min-w-[600px] sm:min-w-full">
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-medium text-gray-700 text-xs sm:text-sm">Consultant</TableHead>
                      <TableHead className="font-medium text-gray-700 text-xs sm:text-sm text-right">Bookings</TableHead>
                      <TableHead className="font-medium text-gray-700 text-xs sm:text-sm text-right">Revenue</TableHead>
                      <TableHead className="font-medium text-gray-700 text-xs sm:text-sm text-right">Commission</TableHead>
                      <TableHead className="font-medium text-gray-700 text-xs sm:text-sm text-right">Avg. Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {consultantSales.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500 text-sm">
                          No consultant data available
                        </TableCell>
                      </TableRow>
                    ) : (
                      consultantSales.map((consultant) => (
                        <TableRow key={consultant.id || ''} className="hover:bg-gray-50">
                          <TableCell className="font-medium text-xs sm:text-sm">{consultant.name || 'Unknown'}</TableCell>
                          <TableCell className="text-right text-xs sm:text-sm">{(consultant.bookings || 0).toLocaleString()}</TableCell>
                          <TableCell className="text-right text-xs sm:text-sm">P{(consultant.revenue || 0).toLocaleString()}</TableCell>
                          <TableCell className="text-right text-xs sm:text-sm">P{(consultant.commission || 0).toLocaleString()}</TableCell>
                          <TableCell className="text-right text-xs sm:text-sm">
                            P{consultant.bookings ? ((consultant.revenue || 0) / consultant.bookings).toFixed(2) : 0}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}