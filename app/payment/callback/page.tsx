// src/app/payment/callback/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PaymentCallback() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [message, setMessage] = useState('');
  const [transactionDetails, setTransactionDetails] = useState<any>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Get transaction token from URL parameters
        const transactionToken = searchParams.get('TransactionToken');
        const companyRef = searchParams.get('CompanyRef');

        if (!transactionToken && !companyRef) {
          setStatus('failed');
          setMessage('No transaction information found');
          return;
        }

        // Call your API to verify the payment
        const response = await fetch('/api/payment/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            transactionToken: transactionToken || undefined,
            companyRef: companyRef || undefined,
          }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setStatus('success');
          setMessage('Payment completed successfully!');
          setTransactionDetails(data.transactionDetails);
          
          // Clear pending booking
          localStorage.removeItem('pendingBooking');
        } else {
          setStatus('failed');
          setMessage(data.message || 'Payment verification failed');
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        setStatus('failed');
        setMessage('Failed to verify payment');
      }
    };

    verifyPayment();
  }, [searchParams]);

  const handleContinue: () => void = () => {
    if (status === 'success') {
      router.push('/bookings'); // Redirect to bookings page
    } else {
      router.push('/'); // Redirect to home page
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-teal-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Verifying Payment</h2>
          <p className="text-gray-600">Please wait while we confirm your payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
        {status === 'success' ? (
          <>
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-800 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            
            {transactionDetails && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-semibold mb-2">Transaction Details</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span>P {transactionDetails.amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Reference:</span>
                    <span>{transactionDetails.reference}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date:</span>
                    <span>{new Date().toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <XCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-800 mb-2">Payment Failed</h2>
            <p className="text-gray-600 mb-6">{message}</p>
          </>
        )}

        <Button 
          onClick={handleContinue}
          className={`w-full ${status === 'success' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
        >
          {status === 'success' ? 'View My Bookings' : 'Try Again'}
        </Button>
      </div>
    </div>
  );
}