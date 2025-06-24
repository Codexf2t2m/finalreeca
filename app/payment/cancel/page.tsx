// src/app/payment/cancel/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PaymentCancelPage() {
  const router = useRouter();

  useEffect(() => {
    // Clear any pending booking data
    localStorage.removeItem('pendingBooking');
    
    // Redirect back to booking page
    router.push('/booking?status=cancelled');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Payment Cancelled</h1>
        <p className="text-gray-600">Redirecting back to booking...</p>
      </div>
    </div>
  );
}