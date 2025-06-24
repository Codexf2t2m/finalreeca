'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handlePaymentSuccess = async () => {
      try {
        // Get transaction details from URL
        const reference = searchParams.get('CompanyRef');
        const transactionId = searchParams.get('TransID');

        if (!reference) {
          throw new Error('Missing transaction reference');
        }

        // Get stored booking details
        const pendingBooking = localStorage.getItem('pendingBooking');
        if (!pendingBooking) {
          throw new Error('No pending booking found');
        }

        const bookingDetails = JSON.parse(pendingBooking);

        // Verify the payment was successful
        if (bookingDetails.orderRef !== reference) {
          throw new Error('Transaction reference mismatch');
        }

        // Clear pending booking
        localStorage.removeItem('pendingBooking');

        // Redirect to ticket page or confirmation
        router.push(`/booking/confirmation/${reference}`);

      } catch (error) {
        console.error('Payment verification failed:', error);
        router.push('/booking/failed');
      }
    };

    handlePaymentSuccess();
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Processing Payment</h1>
        <p className="text-gray-600">Please wait while we confirm your booking...</p>
      </div>
    </div>
  );
}