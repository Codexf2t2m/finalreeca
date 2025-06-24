import { NextResponse } from 'next/server';

// Constants
const DPO_COMPANY_TOKEN = "8D3DA73D-9D7F-4E09-96D4-3D44E7A83EA3";
const DPO_SERVICE_TYPE = "3854";
const BASE_URL = "https://secure.3gdirectpay.com";

// Types
interface PaymentRequest {
  amount: number;
  orderId: string;
  customerEmail?: string;
  customerName?: string;
}

// Logging helper
const logPaymentDetails = (details: PaymentRequest) => {
  console.log('--- Starting DPO Payment Process ---');
  console.log('--- Request Details ---');
  console.log(`Amount: ${details.amount}`);
  console.log(`Order ID: ${details.orderId}`);
  console.log(`Customer Email: ${details.customerEmail}`);
  console.log(`Customer Name: ${details.customerName}`);
  console.log('------------------------');
};

export async function POST(request: Request) {
  try {
    const body = await request.json() as PaymentRequest;
    
    // Log request details
    logPaymentDetails(body);

    // Format amount to 2 decimal places
    const formattedAmount = Number(body.amount).toFixed(2);

    // Build payment URL parameters
    const params = new URLSearchParams({
      ID: DPO_COMPANY_TOKEN,
      ServiceType: DPO_SERVICE_TYPE,
      CompanyRef: body.orderId,
      CompanyRefUnique: "1",
      Amount: formattedAmount,
      Currency: "BWP",
      RedirectURL: "http://localhost:3000/payment/success",
      BackURL: "http://localhost:3000/payment/cancel",
      customerEmail: body.customerEmail || '',
      customerFirstName: body.customerName || ''
    });

    const paymentUrl = `${BASE_URL}/pay.asp?${params.toString()}`;

    // Log the generated URL
    console.log('--- Generated Payment URL ---');
    console.log(paymentUrl);
    console.log('------------------------');

    return NextResponse.json({
      success: true,
      orderRef: body.orderId,
      paymentUrl
    });

  } catch (error) {
    console.error('DPO Transaction Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Payment initialization failed' 
      },
      { status: 500 }
    );
  }
}
