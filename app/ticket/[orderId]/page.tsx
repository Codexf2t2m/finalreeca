'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { PrintableTicket } from '@/components/printable-ticket';

const TicketPage = () => {
  const router = useRouter();
  const params = useParams();
  const orderId = params.orderId as string;
  const [bookingData, setBookingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tripType, setTripType] = useState<'departure' | 'return'>('departure');

  useEffect(() => {
    if (!orderId) return;

    const fetchBookingData = async () => {
      try {
        const response = await fetch(`/api/booking/${orderId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch booking data');
        }
        
        const data = await response.json();
        setBookingData(data);
      } catch (err) {
        setError(
          err && typeof err === 'object' && 'message' in err
            ? (err as { message: string }).message
            : 'Error loading ticket'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchBookingData();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-gray-700">{error}</p>
          <button 
            className="mt-4 px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
            onClick={() => router.push('/')}
          >
            Return Home
          </button>
          <div className="mt-8">
            <p className="text-gray-700 mb-2">If you can't view your ticket, you can still print this page as a receipt for your payment.</p>
            <button
              className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900"
              onClick={() => window.print()}
            >
              Print This Page
            </button>
            <div className="mt-4 text-xs text-gray-500">
              Show this printout and your payment confirmation email to the bus staff for assistance.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      {bookingData && (
        <div className="max-w-5xl mx-auto px-4">
          <button
            className="mb-4 px-4 py-2 bg-teal-700 text-white rounded hover:bg-teal-800 print:hidden"
            onClick={() => window.print()}
          >
            Download Ticket (PDF)
          </button>
          {bookingData.returnTrip ? (
            <div className="mb-6 flex gap-4">
              <button
                className={`px-4 py-2 rounded font-semibold ${tripType === 'departure' ? 'bg-teal-600 text-white' : 'bg-gray-200 text-gray-800'}`}
                onClick={() => setTripType('departure')}
              >
                Departure Ticket
              </button>
              <button
                className={`px-4 py-2 rounded font-semibold ${tripType === 'return' ? 'bg-teal-600 text-white' : 'bg-gray-200 text-gray-800'}`}
                onClick={() => setTripType('return')}
              >
                Return Ticket
              </button>
            </div>
          ) : null}
          <PrintableTicket bookingData={bookingData} tripType={tripType} />
        </div>
      )}
    </div>
  );
};

export default TicketPage;