"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye, Search, CheckCircle, XCircle, QrCode, Download, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { PrintableTicket, type BookingData, type PrintableTripData } from "@/components/printable-ticket";

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
  date: Date;
  time: string;
  bus: string;
  boardingPoint: string;
  droppingPoint: string;
  seats: string[];
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  bookingStatus: string;
  specialRequests: string;
  passengerList?: Passenger[];
  returnTrip?: TripData;
}

export default function BookingsManagement() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedBookingData, setSelectedBookingData] = useState<BookingData | null>(null);
  const [showBookingDetails, setShowBookingDetails] = useState(false);
  const [showPrintTicket, setShowPrintTicket] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tripTypeFilter, setTripTypeFilter] = useState<'all' | 'departure' | 'return'>('all');
  const [tripTypeForPrint, setTripTypeForPrint] = useState<"departure" | "return">("departure");
  const [loading, setLoading] = useState(false);

  // Format date function
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
    let matchesTripType = true;
    if (tripTypeFilter !== 'all') {
      if (tripTypeFilter === 'departure') {
        matchesTripType = !booking.returnTrip;
      } else {
        matchesTripType = !!booking.returnTrip;
      }
    }
    return matchesSearch && matchesStatus && matchesTripType;
  });

  const handleViewBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowBookingDetails(true);
  };

  // Convert Booking to PrintableTicket's BookingData format
  const convertToPrintableFormat = (booking: Booking): BookingData => {
    const departureTrip: PrintableTripData = {
      route: booking.route,
      date: booking.date,
      time: booking.time,
      bus: booking.bus,
      boardingPoint: booking.boardingPoint,
      droppingPoint: booking.droppingPoint,
      seats: booking.seats,
      passengers: booking.passengerList || []
    };

    const returnTrip: PrintableTripData | undefined = booking.returnTrip ? {
      route: booking.returnTrip.route,
      date: booking.returnTrip.date,
      time: booking.returnTrip.time,
      bus: booking.returnTrip.bus,
      boardingPoint: booking.returnTrip.boardingPoint,
      droppingPoint: booking.returnTrip.droppingPoint,
      seats: booking.returnTrip.seats,
      passengers: booking.returnTrip.passengers || []
    } : undefined;

    return {
      bookingRef: booking.bookingRef,
      userName: booking.passengerName,
      userEmail: booking.email,
      userPhone: booking.phone,
      totalAmount: booking.totalAmount,
      paymentMethod: booking.paymentMethod,
      paymentStatus: booking.paymentStatus,
      bookingStatus: booking.bookingStatus,
      departureTrip,
      returnTrip
    };
  };

  const handlePrintTicket = async (booking: Booking) => {
    setLoading(true);
    try {
      // Try to fetch from user API endpoint
      const response = await fetch(`/api/booking/${booking.bookingRef}`);
      if (!response.ok) throw new Error('Failed to fetch ticket data');
      
      const ticketData: BookingData = await response.json();
      setSelectedBookingData(ticketData);
      setTripTypeForPrint("departure");
      setShowPrintTicket(true);
    } catch (error) {
      console.error("Error fetching ticket data, using fallback:", error);
      // Fallback to converting admin booking data
      const convertedData = convertToPrintableFormat(booking);
      setSelectedBookingData(convertedData);
      setTripTypeForPrint("departure");
      setShowPrintTicket(true);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBookingStatus = (
    bookingId: string,
    newStatus: "Confirmed" | "Pending" | "Cancelled"
  ) => {
    setBookings((prev) =>
      prev.map((booking) =>
        booking.id === bookingId
          ? { ...booking, bookingStatus: newStatus }
          : booking
      )
    );
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
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
            <Select value={tripTypeFilter} onValueChange={value => setTripTypeFilter(value as 'all' | 'departure' | 'return')}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by trip type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Trips</SelectItem>
                <SelectItem value="departure">Departure Only</SelectItem>
                <SelectItem value="return">Return Trips</SelectItem>
              </SelectContent>
            </Select>
            <Button className="bg-teal-600 hover:bg-teal-700 text-white">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-teal-900">
            <Users className="h-5 w-5" />
            All Bookings ({filteredBookings.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left p-3 font-semibold text-gray-700">Booking Ref</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Passenger</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Route</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Date & Time</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Seats</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Amount</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Status</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking) => (
                  <tr key={booking.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3">
                      <span className="font-mono text-sm font-semibold text-teal-600">{booking.bookingRef}</span>
                    </td>
                    <td className="p-3">
                      <div>
                        <p className="font-semibold text-gray-900">{booking.passengerName}</p>
                        <p className="text-sm text-gray-600">{booking.email}</p>
                        <p className="text-sm text-gray-600">{booking.phone}</p>
                      </div>
                    </td>
                    <td className="p-3">
                      <p className="text-sm font-medium text-gray-900">{booking.route}</p>
                      <p className="text-xs text-gray-600">{booking.bus}</p>
                    </td>
                    <td className="p-3">
                      <p className="text-sm font-medium text-gray-900">{formatDate(booking.date, "MMM dd, yyyy")}</p>
                      <p className="text-xs text-gray-600">{booking.time}</p>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {booking.seats.map((seat) => (
                          <Badge key={seat} variant="outline" className="text-xs">
                            {seat}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{booking.passengers} passenger(s)</p>
                    </td>
                    <td className="p-3">
                      <p className="font-bold text-teal-600">P {booking.totalAmount}</p>
                      <p className="text-xs text-gray-600">{booking.paymentMethod}</p>
                    </td>
                    <td className="p-3">
                      <div className="space-y-1">
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
                        <Badge
                          className={cn(
                            "text-xs block",
                            booking.paymentStatus === "Paid"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          )}
                        >
                          {booking.paymentStatus}
                        </Badge>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewBooking(booking)}
                          className="text-teal-600 border-teal-600 hover:bg-teal-50"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePrintTicket(booking)}
                          className="text-amber-600 border-amber-300 hover:bg-amber-50"
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

              {selectedBooking.passengerList && (selectedBooking.passengerList.length > 0) && (
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
                      {(selectedBooking.passengerList || []).map((passenger, index) => (
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
                  {(selectedBooking.seats || []).map((seat) => (
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
              {selectedBookingData.returnTrip && (
                <div className="flex gap-4 mb-4">
                  <Button
                    variant={tripTypeForPrint === "departure" ? "default" : "outline"}
                    onClick={() => setTripTypeForPrint("departure")}
                    disabled={loading}
                  >
                    Departure Ticket
                  </Button>
                  <Button
                    variant={tripTypeForPrint === "return" ? "default" : "outline"}
                    onClick={() => setTripTypeForPrint("return")}
                    disabled={loading}
                  >
                    Return Ticket
                  </Button>
                </div>
              )}
              <PrintableTicket
                bookingData={selectedBookingData}
                tripType={tripTypeForPrint}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}