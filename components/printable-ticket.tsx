import React from "react";

interface Passenger {
  name: string;
  seat: string;
  title?: string;
  isReturn?: boolean;
}

interface TripData {
  route: string;
  date: string | Date;
  time: string;
  bus: string;
  boardingPoint: string;
  droppingPoint: string;
  seats: string[];
  passengers: Passenger[];
}

interface BookingData {
  bookingRef: string;
  userName: string;
  userEmail: string;
  userPhone: string | null;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  bookingStatus: string;
  departureTrip: TripData;
  returnTrip?: TripData;
  addons?: { name: string; details?: string; price?: string }[]; // Added addons field
}

interface PrintableTicketProps {
  bookingData: BookingData;
}

// Define PrintableTripData as an alias for TripData
type PrintableTripData = TripData;

export const PrintableTicket: React.FC<PrintableTicketProps> = ({ bookingData }) => {
  const formatDate = (dateInput: Date | string | undefined, formatStr: string) => {
    if (!dateInput) return "N/A";
    const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (!(date instanceof Date) || isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString("en-US", {
      weekday: formatStr.includes("EEEE") ? "long" : undefined,
      month: formatStr.includes("MMMM")
        ? "long"
        : formatStr.includes("MMM")
        ? "short"
        : undefined,
      day: formatStr.includes("dd") ? "2-digit" : undefined,
      year: formatStr.includes("yyyy") ? "numeric" : undefined,
    });
  };

  // Helper to render trip details
  const renderTripSection = (trip: TripData, label: string) => {
    if (!trip) return null;
    const sortedPassengers = [...trip.passengers].sort((a, b) => {
      const numA = parseInt(a.seat.match(/\d+/)?.[0] || "0");
      const numB = parseInt(b.seat.match(/\d+/)?.[0] || "0");
      if (numA !== numB) return numA - numB;
      return a.seat.localeCompare(b.seat);
    });
    const sortedSeats = [...trip.seats].sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)?.[0] || "0");
      const numB = parseInt(b.match(/\d+/)?.[0] || "0");
      if (numA !== numB) return numA - numB;
      return a.localeCompare(b);
    });
    return (
      <div className="mb-8">
        <div className="bg-gray-100 p-2 mb-2">
          <h3 className="font-bold text-gray-800">{label} Trip Details</h3>
        </div>
        <div className="border border-gray-300 rounded-lg p-3 md:p-4 mb-4">
          <div className="font-semibold text-gray-800 text-base md:text-lg mb-1 md:mb-2">
            BUS TICKET - {trip.route}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 text-xs md:text-sm">
            <div>
              <p>
                <strong>Date:</strong> {formatDate(trip.date, "EEEE, MMMM dd, yyyy")}
              </p>
              <p>
                <strong>Time:</strong> {trip.time}
              </p>
              <p>
                <strong>Bus:</strong> {trip.bus}
              </p>
            </div>
            <div>
              <p>
                <strong>Boarding:</strong> {trip.boardingPoint}
              </p>
              <p>
                <strong>Dropping:</strong> {trip.droppingPoint}
              </p>
              <p>
                <strong>Seats:</strong> {sortedSeats.join(", ")}
              </p>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto mb-4">
          <table className="min-w-full border border-gray-200 rounded text-xs md:text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-2 md:px-3 py-1 md:py-2 text-left font-semibold text-gray-700">#</th>
                <th className="px-2 md:px-3 py-1 md:py-2 text-left font-semibold text-gray-700">Name</th>
                <th className="px-2 md:px-3 py-1 md:py-2 text-left font-semibold text-gray-700">Seat</th>
                <th className="px-2 md:px-3 py-1 md:py-2 text-left font-semibold text-gray-700">Title</th>
              </tr>
            </thead>
            <tbody>
              {sortedPassengers.length > 0 ? (
                sortedPassengers.map((passenger, idx) => (
                  <tr key={idx} className="border-t border-gray-100">
                    <td className="px-2 md:px-3 py-1 md:py-2">{idx + 1}</td>
                    <td className="px-2 md:px-3 py-1 md:py-2">{passenger.name}</td>
                    <td className="px-2 md:px-3 py-1 md:py-2 font-bold">{passenger.seat}</td>
                    <td className="px-2 md:px-3 py-1 md:py-2">{passenger.title || 'Mr'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-2 md:px-3 py-1 md:py-2 text-gray-500 text-center">
                    No passenger data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap gap-3 md:gap-4 mt-2 md:mt-4 text-xs md:text-sm text-gray-600">
          <span>
            Passengers: <span className="font-semibold">{sortedPassengers.length}</span>
          </span>
          <span>
            Seats: <span className="font-semibold">{sortedSeats.join(", ")}</span>
          </span>
          <span>
            Status: <span className="font-semibold text-green-600">{bookingData.bookingStatus}</span>
          </span>
          <span>
            Date Issued: <span className="font-semibold">{formatDate(new Date(), "dd MMM yyyy")}</span>
          </span>
        </div>
      </div>
    );
  };

  // QR code data includes both trips if roundtrip
  const qrData = {
    ref: bookingData.bookingRef,
    name: bookingData.userName,
    trips: [bookingData.departureTrip, bookingData.returnTrip]
      .filter((trip): trip is TripData => !!trip) // TypeScript guard for linting
      .map(trip => ({
        route: trip.route,
        date: trip.date instanceof Date ? trip.date.toISOString() : trip.date,
        time: trip.time,
        seats: trip.seats,
        passengers: trip.passengers.map(p => ({ name: p.name, seat: p.seat })),
      })),
    amount: bookingData.totalAmount,
    type: bookingData.returnTrip ? "Roundtrip" : "Departure",
  };

  const qrString = JSON.stringify(qrData);
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrString)}`;

  return (
    <div
      className="printable-ticket max-w-[700px] w-full mx-auto bg-white p-6 md:p-8 font-sans mb-8 border border-gray-200 rounded-lg shadow-lg"
      style={{ boxSizing: 'border-box' }}
    >
      <style>{`
        @media print {
          body {
            background: #fff !important;
          }
          .printable-ticket {
            box-shadow: none !important;
            border: 1px solid #e5e7eb !important;
            margin: 0 auto !important;
            max-width: 700px !important;
            width: 100% !important;
            padding: 0.5in 0.3in !important;
            page-break-after: always;
          }
          .printable-ticket * {
            color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
      <div className="flex justify-between items-start mb-6 md:mb-8">
        <div className="flex items-center">
          <div className="flex gap-1 mr-4">
            <div className="w-8 h-8 bg-teal-500 rounded"></div>
            <div className="w-8 h-8 bg-orange-400 rounded"></div>
            <div className="w-8 h-8 bg-amber-400 rounded"></div>
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800 leading-tight">REECA TRAVEL</h1>
            <p className="text-xs md:text-sm text-gray-600">Your Journey, Our Priority</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1 md:mb-2">BUS TICKET</h2>
          <p className="text-base md:text-lg font-semibold text-teal-600">#{bookingData.bookingRef}</p>
          <p className="text-xs md:text-sm font-medium text-gray-700 mt-1">
            {bookingData.returnTrip ? "ROUNDTRIP" : "DEPARTURE TRIP"}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 mb-6 md:mb-8">
        <div className="md:col-span-1">
          <h3 className="font-bold text-gray-800 mb-1 md:mb-2">REECA TRAVEL</h3>
          <div className="text-xs md:text-sm text-gray-600 space-y-1">
            <p>Company ID: REECA TRAVEL</p>
            <p>GABORONE CBD</p>
            <p>MOGOBE PLAZA</p>
            <p>GABORONE South-East</p>
            <p>Botswana</p>
            <p>+26773061124</p>
            <p>aging@reecatravel.co.bw</p>
            <p>WWW.REECATRAVEL.CO.BW</p>
          </div>
        </div>
        <div className="md:col-span-2">
          <h3 className="font-bold text-gray-800 mb-1 md:mb-2">
            Passenger Manifest
          </h3>
          <div className="flex flex-col gap-4">
            {renderTripSection(bookingData.departureTrip, "Departure")}
            {bookingData.returnTrip && renderTripSection(bookingData.returnTrip, "Return")}
          </div>
        </div>
      </div>
      <div className="mb-6 md:mb-8">
        <div className="bg-gray-100 p-2 mb-2 md:mb-4">
          <h3 className="font-bold text-gray-800">Payment Information</h3>
        </div>
        <div className="grid grid-cols-2 gap-2 md:gap-4 text-xs md:text-sm">
          <div>
            <p>
              <strong>Payment Method:</strong> {bookingData.paymentMethod}
            </p>
            <p>
              <strong>Payment Status:</strong>
              <span
                className={`font-semibold ml-1 ${
                  bookingData.paymentStatus === "paid"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {bookingData.paymentStatus}
              </span>
            </p>
          </div>
          <div>
            <p>
              <strong>Booking Status:</strong>
              <span className="font-semibold text-green-600 ml-1">
                {bookingData.bookingStatus}
              </span>
            </p>
          </div>
        </div>
      </div>
      <div className="mb-6 md:mb-8">
        <div className="bg-gray-100 p-2 mb-2">
          <h3 className="font-bold text-gray-800">Payer Information</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 text-xs md:text-sm">
          <div>
            <p>
              <strong>Name:</strong> {bookingData.userName}
            </p>
            <p>
              <strong>Email:</strong> {bookingData.userEmail}
            </p>
          </div>
          <div>
            <p>
              <strong>Phone:</strong> {bookingData.userPhone || "N/A"}
            </p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
        <div>
          <div className="bg-gray-100 p-2 mb-2">
            <h3 className="font-bold text-gray-800">Important Notes</h3>
          </div>
          <div className="text-xs text-gray-700 space-y-1 md:space-y-2">
            <p>• Please arrive at the boarding point 15 minutes before departure time</p>
            <p>• Valid ID required for boarding</p>
            <p>• No refunds for no-shows</p>
            <p>• Baggage allowance: 20kg per passenger</p>
            <p>• Present this ticket (digital or printed) at boarding</p>
          </div>
          <div className="mt-2 md:mt-4">
            <div className="bg-gray-100 p-2 mb-2">
              <h3 className="font-bold text-gray-800">Terms & Conditions</h3>
            </div>
            <p className="text-xs text-gray-700">
              Ticket is valid only for the specified date, time, and route. Changes subject to
              availability and additional charges may apply.
            </p>
          </div>
        </div>
        <div className="text-center">
          <div className="bg-gray-100 p-2 mb-2 md:mb-4">
            <h3 className="font-bold text-gray-800">Booking QR Code</h3>
          </div>
          <div className="flex justify-center mb-2 md:mb-4">
            <div className="border-2 border-gray-300 p-2 md:p-4 rounded-lg bg-white">
              <img src={qrCodeUrl} alt="Booking QR Code" className="w-24 h-24 md:w-32 md:h-32" />
            </div>
          </div>
          <p className="text-xs text-gray-600">Scan this QR code for quick verification</p>
        </div>
      </div>
      {bookingData.addons && bookingData.addons.length > 0 && (
        <div className="mb-6 md:mb-8">
          <div className="bg-gray-100 p-2 mb-2">
            <h3 className="font-bold text-gray-800">Addons</h3>
          </div>
          <ul className="list-disc pl-5 text-xs md:text-sm text-gray-700">
            {bookingData.addons.map((addon, idx) => (
              <li key={idx}>{addon.name} - {addon.details} {addon.price ? `(${addon.price})` : ""}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="mt-6 md:mt-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-600">
        <p>Thank you for choosing REECA TRAVEL for your journey!</p>
        <p>For support, contact us at +26773061124 or admin@reecatravel.co.bw</p>
      </div>
    </div>
  );
};

export type { BookingData, PrintableTripData };
