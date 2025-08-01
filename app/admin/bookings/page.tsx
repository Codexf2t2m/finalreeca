"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye, Search, CheckCircle, XCircle, QrCode, Download, Users, ChevronLeft, ChevronRight, Mail, CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";
import { PrintableTicket } from "@/components/printable-ticket";
import * as XLSX from "xlsx";

// Define color scheme
const colors = {
  primary: '#009393',       // Teal
  secondary: '#febf00',     // Gold
  accent: '#958c55',        // Olive
  muted: '#f5f5f5',         // Light gray
  dark: '#1a1a1a',          // Dark gray
  light: '#ffffff',         // White
  destructive: '#ef4444'    // Red
};

interface Passenger {
  name: string;
  seat: string;
  title?: string;
  isReturn?: boolean;
  type?: string;
  passportNumber?: string;
  hasInfant?: boolean;
  infantName?: string;
  infantBirthdate?: string;
  infantPassportNumber?: string;
}

interface TripData {
  route: string;
  date: Date | string;
  time: string;
  bus: string;
  boardingPoint: string;
  droppingPoint: string;
  seats: string[];
  passengers?: Passenger[];
}

interface Booking {
  id: string;
  bookingRef: string;
  passengerName: string;
  email: string;
  phone: string;
  passengers: number;
  route: string;
  date: Date | string;
  time: string;
  bus: string;
  boardingPoint: string;
  droppingPoint: string;
  seats: string[];
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  bookingStatus: string;
  specialRequests?: string;
  passengerList?: Passenger[];
  returnTrip?: TripData;
}

export default function BookingsManagement() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedBookingData, setSelectedBookingData] = useState<any>(null);
  const [showBookingDetails, setShowBookingDetails] = useState(false);
  const [showPrintTicket, setShowPrintTicket] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showSendTicketModal, setShowSendTicketModal] = useState(false);
  const [newDepartureDate, setNewDepartureDate] = useState("");
  const [newDepartureTime, setNewDepartureTime] = useState("");
  const [newReturnDate, setNewReturnDate] = useState("");
  const [newReturnTime, setNewReturnTime] = useState("");
  const [email, setEmail] = useState("");

  const formatDate = (date: Date | string | undefined, formatStr: string) => {
    if (!date) return "N/A";
    const dateObj = typeof date === "string" ? new Date(date) : date;
    if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) return "N/A";
    
    const options: Intl.DateTimeFormatOptions = {};
    if (formatStr.includes("EEEE")) options.weekday = "long";
    if (formatStr.includes("MMMM")) options.month = "long";
    else if (formatStr.includes("MMM")) options.month = "short";
    if (formatStr.includes("dd")) options.day = "2-digit";
    if (formatStr.includes("yyyy")) options.year = "numeric";
    
    return dateObj.toLocaleDateString("en-US", options);
  };

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await fetch("/api/admin/booking");
        if (!response.ok) throw new Error("Failed to fetch bookings");
        const data = await response.json();
        setBookings(data);
      } catch (error) {
        console.error("Error fetching bookings:", error);
      }
    };
    fetchBookings();
  }, []);

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.passengerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.bookingRef.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || booking.bookingStatus.toLowerCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredBookings.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const nextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);
  const prevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);

  const handleViewBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowBookingDetails(true);
    setEmail(booking.email);
  };

  const handlePrintTicket = async (booking: Booking) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/booking/${booking.bookingRef}`);
      if (!response.ok) throw new Error('Failed to fetch ticket data');
      const ticketData = await response.json();
      setSelectedBookingData(ticketData);
    } catch (error) {
      console.error("Error fetching ticket data:", error);
      // Fallback to basic data if API fails
      setSelectedBookingData({
        bookingRef: booking.bookingRef,
        userName: booking.passengerName,
        userEmail: booking.email,
        userPhone: booking.phone,
        totalAmount: booking.totalAmount,
        paymentMethod: booking.paymentMethod,
        paymentStatus: booking.paymentStatus,
        bookingStatus: booking.bookingStatus,
        departureTrip: {
          route: booking.route,
          date: booking.date,
          time: booking.time,
          bus: booking.bus,
          boardingPoint: booking.boardingPoint,
          droppingPoint: booking.droppingPoint,
          seats: booking.seats,
          passengers: booking.passengerList || []
        },
        returnTrip: booking.returnTrip ? {
          route: booking.returnTrip.route,
          date: booking.returnTrip.date,
          time: booking.returnTrip.time,
          bus: booking.returnTrip.bus,
          boardingPoint: booking.returnTrip.boardingPoint,
          droppingPoint: booking.returnTrip.droppingPoint,
          seats: booking.returnTrip.seats,
          passengers: booking.returnTrip.passengers || []
        } : undefined
      });
    } finally {
      setLoading(false);
      setShowPrintTicket(true);
    }
  };

  const handleUpdateBookingStatus = (bookingId: string, newStatus: "Confirmed" | "Pending" | "Cancelled") => {
    setBookings(prev =>
      prev.map(booking =>
        booking.id === bookingId ? { ...booking, bookingStatus: newStatus } : booking
      )
    );
  };

  const handleExportExcel = () => {
    const exportData = bookings.map((booking) => ({
      "Booking Ref": booking.bookingRef,
      "Passenger Name": booking.passengerName,
      "Email": booking.email,
      "Phone": booking.phone,
      "Passengers": booking.passengers,
      "Route": booking.route,
      "Date": formatDate(booking.date, "yyyy-MM-dd"),
      "Time": booking.time,
      "Bus": booking.bus,
      "Boarding Point": booking.boardingPoint,
      "Dropping Point": booking.droppingPoint,
      "Seats": booking.seats.join(", "),
      "Total Amount": booking.totalAmount,
      "Payment Method": booking.paymentMethod,
      "Payment Status": booking.paymentStatus,
      "Booking Status": booking.bookingStatus,
      "Special Requests": booking.specialRequests || "None",
      "Passenger List": booking.passengerList
        ? booking.passengerList.map(p => `${p.name} (${p.seat})`).join("; ")
        : "None",
      "Return Trip": booking.returnTrip
        ? `Route: ${booking.returnTrip.route}, Date: ${formatDate(booking.returnTrip.date, "yyyy-MM-dd")}`
        : "None"
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bookings");
    XLSX.writeFile(workbook, "bookings_export.xlsx");
  };

  const handleRescheduleBooking = async () => {
    if (!selectedBooking) return;
    
    try {
      const response = await fetch("/api/booking/reschedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: selectedBooking.bookingRef,
          newDepartureDate,
          newDepartureTime,
          newReturnDate: selectedBooking.returnTrip ? newReturnDate : undefined,
          newReturnTime: selectedBooking.returnTrip ? newReturnTime : undefined,
        }),
      });
      
      if (!response.ok) throw new Error("Failed to reschedule booking");
      
      const data = await response.json();
      setBookings(prev => prev.map(b => b.id === selectedBooking.id ? data : b));
      setShowRescheduleModal(false);
      setShowSendTicketModal(true);
    } catch (error) {
      console.error("Reschedule failed:", error);
      alert("Reschedule failed: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  const handleSendTicket = async () => {
    if (!selectedBooking) return;
    
    try {
      const response = await fetch("/api/send-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: selectedBooking.bookingRef,
          email: email || selectedBooking.email,
        }),
      });
      
      if (!response.ok) throw new Error("Failed to send ticket");
      
      alert("Ticket sent successfully!");
      setShowSendTicketModal(false);
    } catch (error) {
      console.error("Send ticket failed:", error);
      alert("Send ticket failed: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6" style={{ backgroundColor: colors.muted }}>
      {/* Search and Filter Card */}
      <Card className="border border-gray-200 shadow-sm" style={{ backgroundColor: colors.light }}>
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by name, booking ref, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  style={{ borderColor: colors.accent }}
                />
              </div>
            </div>
            <div className="w-full md:w-auto">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48" style={{ borderColor: colors.accent }}>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: colors.light }}>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-auto">
              <Select 
                value={itemsPerPage.toString()} 
                onValueChange={(value) => {
                  setItemsPerPage(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full md:w-32" style={{ borderColor: colors.accent }}>
                  <SelectValue placeholder="Items per page" />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: colors.light }}>
                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="25">25 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                  <SelectItem value="100">100 per page</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              className="border-teal-600 text-teal-600 hover:bg-teal-50"
              onClick={handleExportExcel}
              style={{ borderColor: colors.primary, color: colors.primary }}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table Card */}
      <Card className="border border-gray-200 shadow-sm" style={{ backgroundColor: colors.light }}>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-semibold" style={{ color: colors.dark }}>
                Bookings Management
              </CardTitle>
              <CardDescription className="text-sm" style={{ color: colors.accent }}>
                {filteredBookings.length} bookings found
              </CardDescription>
            </div>
            {filteredBookings.length > 0 && (
              <div className="flex items-center gap-2 text-sm" style={{ color: colors.accent }}>
                <span>Page {currentPage} of {totalPages}</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {filteredBookings.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="mx-auto h-12 w-12" style={{ color: colors.accent }} />
              <h3 className="mt-2 text-sm font-medium" style={{ color: colors.dark }}>No bookings found</h3>
              <p className="mt-1 text-sm" style={{ color: colors.accent }}>
                Try adjusting your search or filter criteria
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colors.dark }}>
                        Booking Ref
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colors.dark }}>
                        Passenger
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colors.dark }}>
                        Route
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colors.dark }}>
                        Date & Time
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colors.dark }}>
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: colors.dark }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentItems.map((booking) => (
                      <tr key={booking.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium" style={{ color: colors.primary }}>{booking.bookingRef}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium" style={{ color: colors.dark }}>{booking.passengerName}</div>
                          <div className="text-sm" style={{ color: colors.accent }}>{booking.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm" style={{ color: colors.dark }}>{booking.route}</div>
                          <div className="text-xs" style={{ color: colors.accent }}>{booking.bus}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm" style={{ color: colors.dark }}>
                            {formatDate(booking.date, "MMM dd, yyyy")}
                          </div>
                          <div className="text-xs" style={{ color: colors.accent }}>{booking.time}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge
                            className={cn(
                              "text-xs",
                              booking.bookingStatus === "Confirmed"
                                ? "bg-green-100 text-green-800"
                                : booking.bookingStatus === "Pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                            )}
                          >
                            {booking.bookingStatus}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewBooking(booking)}
                              className="text-gray-600 hover:text-teal-600"
                              style={{ color: colors.primary }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePrintTicket(booking)}
                              className="text-gray-600 hover:text-amber-600"
                              disabled={loading}
                              style={{ color: colors.secondary }}
                            >
                              {loading ? (
                                <span className="h-4 w-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></span>
                              ) : (
                                <QrCode className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm" style={{ color: colors.dark }}>
                    Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{" "}
                    <span className="font-medium">
                      {Math.min(indexOfLastItem, filteredBookings.length)}
                    </span>{" "}
                    of <span className="font-medium">{filteredBookings.length}</span> bookings
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={prevPage}
                      disabled={currentPage === 1}
                      style={{ borderColor: colors.primary, color: colors.primary }}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => paginate(pageNum)}
                          style={{
                            backgroundColor: currentPage === pageNum ? colors.primary : colors.light,
                            borderColor: currentPage === pageNum ? colors.primary : colors.accent,
                            color: currentPage === pageNum ? colors.light : colors.dark
                          }}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    {totalPages > 5 && currentPage < totalPages - 2 && (
                      <span className="flex items-center px-3 text-sm" style={{ color: colors.accent }}>...</span>
                    )}
                    {totalPages > 5 && currentPage < totalPages - 2 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => paginate(totalPages)}
                        style={{ borderColor: colors.primary, color: colors.primary }}
                      >
                        {totalPages}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={nextPage}
                      disabled={currentPage === totalPages}
                      style={{ borderColor: colors.primary, color: colors.primary }}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Booking Details Modal */}
      <Dialog open={showBookingDetails} onOpenChange={setShowBookingDetails}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: colors.light }}>
          <DialogHeader>
            <DialogTitle style={{ color: colors.primary }}>Booking Details</DialogTitle>
            <DialogDescription style={{ color: colors.accent }}>
              Manage booking <span className="font-bold">{selectedBooking?.bookingRef}</span>
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-6">
              {/* Booking Info */}
              <section>
                <h4 className="font-semibold mb-2" style={{ color: colors.dark }}>Booking Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div><span style={{ color: colors.accent }}>Passenger:</span> <span className="font-semibold" style={{ color: colors.dark }}>{selectedBooking.passengerName}</span></div>
                  <div><span style={{ color: colors.accent }}>Email:</span> <span className="font-semibold" style={{ color: colors.dark }}>{selectedBooking.email}</span></div>
                  <div><span style={{ color: colors.accent }}>Phone:</span> <span className="font-semibold" style={{ color: colors.dark }}>{selectedBooking.phone}</span></div>
                  <div><span style={{ color: colors.accent }}>Status:</span> <Badge>{selectedBooking.bookingStatus}</Badge></div>
                </div>
              </section>
              
              {/* Passenger List */}
              {selectedBooking.passengerList && (
                <section>
                  <h4 className="font-semibold mb-2" style={{ color: colors.dark }}>Passenger List</h4>
                  <div className="border rounded-lg overflow-hidden" style={{ borderColor: colors.accent }}>
                    <table className="w-full text-sm">
                      <thead style={{ backgroundColor: colors.muted }}>
                        <tr>
                          <th className="px-4 py-2 text-left" style={{ color: colors.dark }}>Name</th>
                          <th className="px-4 py-2 text-left" style={{ color: colors.dark }}>Seat</th>
                          <th className="px-4 py-2 text-left" style={{ color: colors.dark }}>Type</th>
                          <th className="px-4 py-2 text-left" style={{ color: colors.dark }}>Passport</th>
                          <th className="px-4 py-2 text-left" style={{ color: colors.dark }}>Infant</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedBooking.passengerList.map((p, idx) => (
                          <tr key={idx} className={idx % 2 === 0 ? "" : "bg-gray-50"}>
                            <td className="px-4 py-2" style={{ color: colors.dark }}>{p.name}</td>
                            <td className="px-4 py-2" style={{ color: colors.dark }}>{p.seat}</td>
                            <td className="px-4 py-2" style={{ color: colors.dark }}>{p.type || "Adult"}</td>
                            <td className="px-4 py-2" style={{ color: colors.dark }}>{p.passportNumber || "-"}</td>
                            <td className="px-4 py-2" style={{ color: colors.dark }}>
                              {p.hasInfant ? (
                                <>
                                  Yes
                                  {p.infantName && ` (${p.infantName})`}
                                  {p.infantBirthdate && `, DOB: ${p.infantBirthdate}`}
                                  {p.infantPassportNumber && `, Cert: ${p.infantPassportNumber}`}
                                </>
                              ) : "No"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
              
              {/* Journey Info */}
              <section>
                <h4 className="font-semibold mb-2" style={{ color: colors.primary }}>Journey Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span style={{ color: colors.primary }}>Route:</span> <span className="font-semibold" style={{ color: colors.dark }}>{selectedBooking.route}</span>
                  </div>
                  <div>
                    <span style={{ color: colors.primary }}>Date:</span> <span className="font-semibold" style={{ color: colors.dark }}>{formatDate(selectedBooking.date, "EEEE, MMMM dd, yyyy")}</span>
                  </div>
                  <div>
                    <span style={{ color: colors.primary }}>Time:</span> <span className="font-semibold" style={{ color: colors.dark }}>{selectedBooking.time}</span>
                  </div>
                  <div>
                    <span style={{ color: colors.primary }}>Bus:</span> <span className="font-semibold" style={{ color: colors.dark }}>{selectedBooking.bus}</span>
                  </div>
                  <div>
                    <span style={{ color: colors.primary }}>Boarding:</span> <span className="font-semibold" style={{ color: colors.dark }}>{selectedBooking.boardingPoint}</span>
                  </div>
                  <div>
                    <span style={{ color: colors.primary }}>Dropping:</span> <span className="font-semibold" style={{ color: colors.dark }}>{selectedBooking.droppingPoint}</span>
                  </div>
                </div>
              </section>
              
              {/* Payment Info */}
              <section>
                <h4 className="font-semibold mb-2" style={{ color: colors.secondary }}>Payment Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div><span style={{ color: colors.accent }}>Method:</span> <span className="font-semibold" style={{ color: colors.dark }}>{selectedBooking.paymentMethod}</span></div>
                  <div><span style={{ color: colors.accent }}>Status:</span> <span className="font-semibold" style={{ color: colors.dark }}>{selectedBooking.paymentStatus}</span></div>
                  <div><span style={{ color: colors.accent }}>Amount:</span> <span className="font-semibold" style={{ color: colors.dark }}>{selectedBooking.totalAmount.toFixed(2)} USD</span></div>
                </div>
              </section>
              
              {/* Actions */}
              <section>
                <h4 className="font-semibold mb-2" style={{ color: colors.dark }}>Actions</h4>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowRescheduleModal(true);
                      setShowBookingDetails(false);
                    }}
                    style={{ borderColor: colors.primary, color: colors.primary }}
                  >
                    <CalendarClock className="h-4 w-4 mr-2" />
                    Reschedule Booking
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowSendTicketModal(true);
                      setShowBookingDetails(false);
                    }}
                    style={{ borderColor: colors.primary, color: colors.primary }}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Send Ticket
                  </Button>
                </div>
              </section>
            </div>
          )}
        </DialogContent>
      </Dialog>

{/* Reschedule Modal */}
<Dialog open={showRescheduleModal} onOpenChange={setShowRescheduleModal}>
  <DialogContent className="max-w-md" style={{ backgroundColor: colors.light }}>
    <DialogHeader>
      <DialogTitle style={{ color: colors.primary }}>Reschedule Booking</DialogTitle>
      <DialogDescription style={{ color: colors.accent }}>
        Update the travel dates for booking {selectedBooking?.bookingRef}
        {selectedBooking?.returnTrip && (
          <span className="block mt-1 text-sm font-medium" style={{ color: colors.secondary }}>
            (Round Trip Booking)
          </span>
        )}
      </DialogDescription>
    </DialogHeader>
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: colors.dark }}>
          New Departure Date
        </label>
        <Input 
          type="date" 
          value={newDepartureDate} 
          onChange={(e) => setNewDepartureDate(e.target.value)} 
          style={{ borderColor: colors.accent }}
          min={formatDate(new Date(), 'yyyy-MM-dd')} // Can't reschedule to past dates
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: colors.dark }}>
          New Departure Time
        </label>
        <Input 
          type="time" 
          value={newDepartureTime} 
          onChange={(e) => setNewDepartureTime(e.target.value)} 
          style={{ borderColor: colors.accent }}
        />
      </div>

      {/* Conditional Return Trip Fields */}
      {selectedBooking?.returnTrip && (
        <>
          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium mb-3" style={{ color: colors.secondary }}>
              Return Trip Details
            </h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: colors.dark }}>
                  New Return Date
                </label>
                <Input 
                  type="date" 
                  value={newReturnDate} 
                  onChange={(e) => setNewReturnDate(e.target.value)} 
                  style={{ borderColor: colors.accent }}
                  min={newDepartureDate || formatDate(new Date(), 'yyyy-MM-dd')} // Return can't be before departure
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: colors.dark }}>
                  New Return Time
                </label>
                <Input 
                  type="time" 
                  value={newReturnTime} 
                  onChange={(e) => setNewReturnTime(e.target.value)} 
                  style={{ borderColor: colors.accent }}
                />
              </div>
            </div>
          </div>
          
          {/* Validation message if dates are invalid */}
          {newDepartureDate && newReturnDate && newDepartureDate > newReturnDate && (
            <div className="text-sm p-2 rounded-md" style={{ backgroundColor: colors.destructive + '10', color: colors.destructive }}>
              Return date cannot be before departure date
            </div>
          )}
        </>
      )}
    </div>
    <DialogFooter>
      <Button 
        variant="outline" 
        onClick={() => setShowRescheduleModal(false)}
        style={{ borderColor: colors.primary, color: colors.primary }}
      >
        Cancel
      </Button>
      <Button 
        onClick={handleRescheduleBooking}
        style={{ backgroundColor: colors.primary }}
        disabled={
          !!(
            selectedBooking?.returnTrip &&
            newDepartureDate &&
            newReturnDate &&
            newDepartureDate > newReturnDate
          )
        }
      >
        Reschedule & Send Ticket
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

      {/* Send Ticket Modal */}
      <Dialog open={showSendTicketModal} onOpenChange={setShowSendTicketModal}>
        <DialogContent className="max-w-md" style={{ backgroundColor: colors.light }}>
          <DialogHeader>
            <DialogTitle style={{ color: colors.primary }}>Send Ticket</DialogTitle>
            <DialogDescription style={{ color: colors.accent }}>
              Send booking confirmation to the passenger
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: colors.dark }}>Recipient Email</label>
              <Input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                style={{ borderColor: colors.accent }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowSendTicketModal(false)}
              style={{ borderColor: colors.primary, color: colors.primary }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSendTicket}
              style={{ backgroundColor: colors.primary }}
            >
              Send Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Print Ticket Modal */}
      <Dialog open={showPrintTicket} onOpenChange={setShowPrintTicket}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: colors.light }}>
          <DialogHeader>
            <DialogTitle style={{ color: colors.primary }}>Printable Ticket</DialogTitle>
            <DialogDescription style={{ color: colors.accent }}>
              Print or download ticket for {selectedBookingData?.bookingRef}
            </DialogDescription>
          </DialogHeader>
          {selectedBookingData && (
            <div className="space-y-4">
              <PrintableTicket bookingData={selectedBookingData} />
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => window.print()}
                  style={{ borderColor: colors.primary, color: colors.primary }}
                >
                  Print Ticket
                </Button>
                <Button 
                  onClick={() => {
                    setShowSendTicketModal(true);
                    setShowPrintTicket(false);
                  }}
                  style={{ backgroundColor: colors.primary }}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Send to Passenger
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}