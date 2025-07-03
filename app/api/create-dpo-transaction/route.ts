// File: pages/api/create-dpo-transaction.ts
import { NextResponse } from 'next/server';
import fetch from 'node-fetch';
import { PrismaClient } from '@prisma/client';
import { encode } from 'html-entities';
import { parseStringPromise } from 'xml2js';

const prisma = new PrismaClient();
const COMPANY_TOKEN = process.env.DPO_COMPANY_TOKEN!;
const SERVICE_TYPE = process.env.DPO_SERVICE_TYPE || '3854';
const API_URL = 'https://secure.3gdirectpay.com/API/v6/';

export async function POST(request: Request) {
  try {
    const rawBody = await request.json();
    console.log('[PAYMENT:RAW BODY]', rawBody);

    const {
      tripId, orderId, totalPrice,
      userName, userEmail,
      boardingPoint, droppingPoint,
      selectedSeats
    } = rawBody;

    if (!tripId || !orderId || typeof totalPrice !== 'number' ||
        !userName || !userEmail ||
        !Array.isArray(selectedSeats) || selectedSeats.length === 0) {
      throw new Error('Missing or invalid input');
    }

    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new Error(`Trip not found: ${tripId}`);

    const booking = await prisma.booking.create({
      data: {
        tripId, userName, userEmail,
        seats: JSON.stringify(selectedSeats),
        seatCount: selectedSeats.length,
        totalPrice, boardingPoint, droppingPoint,
        orderId, paymentStatus: 'pending',
        bookingStatus: 'confirmed'
      },
    });
    console.log(`[PAYMENT] Booking created: ${booking.id}`);

    const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const redirectUrl = `${base}/payment/success?ref=${orderId}`;
    const backUrl = `${base}/payment/cancel?ref=${orderId}`;

    const servicesXML = `<Services><Service><ServiceType>${encode(SERVICE_TYPE, { level: 'xml' })}</ServiceType><ServiceDescription>Bus Fare</ServiceDescription><ServiceAmount>${totalPrice.toFixed(2)}</ServiceAmount></Service></Services>`;

    const tx = `<API3G>` +
      `<CompanyToken>${encode(COMPANY_TOKEN, { level: 'xml' })}</CompanyToken>` +
      `<Request>createToken</Request>` +
      `<Transaction>` +
        `<PaymentAmount>${totalPrice.toFixed(2)}</PaymentAmount>` +
        `<PaymentCurrency>BWP</PaymentCurrency>` +
        `<CompanyRef>${encode(orderId, { level: 'xml' })}</CompanyRef>` +
        `<CompanyRefUnique>1</CompanyRefUnique>` +
        `<customerFirstName>${encode(userName, { level: 'xml' })}</customerFirstName>` +
        `<customerEmail>${encode(userEmail, { level: 'xml' })}</customerEmail>` +
        `<RedirectURL>${encode(redirectUrl, { level: 'xml' })}</RedirectURL>` +
        `<BackURL>${encode(backUrl, { level: 'xml' })}</BackURL>` +
      `</Transaction>` +
      servicesXML +
      `</API3G>`;

    console.log('[PAYMENT] createToken request XML:', tx);

    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {'Content-Type': 'application/xml'},
      body: tx,
    });

    const xml = await res.text();
    console.log('[PAYMENT] createToken response XML:', xml);

    const parsed = await parseStringPromise(xml);
    const token = parsed?.API3G?.Response?.[0]?.Token?.[0] ||
                  parsed?.Response?.Token?.[0];
    if (!token) throw new Error('Token generation failed');

    const paymentUrl = `https://secure.3gdirectpay.com/payv3.php?ID=${token}`;
    return NextResponse.json({ success: true, orderRef: orderId, paymentUrl });

  } catch (err: any) {
    console.error('[PAYMENT] Error:', err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
