import React from "react";

interface BookingData {
  id: string;
  bookingRef: string;
  passengerName: string;
  email: string;
  phone: string;
  passengers: number;
  route: string;
  date: Date | string; // Allow both Date and string types
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
}

interface PrintableTicketProps {
  bookingData: BookingData;
}

export const PrintableTicket: React.FC<PrintableTicketProps> = ({ bookingData }) => {
  // Helper function to ensure we have a Date object
  const ensureDate = (dateInput: Date | string): Date => {
    if (dateInput instanceof Date) {
      return dateInput;
    }
    return new Date(dateInput);
  };

  // Format date function
  const formatDate = (date: Date | string, formatStr: string) => {
    const dateObj = ensureDate(date);
    const options: Intl.DateTimeFormatOptions = {};
    
    if (formatStr.includes('EEEE')) {
      options.weekday = 'long';
    }
    if (formatStr.includes('MMMM')) {
      options.month = 'long';
    } else if (formatStr.includes('MMM')) {
      options.month = 'short';
    }
    if (formatStr.includes('dd')) {
      options.day = '2-digit';
    }
    if (formatStr.includes('yyyy')) {
      options.year = 'numeric';
    }
    
    return dateObj.toLocaleDateString('en-US', options);
  };

  // Generate QR code data
  const bookingDate = ensureDate(bookingData.date);
  const qrData = {
    ref: bookingData.bookingRef,
    name: bookingData.passengerName,
    route: bookingData.route,
    date: bookingDate.toISOString().split('T')[0],
    time: bookingData.time,
    seats: bookingData.seats.join(','),
    amount: bookingData.totalAmount
  };
  
  const qrString = JSON.stringify(qrData);
  
  // Generate QR code URL (using a free QR code service)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrString)}`;

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 font-sans" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
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
        </div>
      </div>

      {/* Company Details */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
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
        
        <div>
          <h3 className="font-bold text-gray-800 mb-2">Passenger Details</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p className="font-semibold text-gray-800">{bookingData.passengerName}</p>
            <p>{bookingData.email}</p>
            <p>{bookingData.phone}</p>
            <p>Passengers: {bookingData.passengers}</p>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Date:</span>
              <span className="font-semibold">{formatDate(new Date(), "dd MMM yyyy")}</span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span>Booking Date:</span>
              <span className="font-semibold">{formatDate(bookingData.date, "dd MMM yyyy")}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Status:</span>
              <span className="font-semibold text-green-600">{bookingData.bookingStatus}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Journey Details Table */}
      <div className="mb-8">
        <div className="bg-gray-100 p-2 mb-4">
          <h3 className="font-bold text-gray-800">Journey Details</h3>
        </div>
        
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-300 p-3 text-left font-semibold">Description</th>
              <th className="border border-gray-300 p-3 text-center font-semibold">Details</th>
              <th className="border border-gray-300 p-3 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 p-3">
                <div className="font-semibold text-gray-800">BUS TICKET - {bookingData.route}</div>
                <div className="text-sm text-gray-600 mt-1">
                  <p><strong>Date:</strong> {formatDate(bookingData.date, "EEEE, MMMM dd, yyyy")}</p>
                  <p><strong>Time:</strong> {bookingData.time}</p>
                  <p><strong>Bus:</strong> {bookingData.bus}</p>
                  <p><strong>Boarding:</strong> {bookingData.boardingPoint}</p>
                  <p><strong>Dropping:</strong> {bookingData.droppingPoint}</p>
                  <p><strong>Seats:</strong> {bookingData.seats.join(', ')}</p>
                </div>
              </td>
              <td className="border border-gray-300 p-3 text-center">
                <div className="font-semibold">{bookingData.passengers}</div>
                <div className="text-sm text-gray-600">Passenger(s)</div>
              </td>
              <td className="border border-gray-300 p-3 text-right font-semibold">
                P {bookingData.totalAmount.toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mt-4">
          <div className="w-64">
            <div className="flex justify-between py-2 border-b">
              <span>Sub Total:</span>
              <span className="font-semibold">P {bookingData.totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2 text-lg font-bold">
              <span>Total:</span>
              <span>P {bookingData.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Information */}
      <div className="mb-8">
        <div className="bg-gray-100 p-2 mb-2">
          <h3 className="font-bold text-gray-800">Payment Information</h3>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p><strong>Payment Method:</strong> {bookingData.paymentMethod}</p>
            <p><strong>Payment Status:</strong> <span className={`font-semibold ${bookingData.paymentStatus === 'Paid' ? 'text-green-600' : 'text-red-600'}`}>{bookingData.paymentStatus}</span></p>
          </div>
          <div>
            <p><strong>Booking Status:</strong> <span className="font-semibold text-green-600">{bookingData.bookingStatus}</span></p>
          </div>
        </div>
      </div>

      {/* Special Requests */}
      {bookingData.specialRequests && (
        <div className="mb-8">
          <div className="bg-gray-100 p-2 mb-2">
            <h3 className="font-bold text-gray-800">Special Requests</h3>
          </div>
          <p className="text-sm text-gray-700">{bookingData.specialRequests}</p>
        </div>
      )}

      {/* QR Code and Terms */}
      <div className="grid grid-cols-2 gap-8">
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
              Ticket is valid only for the specified date, time, and route. 
              Changes subject to availability and additional charges may apply.
            </p>
          </div>
        </div>
        
        <div className="text-center">
          <div className="bg-gray-100 p-2 mb-4">
            <h3 className="font-bold text-gray-800">Booking QR Code</h3>
          </div>
          <div className="flex justify-center mb-4">
            <div className="border-2 border-gray-300 p-4 rounded-lg bg-white">
              <img 
                src={qrCodeUrl} 
                alt="Booking QR Code" 
                className="w-32 h-32"
                onError={(e) => {
                  // Fallback to a placeholder if QR service fails
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="hidden w-32 h-32 bg-gray-200 flex items-center justify-center rounded">
                <div className="text-center">
                  <div className="text-4xl mb-2">📱</div>
                  <div className="text-xs">QR Code</div>
                </div>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-600">
            Scan this QR code for quick verification
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-600">
        <p>Thank you for choosing REECA TRAVEL for your journey!</p>
        <p>For support, contact us at +26773061124 or aging@reecatravel.co.bw</p>
      </div>

      {/* Print Button */}
      <div className="mt-8 text-center no-print">
        <button
          onClick={() => window.print()}
          className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-6 rounded-lg"
        >
          Print Ticket
        </button>
      </div>

      <style jsx>{`
        @media print {
          .no-print {
            display: none !important;
          }
          
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          
          .bg-gray-100 {
            background-color: #f3f4f6 !important;
          }
          
          .bg-gray-50 {
            background-color: #f9fafb !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PrintableTicket;