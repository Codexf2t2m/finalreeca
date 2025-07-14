import React from 'react';
import { PrintableTicket } from './printable-ticket';

// Use the same BookingData interface from printable-ticket
interface BookingData {
  bookingRef: string;
  userName: string;
  userEmail: string;
  userPhone: string | null;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  bookingStatus: string;
  departureTrip: {
    route: string;
    date: string | Date;
    time: string;
    bus: string;
    boardingPoint: string;
    droppingPoint: string;
    seats: string[];
    passengers: {
      name: string;
      seat: string;
      title?: string;
    }[];
  };
  returnTrip?: {
    route: string;
    date: string | Date;
    time: string;
    bus: string;
    boardingPoint: string;
    droppingPoint: string;
    seats: string[];
    passengers: {
      name: string;
      seat: string;
      title?: string;
    }[];
  };
}

interface TicketContainerProps {
  bookingData: BookingData;
}

export const TicketContainer: React.FC<TicketContainerProps> = ({ bookingData }) => {
  return (
    <div className="print-container">
      <PrintableTicket 
        bookingData={bookingData} // Remove tripType
      />
      
      {bookingData.returnTrip && (
        <div className="mt-12">
          <PrintableTicket 
            bookingData={{
              ...bookingData,
              departureTrip: bookingData.returnTrip,
              returnTrip: undefined
            }} // Show only return trip if needed
          />
        </div>
      )}
      
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