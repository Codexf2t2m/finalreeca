import { verifyToken } from '@/lib/dpoService';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const ref = Array.isArray(searchParams.ref) 
    ? searchParams.ref[0] 
    : searchParams.ref || '';

  // Verify payment
  let isVerified = false;
  if (ref) {
    try {
      const result = await verifyToken(ref);
      isVerified = result.success && result.status === '000';
    } catch (error) {
      console.error('Payment verification failed:', error);
    }
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
          {isVerified ? (
            <p className="text-lg text-gray-600">
              Your booking <span className="font-medium text-teal-600">{ref}</span> has been confirmed.
            </p>
          ) : (
            <p className="text-lg text-gray-600">
              Your payment was successful. We're processing your booking details.
            </p>
          )}
          
          <div className="mt-8 bg-green-50 rounded-lg p-4 border border-green-200">
            <p className="text-green-700">
              We've sent a confirmation email with your booking details. 
              Please check your inbox.
            </p>
          </div>
        </div>
        
        <div className="mt-8">
          <Button
            asChild
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-4 rounded-lg shadow-md"
          >
            <Link href="/bookings">
              View My Bookings
            </Link>
          </Button>
          
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