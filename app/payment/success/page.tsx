import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { Suspense } from 'react';

// Loading component
function PaymentSuccessLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Verifying your payment...</p>
      </div>
    </div>
  );
}

// Main content component that handles the async operation
async function PaymentSuccessContent({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  
  // Get Stripe session_id from query
  const sessionId = Array.isArray(params.session_id)
    ? params.session_id[0]
    : params.session_id || '';
  
  let orderId = '';
  let paymentStatus = '';
  let bookingData = null;
  let verificationError = null;

  // Fetch orderId from backend using session_id
  if (sessionId) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/verify-payment?session_id=${sessionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store' // Ensure fresh data
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          orderId = data.orderId || '';
          paymentStatus = data.paymentStatus || '';
          bookingData = data.booking || null;
        } else {
          verificationError = data.error || 'Payment verification failed';
        }
      } else {
        verificationError = 'Failed to verify payment';
      }
    } catch (e) {
      console.error('Payment verification error:', e);
      verificationError = 'Network error during payment verification';
    }
  } else {
    verificationError = 'No session ID provided';
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
          Payment Successful!
        </h2>
        
        <div className="mt-6">
          <p className="text-lg text-gray-600">
            Your payment was successful. Your booking is confirmed.
          </p>
          
          {/* Show verification error if any */}
          {verificationError && (
            <div className="mt-4 bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <p className="text-yellow-700 text-sm">
                {verificationError}
              </p>
              <p className="text-yellow-600 text-xs mt-1">
                Your payment was successful, but there was an issue retrieving your booking details. Please contact support if needed.
              </p>
            </div>
          )}
          
          {/* Show booking details if available */}
          {bookingData && (
            <div className="mt-4 bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="text-blue-700 text-sm">
                <strong>Order ID:</strong> {orderId}
              </p>
              <p className="text-blue-700 text-sm">
                <strong>Payment Status:</strong> {paymentStatus}
              </p>
            </div>
          )}
          
          <div className="mt-8 bg-green-50 rounded-lg p-4 border border-green-200">
            <p className="text-green-700">
              We've sent a confirmation email with your booking details. 
              Please check your inbox.
            </p>
          </div>
        </div>
        
        <div className="mt-8">
          {orderId && paymentStatus === 'paid' ? (
            <>
              <div className="mb-4 text-base text-teal-700 font-semibold">
                You can now view and print your ticket(s). If you booked a return trip, you can print both departure and return tickets on the next page.
              </div>
              <Button
                asChild
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-4 rounded-lg shadow-md text-lg"
              >
                <Link href={`/ticket/${orderId}`}>
                  View & Print Ticket(s)
                </Link>
              </Button>
            </>
          ) : orderId ? (
            <div className="mb-4 text-base text-orange-700 font-semibold">
              Payment status: {paymentStatus}. Please contact support if you need assistance.
            </div>
          ) : (
            <div className="mb-4 text-base text-gray-700">
              Unable to retrieve booking details at this time. Please check your email for confirmation or contact support.
            </div>
          )}
          
          <Button
            asChild
            variant="outline"
            className="w-full mt-3 bg-white text-gray-700 font-semibold py-3 px-4 rounded-lg border border-gray-300 shadow-sm"
          >
            <Link href="/">
              Back to Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

// Main page component with Suspense
export default function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <Suspense fallback={<PaymentSuccessLoading />}>
      <PaymentSuccessContent searchParams={searchParams} />
    </Suspense>
  );
}