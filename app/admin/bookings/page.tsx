"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye, Search, CheckCircle, XCircle, QrCode, Download, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { PrintableTicket } from "@/components/printable-ticket";
import * as XLSX from "xlsx";

interface Passenger {
  name: string;
  seat: string;
  title?: string;
  isReturn?: boolean;
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

  return (
    <div className="space-y-6">
      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by name, booking ref, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-auto">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
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
                <SelectTrigger className="w-full md:w-32">
                  <SelectValue placeholder="Items per page" />
                </SelectTrigger>
                <SelectContent>
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
            >
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-gray-200 shadow-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">
                Bookings Management
              </CardTitle>
              <CardDescription className="text-sm text-gray-600">
                {filteredBookings.length} bookings found
              </CardDescription>
            </div>
            {filteredBookings.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Page {currentPage} of {totalPages}</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {filteredBookings.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search or filter criteria
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Booking Ref
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Passenger
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Route
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentItems.map((booking) => (
                      <tr key={booking.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-teal-600">{booking.bookingRef}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{booking.passengerName}</div>
                          <div className="text-sm text-gray-500">{booking.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{booking.route}</div>
                          <div className="text-xs text-gray-500">{booking.bus}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDate(booking.date, "MMM dd, yyyy")}
                          </div>
                          <div className="text-xs text-gray-500">{booking.time}</div>
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
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePrintTicket(booking)}
                              className="text-gray-600 hover:text-amber-600"
                              disabled={loading}
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
                  <div className="text-sm text-gray-700">
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
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    {totalPages > 5 && currentPage < totalPages - 2 && (
                      <span className="flex items-center px-3 text-sm text-gray-700">...</span>
                    )}
                    {totalPages > 5 && currentPage < totalPages - 2 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => paginate(totalPages)}
                      >
                        {totalPages}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={nextPage}
                      disabled={currentPage === totalPages}
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

      <Dialog open={showBookingDetails} onOpenChange={setShowBookingDetails}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-teal-900">Booking Details</DialogTitle>
            <DialogDescription>Complete information for booking {selectedBooking?.bookingRef}</DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-3 text-gray-800">Passenger Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <span className="font-semibold ml-2">{selectedBooking.passengerName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <span className="font-semibold ml-2">{selectedBooking.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-semibold ml-2">{selectedBooking.phone}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Passengers:</span>
                    <span className="font-semibold ml-2">{selectedBooking.passengers}</span>
                  </div>
                </div>
              </div>

              {selectedBooking.passengerList && selectedBooking.passengerList.length > 0 && (
                <div className="p-4 bg-gray-100 rounded-lg">
                  <h4 className="font-semibold mb-3 text-gray-800">Passenger List</h4>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Name</th>
                        <th className="text-left p-2">Seat</th>
                        <th className="text-left p-2">Title</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedBooking.passengerList.map((passenger, index) => (
                        <tr key={index} className="border-b last:border-0">
                          <td className="p-2">{passenger.name}</td>
                          <td className="p-2">{passenger.seat}</td>
                          <td className="p-2">{passenger.title || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="p-4 bg-teal-50 rounded-lg">
                <h4 className="font-semibold mb-3 text-teal-800">Journey Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-teal-600">Route:</span>
                    <span className="font-semibold ml-2">{selectedBooking.route}</span>
                  </div>
                  <div>
                    <span className="text-teal-600">Date:</span>
                    <span className="font-semibold ml-2">{formatDate(selectedBooking.date, "EEEE, MMMM dd, yyyy")}</span>
                  </div>
                  <div>
                    <span className="text-teal-600">Time:</span>
                    <span className="font-semibold ml-2">{selectedBooking.time}</span>
                  </div>
                  <div>
                    <span className="text-teal-600">Bus:</span>
                    <span className="font-semibold ml-2">{selectedBooking.bus}</span>
                  </div>
                  <div>
                    <span className="text-teal-600">Boarding:</span>
                    <span className="font-semibold ml-2">{selectedBooking.boardingPoint}</span>
                  </div>
                  <div>
                    <span className="text-teal-600">Dropping:</span>
                    <span className="font-semibold ml-2">{selectedBooking.droppingPoint}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-amber-50 rounded-lg">
                <h4 className="font-semibold mb-3 text-amber-800">Seat Information</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedBooking.seats.map((seat) => (
                    <Badge key={seat} className="bg-amber-600 text-white">
                      {seat}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold mb-3 text-green-800">Payment Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-green-600">Total Amount:</span>
                    <span className="font-bold ml-2 text-lg">P {selectedBooking.totalAmount}</span>
                  </div>
                  <div>
                    <span className="text-green-600">Payment Method:</span>
                    <span className="font-semibold ml-2">{selectedBooking.paymentMethod}</span>
                  </div>
                  <div>
                    <span className="text-green-600">Payment Status:</span>
                    <Badge
                      className={cn(
                        "ml-2",
                        selectedBooking.paymentStatus === "Paid"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      )}
                    >
                      {selectedBooking.paymentStatus}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-green-600">Booking Status:</span>
                    <Badge
                      className={cn(
                        "ml-2",
                        selectedBooking.bookingStatus === "Confirmed"
                          ? "bg-green-100 text-green-800"
                          : selectedBooking.bookingStatus === "Pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                      )}
                    >
                      {selectedBooking.bookingStatus}
                    </Badge>
                  </div>
                </div>
              </div>

              {selectedBooking.specialRequests && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold mb-2 text-blue-800">Special Requests</h4>
                  <p className="text-sm text-blue-700">{selectedBooking.specialRequests}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={() => handleUpdateBookingStatus(selectedBooking.id, "Confirmed")}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  disabled={selectedBooking.bookingStatus === "Confirmed"}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirm Booking
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleUpdateBookingStatus(selectedBooking.id, "Cancelled")}
                  disabled={selectedBooking.bookingStatus === "Cancelled"}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Booking
                </Button>
                <Button
                  variant="outline"
                  className="text-teal-600 border-teal-600"
                  onClick={() => {
                    setShowBookingDetails(false);
                    handlePrintTicket(selectedBooking);
                  }}
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  Print Ticket
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showPrintTicket} onOpenChange={setShowPrintTicket}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-teal-900">Print Ticket</DialogTitle>
            <DialogDescription>
              Print or download ticket for {selectedBookingData?.bookingRef}
            </DialogDescription>
          </DialogHeader>
          {selectedBookingData && (
            <div className="space-y-4">
              <PrintableTicket bookingData={selectedBookingData} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}