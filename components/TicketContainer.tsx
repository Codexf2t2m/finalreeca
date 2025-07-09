import React from 'react';
import { PrintableTicket } from './printable-ticket';


interface BookingData {
  bookingRef: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  bookingStatus: string;
  passengerList: { name: string; seat: string }[];
  departureTrip: {
    route: string;
    date: string | Date;
    time: string;
    bus: string;
    boardingPoint: string;
    droppingPoint: string;
    seats: string[];
  };
  returnTrip?: {
    route: string;
    date: string | Date;
    time: string;
    bus: string;
    boardingPoint: string;
    droppingPoint: string;
    seats: string[];
  };
}

interface TicketContainerProps {
  bookingData: BookingData;
}

export const TicketContainer: React.FC<TicketContainerProps> = ({ bookingData }) => {
  return (
    <div className="print-container">
      {/* Departure Ticket */}
      <PrintableTicket 
        bookingData={bookingData} 
        tripType="departure" 
      />
      
      {/* Return Ticket (if exists) */}
      {bookingData.returnTrip && (
        <div className="mt-12">
          <PrintableTicket 
            bookingData={bookingData} 
            tripType="return" 
          />
        </div>
      )}
      
      {/* Print Button */}
      <div className="mt-8 text-center no-print">
        <button
          onClick={() => window.print()}
          className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-6 rounded-lg"
        >
          Print Ticket(s)
        </button>
      </div>

      <style jsx>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-container > div {
            page-break-after: always;
          }
          .mt-12 {
            margin-top: 0;
          }
        }
      `}</style>
    </div>
  );
};