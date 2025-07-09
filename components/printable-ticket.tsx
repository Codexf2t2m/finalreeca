import React from "react";

interface Passenger {
  name: string;
  seat: string;
  title?: string;
}

interface TripData {
  route: string;
  date: string | Date;
  time: string;
  bus: string;
  boardingPoint: string;
  droppingPoint: string;
  seats: string[];
  passengers?: Passenger[];
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
  passengerList: Passenger[];
  departureTrip: TripData;
  returnTrip?: TripData;
}

interface PrintableTicketProps {
  bookingData: BookingData;
  tripType: "departure" | "return";
}

export const PrintableTicket: React.FC<PrintableTicketProps> = ({
  bookingData,
  tripType,
}) => {
  const formatDate = (dateInput: Date | string, formatStr: string) => {
    const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return "Invalid date";

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

  const trip = tripType === "departure" ? bookingData.departureTrip : bookingData.returnTrip;
  if (!trip) return null;

  const sortedSeats = [...trip.seats].sort((a, b) => {
    const rowA = parseInt(a.match(/\d+/)?.[0] || "0");
    const rowB = parseInt(b.match(/\d+/)?.[0] || "0");
    if (rowA !== rowB) return rowA - rowB;
    return a.localeCompare(b);
  });

  // Get passengers for this trip
  let tripPassengers: Passenger[] = trip.passengers || [];
  
  // If no passengers in trip data, use passengerList
  if (tripPassengers.length === 0) {
    tripPassengers = bookingData.passengerList
      .filter(p => trip.seats.includes(p.seat))
      .sort((a, b) => sortedSeats.indexOf(a.seat) - sortedSeats.indexOf(b.seat));
  }

  const qrData = {
    ref: bookingData.bookingRef,
    name: bookingData.userName,
    route: trip.route,
    date: trip.date instanceof Date ? trip.date.toISOString() : trip.date,
    time: trip.time,
    seats: sortedSeats.join(","),
    passengers: tripPassengers.map(p => ({ name: p.name, seat: p.seat })),
    amount: bookingData.totalAmount,
    tripType,
  };

  const qrString = JSON.stringify(qrData);
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
    qrString
  )}`;

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 font-sans mb-8">
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center">
          <div className="flex gap-1 mr-4">
            <div className="w-8 h-8 bg-teal-500 rounded"></div>
            <div className="w-8 h-8 bg-orange-400 rounded"></div>
            <div className="w-8 h-8 bg-amber-400 rounded"></div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">REECA TRAVEL</h1>
            <p className="text-sm text-gray-600">Your Journey, Our Priority</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">BUS TICKET</h2>
          <p className="text-lg font-semibold text-teal-600">#{bookingData.bookingRef}</p>
          <p className="text-sm font-medium text-gray-700 mt-1">
            {tripType === "departure" ? "DEPARTURE" : "RETURN"} TRIP
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <div className="md:col-span-1">
          <h3 className="font-bold text-gray-800 mb-2">REECA TRAVEL</h3>
          <div className="text-sm text-gray-600 space-y-1">
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
          <h3 className="font-bold text-gray-800 mb-2">
            Passenger Manifest ({tripType === "departure" ? "Departure" : "Return"})
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 rounded">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">#</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Name</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Seat</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Title</th>
                </tr>
              </thead>
              <tbody>
                {tripPassengers.length > 0 ? (
                  tripPassengers.map((passenger, idx) => (
                    <tr key={idx} className="border-t border-gray-100">
                      <td className="px-3 py-2 text-xs">{idx + 1}</td>
                      <td className="px-3 py-2 text-xs">{passenger.name}</td>
                      <td className="px-3 py-2 text-xs font-bold">{passenger.seat}</td>
                      <td className="px-3 py-2 text-xs">{passenger.title || "N/A"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-3 py-2 text-xs text-gray-500 text-center">
                      No passenger data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap gap-4 mt-4 text-xs text-gray-600">
            <span>
              Passengers: <span className="font-semibold">{tripPassengers.length}</span>
            </span>
            <span>
              Seats: <span className="font-semibold">{sortedSeats.join(", ")}</span>
            </span>
            <span>
              Status:{" "}
              <span className="font-semibold text-green-600">{bookingData.bookingStatus}</span>
            </span>
            <span>
              Date Issued:{" "}
              <span className="font-semibold">{formatDate(new Date(), "dd MMM yyyy")}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <div className="bg-gray-100 p-2 mb-4">
          <h3 className="font-bold text-gray-800">Journey Details</h3>
        </div>
        <div className="border border-gray-300 rounded-lg p-4">
          <div className="font-semibold text-gray-800 text-lg mb-2">
            BUS TICKET - {trip.route}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
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
        <div className="flex justify-end mt-4">
          <div className="w-64 border-t border-gray-300 pt-2">
            <div className="flex justify-between py-1">
              <span>Total:</span>
              <span className="font-bold">P {bookingData.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <div className="bg-gray-100 p-2 mb-2">
          <h3 className="font-bold text-gray-800">Payment Information</h3>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
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

      <div className="mb-8">
        <div className="bg-gray-100 p-2 mb-2">
          <h3 className="font-bold text-gray-800">Payer Information</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <div className="bg-gray-100 p-2 mb-2">
            <h3 className="font-bold text-gray-800">Important Notes</h3>
          </div>
          <div className="text-xs text-gray-700 space-y-2">
            <p>• Please arrive at the boarding point 15 minutes before departure time</p>
            <p>• Valid ID required for boarding</p>
            <p>• No refunds for no-shows</p>
            <p>• Baggage allowance: 20kg per passenger</p>
            <p>• Present this ticket (digital or printed) at boarding</p>
          </div>
          <div className="mt-4">
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
          <div className="bg-gray-100 p-2 mb-4">
            <h3 className="font-bold text-gray-800">Booking QR Code</h3>
          </div>
          <div className="flex justify-center mb-4">
            <div className="border-2 border-gray-300 p-4 rounded-lg bg-white">
              <img src={qrCodeUrl} alt="Booking QR Code" className="w-32 h-32" />
            </div>
          </div>
          <p className="text-xs text-gray-600">Scan this QR code for quick verification</p>
        </div>
      </div>

      <div className="mt-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-600">
        <p>Thank you for choosing REECA TRAVEL for your journey!</p>
        <p>For support, contact us at +26773061124 or admin@reecatravel.co.bw</p>
      </div>
    </div>
  );
};