import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, MapPin, Clock, AlertTriangle, X } from "lucide-react";
import { format, addDays } from "date-fns";
import { Booking } from "@/lib/types";

interface TripManagementProps {
  bookings: Booking[];
  setBookings: React.Dispatch<React.SetStateAction<Booking[]>>;
}

export default function TripManagement({ bookings, setBookings }: TripManagementProps) {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [newDate, setNewDate] = useState<Date>();
  const [newTime, setNewTime] = useState("");
  const [cancelReason, setCancelReason] = useState("");

  const handleCancelTrip = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowCancelDialog(true);
  };

  const handleRescheduleTrip = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowRescheduleDialog(true);
  };

  const confirmCancel = () => {
    if (selectedBooking) {
      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === selectedBooking.id ? { ...booking, bookingStatus: "Cancelled" } : booking
        )
      );
    }
    setShowCancelDialog(false);
    setSelectedBooking(null);
    setCancelReason("");
  };

  const confirmReschedule = () => {
    if (selectedBooking && newDate && newTime) {
      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === selectedBooking.id ? { ...booking, date: newDate, time: newTime } : booking
        )
      );
    }
    setShowRescheduleDialog(false);
    setSelectedBooking(null);
    setNewDate(undefined);
    setNewTime("");
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2 text-gray-800">Manage Your Trips</h2>
        <p className="text-gray-600">View, reschedule, or cancel your Reeca Travel bookings</p>
      </div>

      <div className="space-y-4">
        {bookings.map((booking) => (
          <Card key={booking.id} className="border-0 shadow-lg border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Badge
                    className={`px-3 py-1 ${
                      booking.bookingStatus === "Confirmed"
                        ? "bg-green-100 text-green-800 border-green-300"
                        : "bg-red-100 text-red-800 border-red-300"
                    }`}
                  >
                    {booking.bookingStatus === "Confirmed" ? "Confirmed" : "Cancelled"}
                  </Badge>
                  <span className="font-bold text-lg text-gray-800">#{booking.id}</span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-teal-600">P {booking.totalAmount}</div>
                  <div className="text-sm text-gray-600">Total Paid</div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-teal-600" />
                    <span className="font-semibold">{booking.route}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-teal-600" />
                    <span>{format(booking.date, "EEEE, MMMM do, yyyy")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-teal-600" />
                    <span>{booking.time}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-gray-600">Bus: </span>
                    <span className="font-semibold">{booking.bus}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Seats: </span>
                    <span className="font-semibold">{booking.seats.join(", ")}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Passengers: </span>
                    <span className="font-semibold">{booking.seats.length}</span>
                  </div>
                </div>
              </div>

              {booking.bookingStatus === "Confirmed" && (
                <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    onClick={() => handleRescheduleTrip(booking)}
                    className="flex-1 border-teal-600 text-teal-600 hover:bg-teal-50"
                    disabled={booking.date < addDays(new Date(), 1)}
                  >
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    Reschedule
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleCancelTrip(booking)}
                    className="flex-1"
                    disabled={booking.date < addDays(new Date(), 1)}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel Trip
                  </Button>
                </div>
              )}

              {booking.date < addDays(new Date(), 1) && booking.bookingStatus === "Confirmed" && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-700">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm">Changes not allowed within 24 hours of departure</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Cancel Trip
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this trip? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedBooking && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm space-y-1">
                  <div>
                    <strong>Trip:</strong> {selectedBooking.route}
                  </div>
                  <div>
                    <strong>Date:</strong> {format(selectedBooking.date, "PPP")}
                  </div>
                  <div>
                    <strong>Time:</strong> {selectedBooking.time}
                  </div>
                </div>
              </div>
            )}
            <div>
              <Label htmlFor="cancelReason">Reason for cancellation (optional)</Label>
              <Textarea
                id="cancelReason"
                placeholder="Please let us know why you're cancelling..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowCancelDialog(false)} className="flex-1">
                Keep Trip
              </Button>
              <Button variant="destructive" onClick={confirmCancel} className="flex-1">
                Cancel Trip
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showRescheduleDialog} onOpenChange={setShowRescheduleDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-teal-500" />
              Reschedule Trip
            </DialogTitle>
            <DialogDescription>Select a new date and time for your trip.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedBooking && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm space-y-1">
                  <div>
                    <strong>Current Trip:</strong> {selectedBooking.route}
                  </div>
                  <div>
                    <strong>Current Date:</strong> {format(selectedBooking.date, "PPP")}
                  </div>
                  <div>
                    <strong>Current Time:</strong> {selectedBooking.time}
                  </div>
                </div>
              </div>
            )}
            <div>
              <Label>New Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start mt-1">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newDate ? format(newDate, "PPP") : "Select new date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={newDate}
                    onSelect={setNewDate}
                    initialFocus
                    disabled={(date) => date < addDays(new Date(), 1)}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>New Time</Label>
              <Select value={newTime} onValueChange={setNewTime}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select new time" />
                </SelectTrigger>
                <SelectContent>
                  {["07:00", "15:00", "08:00", "17:00"].map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowRescheduleDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={confirmReschedule}
                disabled={!newDate || !newTime}
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
              >
                Reschedule
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
