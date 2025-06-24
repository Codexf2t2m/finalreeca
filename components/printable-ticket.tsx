// components/printable-ticket.tsx
"use client"
import { format } from "date-fns";
import { QrCode } from "lucide-react";

export function PrintableTicket({ bookingData }: { bookingData: any }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-teal-900">Reeca Travel</h2>
          <p className="text-sm text-gray-600">Bus Management System</p>
        </div>
        <div className="text-right">
          <h3 className="text-xl font-semibold text-amber-600">Bus Ticket</h3>
          <p className="text-sm text-gray-600">Booking Ref: {bookingData.bookingRef}</p>
        </div>
      </div>

      <div className="border-t border-b border-gray-200 py-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h4 className="font-semibold text-gray-800">Passenger Information</h4>
            <p className="text-sm text-gray-600">{bookingData.passengerName}</p>
            <p className="text-sm text-gray-600">{bookingData.email}</p>
            <p className="text-sm text-gray-600">{bookingData.phone}</p>
          </div>
          <div className="text-right">
            <h4 className="font-semibold text-gray-800">Journey Details</h4>
            <p className="text-sm text-gray-600">{bookingData.route}</p>
            <p className="text-sm text-gray-600">{format(bookingData.date, "MMM dd, yyyy")}</p>
            <p className="text-sm text-gray-600">{bookingData.time}</p>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div>
            <h4 className="font-semibold text-gray-800">Boarding Point</h4>
            <p className="text-sm text-gray-600">{bookingData.boardingPoint}</p>
          </div>
          <div className="text-right">
            <h4 className="font-semibold text-gray-800">Dropping Point</h4>
            <p className="text-sm text-gray-600">{bookingData.droppingPoint}</p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h4 className="font-semibold text-gray-800 mb-2">Seat Information</h4>
        <div className="flex flex-wrap gap-2">
          {bookingData.seats.map((seat: string) => (
            <div key={seat} className="bg-amber-600 text-white text-xs px-2 py-1 rounded">
              {seat}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h4 className="font-semibold text-gray-800">Bus Information</h4>
          <p className="text-sm text-gray-600">{bookingData.bus}</p>
        </div>
        <div className="text-right">
          <h4 className="font-semibold text-gray-800">Total Amount</h4>
          <p className="text-lg font-bold text-teal-600">P {bookingData.totalAmount}</p>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4">
        <div className="flex justify-center mb-4">
          <div className="bg-gray-200 p-4 rounded">
            <QrCode className="h-24 w-24 text-gray-800" />
          </div>
        </div>
        <p className="text-xs text-gray-600 text-center">
          Present this ticket along with a valid ID at the time of boarding.
        </p>
      </div>
    </div>
  );
}
