// File: components/PaymentGateway.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';
import { PolicyModal } from '@/components/PolicyModal';

interface PaymentGatewayProps {
  bookingData: {
    totalPrice: number;
    selectedSeats: string[];
    userName: string;
    userEmail: string;
    boardingPoint: string;
    droppingPoint: string;
    orderId: string;
    tripId: string;
  };
  onPaymentComplete: () => void;
  setShowPayment?: (show: boolean) => void;
}

export default function PaymentGateway({
  bookingData,
  onPaymentComplete,
  setShowPayment,
}: PaymentGatewayProps) {
  const [agreed, setAgreed] = useState(false);
  const [showPolicies, setShowPolicies] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleProceedToPayment = async () => {
    if (!agreed) {
      alert('Please agree to the travel policies first');
      return;
    }
    setIsProcessing(true);

    try {
      const payload = {
        tripId: bookingData.tripId,
        orderId: bookingData.orderId,
        totalPrice: bookingData.totalPrice,
        userName: bookingData.userName,
        userEmail: bookingData.userEmail,
        boardingPoint: bookingData.boardingPoint,
        droppingPoint: bookingData.droppingPoint,
        selectedSeats: bookingData.selectedSeats,
      };
      console.log('[PAYMENT:FETCH BODY]', payload);

      const res = await fetch('/api/create-dpo-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      console.log('[PAYMENT RESPONSE]', data);

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Payment init failed');
      }

      // store pending booking and redirect
      localStorage.setItem(
        'pendingBooking',
        JSON.stringify({
          ...bookingData,
          orderRef: data.orderRef,
          timestamp: new Date().toISOString(),
        })
      );
      window.location.href = data.paymentUrl;
    } catch (err) {
      console.error('[PAYMENT] Error:', err);
      alert(
        err instanceof Error
          ? err.message
          : 'Payment initialization failed'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-gray-50 rounded-lg border">
        <h4 className="font-semibold mb-3">Booking Summary</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Total Amount:</span>
            <span className="font-bold">P {bookingData.totalPrice}</span>
          </div>
          <div className="flex justify-between">
            <span>Selected Seats:</span>
            <span>{bookingData.selectedSeats.join(', ')}</span>
          </div>
          <div className="flex justify-between">
            <span>Boarding Point:</span>
            <span>{bookingData.boardingPoint}</span>
          </div>
          <div className="flex justify-between">
            <span>Dropping Point:</span>
            <span>{bookingData.droppingPoint}</span>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Trip ID: {bookingData.tripId}
          </div>
        </div>
      </div>

      <Button
        variant="outline"
        onClick={() => setShowPolicies?.(true)}
        className="w-full"
      >
        View Travel Policies
      </Button>
      <PolicyModal
        isOpen={showPolicies}
        onClose={() => setShowPolicies(false)}
        onAgree={() => setAgreed(true)}
        agreed={agreed}
        setAgreed={setAgreed}
      />

      <Button
        onClick={handleProceedToPayment}
        disabled={!agreed || isProcessing}
        className="w-full"
      >
        <Shield className="w-4 h-4 mr-2" />
        {isProcessing ? 'Processing...' : 'Pay Securely'}
      </Button>
    </div>
  );
}
