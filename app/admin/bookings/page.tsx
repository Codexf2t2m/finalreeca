// app/admin/bookings/page.tsx
"use client"
import { JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye, Search, CheckCircle, XCircle, QrCode, Download, Users } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { PrintableTicket } from "@/components/printable-ticket";
import { mockBookings } from "@/lib/data";



export default function BookingsManagement() {
  const [bookings, setBookings] = useState(mockBookings);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [showBookingDetails, setShowBookingDetails] = useState(false);
  const [showPrintTicket, setShowPrintTicket] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.passengerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.bookingRef.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || booking.bookingStatus.toLowerCase() === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleViewBooking = (booking: any) => {
    setSelectedBooking(booking);
    setShowBookingDetails(true);
  };

  const handlePrintTicket = (booking: any) => {
    setSelectedBooking(booking);
    setShowPrintTicket(true);
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
      ),
    );
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
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
            <Button className="bg-teal-600 hover:bg-teal-700 text-white">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
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
                      <p className="text-sm font-medium text-gray-900">{format(booking.date, "MMM dd, yyyy")}</p>
                      <p className="text-xs text-gray-600">{booking.time}</p>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {booking.seats
                          .filter((seat: any) => typeof seat === "string" || typeof seat === "number")
                          .map((seat: string | number) => (
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
                              : "bg-red-100 text-red-800",
                          )}
                        >
                          {booking.bookingStatus}
                        </Badge>
                        <Badge
                          className={cn(
                            "text-xs block",
                            booking.paymentStatus === "Paid"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800",
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
                        >
                          <QrCode className="h-4 w-4" />
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

      {/* Booking Details Dialog */}
      <Dialog open={showBookingDetails} onOpenChange={setShowBookingDetails}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-teal-900">Booking Details</DialogTitle>
            <DialogDescription>Complete information for booking {selectedBooking?.bookingRef}</DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-6">
              {/* Passenger Information */}
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

              {/* Journey Information */}
              <div className="p-4 bg-teal-50 rounded-lg">
                <h4 className="font-semibold mb-3 text-teal-800">Journey Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-teal-600">Route:</span>
                    <span className="font-semibold ml-2">{selectedBooking.route}</span>
                  </div>
                  <div>
                    <span className="text-teal-600">Date:</span>
                    <span className="font-semibold ml-2">{format(selectedBooking.date, "EEEE, MMMM dd, yyyy")}</span>
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

              {/* Seat Information */}
              <div className="p-4 bg-amber-50 rounded-lg">
                <h4 className="font-semibold mb-3 text-amber-800">Seat Information</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedBooking.seats.map((seat: string) => (
                    <Badge key={seat} className="bg-amber-600 text-white">
                      {seat}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Payment Information */}
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
                          : "bg-red-100 text-red-800",
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
                          : "bg-red-100 text-red-800",
                      )}
                    >
                      {selectedBooking.bookingStatus}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Special Requests */}
              {selectedBooking.specialRequests && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold mb-2 text-blue-800">Special Requests</h4>
                  <p className="text-sm text-blue-700">{selectedBooking.specialRequests}</p>
                </div>
              )}

              {/* Admin Actions */}
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

      {/* Print Ticket Dialog */}
      <Dialog open={showPrintTicket} onOpenChange={setShowPrintTicket}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-teal-900">Print Ticket</DialogTitle>
            <DialogDescription>Print or download ticket for {selectedBooking?.bookingRef}</DialogDescription>
          </DialogHeader>
          {selectedBooking && <PrintableTicket bookingData={selectedBooking} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
