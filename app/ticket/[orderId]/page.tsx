'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Loader2 } from 'lucide-react';
import { TicketContainer } from '@/components/TicketContainer';

const TicketPage = () => {
  const router = useRouter();
  const { orderId } = router.query;
  const [bookingData, setBookingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
        <Loader2 className="w-12 h-12 text-teal-600 animate-spin" />
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
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      {bookingData && (
        <div className="max-w-5xl mx-auto px-4">
          <TicketContainer bookingData={bookingData} />
        </div>
      )}
    </div>
  );
};

export default TicketPage;