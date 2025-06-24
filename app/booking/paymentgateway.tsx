import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { PolicyModal } from "@/components/PolicyModal";

interface PaymentGatewayProps {
  bookingData: {
    totalPrice: number;
    selectedSeats: string[];
    userName: string;
    userEmail: string;
    boardingPoint: string;
    droppingPoint: string;
    orderId: string;
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
      alert("Please agree to the travel policies first");
      return;
    }

    setIsProcessing(true);

    try {
      // Stripe payment request
      const response = await fetch('/api/create-stripe-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          totalPrice: bookingData.totalPrice,
          userEmail: bookingData.userEmail,
          orderId: bookingData.orderId,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Payment initialization failed');
      }

      // Store booking details if needed
      localStorage.setItem('pendingBooking', JSON.stringify({
        ...bookingData,
        orderRef: bookingData.orderId,
        timestamp: new Date().toISOString()
      }));

      // Redirect to Stripe Checkout
      window.location.href = data.sessionUrl;

    } catch (error) {
      console.error('Payment error:', error);
      alert(error instanceof Error ? error.message : "Payment initialization failed");
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
            <span>{bookingData.selectedSeats.join(", ")}</span>
          </div>
        </div>
      </div>

      <Button
        onClick={() => setShowPolicies(true)}
        variant="outline"
        className="w-full"
      >
        View Travel Policies
      </Button>

      <PolicyModal
        isOpen={showPolicies}
        onClose={() => setShowPolicies(false)}
        onAgree={handleProceedToPayment}
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