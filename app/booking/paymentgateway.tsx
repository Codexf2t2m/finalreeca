import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import debounce from 'lodash.debounce';

interface BookingData {
  tripId: string;
  totalPrice: number;
  selectedSeats: string[];
  passengers: {
    firstName: string;
    lastName: string;
    seatNumber: string;
    title: string;
    isReturn: boolean; // <-- Add this line
  }[];
  userName: string;
  userEmail: string;
  userPhone: string;
  boardingPoint: string;
  droppingPoint: string;
  orderId: string;
  contactDetails: any;
  emergencyContact: any;
  paymentMode: string;
  returnTripId?: string;
  returnBoardingPoint?: string;
  returnDroppingPoint?: string;
  discountAmount?: number;
}

interface PaymentGatewayProps {
  bookingData: BookingData;
  onPaymentComplete: () => void;
  setShowPayment: (show: boolean) => void;
}

export default function PaymentGateway({
  bookingData,
  onPaymentComplete,
  setShowPayment,
}: PaymentGatewayProps) {
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState('');
  const isProcessingRef = useRef(false);

  const createSession = async (paymentData: BookingData) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    try {
      // Prepare Stripe request with all booking data
      const requestData = {
        ...paymentData,
      };

      // Call Stripe session API
      const response = await fetch('/api/create-stripe-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });
      const data = await response.json();
      console.log('Stripe payment API response:', data);
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Failed to create Stripe session. Please try again.');
        setIsProcessing(false);
      }
    } catch (err) {
      setError('An unexpected error occurred during payment processing');
      setIsProcessing(false);
      console.error('Payment initiation failed:', err);
    } finally {
      isProcessingRef.current = false;
    }
  };

  const debouncedCreateSession = useCallback(
    debounce(createSession, 1000),
    []
  );

  useEffect(() => {
    console.log('Booking data passengers:', bookingData.passengers);
    console.log('Departure passengers:', bookingData.passengers.filter(p => !p.isReturn));
    console.log('Return passengers:', bookingData.passengers.filter(p => p.isReturn));
    debouncedCreateSession(bookingData);
  }, [bookingData, debouncedCreateSession]);

  return (
    <div className="max-w-6xl mx-auto my-8 px-4">
      <div className="p-6 max-w-md mx-auto bg-white rounded-lg">
        {isProcessing ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-12 h-12 text-teal-600 animate-spin mb-4" />
            <p className="text-lg font-medium text-gray-800">
              Redirecting to payment gateway...
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Please wait while we connect to our secure payment processor
            </p>
          </div>
        ) : error ? (
          <div className="text-center py-6">
            <div className="text-red-500 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-xl font-bold mt-2">Payment Failed</h3>
            </div>
            <p className="text-gray-700 mb-2">{error}</p>
            <p className="text-sm text-gray-600 mb-6">
              Please try again or contact support if the problem persists
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setShowPayment(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Go Back
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}