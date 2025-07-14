import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";
import nodemailer from "nodemailer";
import pdf from "html-pdf";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PrintableTicket } from "@/components/printable-ticket";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
});

export async function POST(req: Request) {
  try {
    const { bookingRef, contactIdNumber, email, addon, rescheduleDate } = await req.json();
    if (!bookingRef || !contactIdNumber || !email) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Find booking with matching bookingRef, main contact's id, and email
    const booking = await prisma.booking.findFirst({
      where: {
        orderId: bookingRef,
        userEmail: email,
        contactIdNumber: contactIdNumber,
      },
      include: { trip: true, passengers: true, returnTrip: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found or not authorized" }, { status: 403 });
    }

    // Check if departure is more than 24 hours away
    const departureDate = new Date(booking.trip.departureDate);
    const now = new Date();
    if (departureDate.getTime() - now.getTime() <= 24 * 60 * 60 * 1000) {
      return NextResponse.json({ error: "Cannot edit/reschedule within 24 hours of departure" }, { status: 403 });
    }

    // Handle reschedule
    if (rescheduleDate) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { trip: { update: { departureDate: rescheduleDate } } }
      });
    }

    // Handle addon (must pay for new addons)
    let updatedBooking = booking;
    if (addon) {
      // Calculate addon price (assume addon.price is sent from frontend)
      const addonPrice = addon.price || 0;

      // Create Stripe session for addon payment
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "bwp",
              product_data: {
                name: addon.name,
                description: addon.details || "",
              },
              unit_amount: addonPrice * 100,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/booking/manage?orderId=${bookingRef}&success=1`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/booking/manage?orderId=${bookingRef}&cancel=1`,
        customer_email: email,
        metadata: {
          orderId: bookingRef,
          addonName: addon.name,
        },
        expires_at: Math.floor(Date.now() / 1000) + (30 * 60),
      });

      // Update booking with new addon (as JSON array)
      updatedBooking = await prisma.booking.update({
        where: { id: booking.id },
        data: {
          addons: Array.isArray(booking.addons) ? [...booking.addons, addon] : [addon],
          transactionToken: session.id,
        },
        include: { trip: true, passengers: true, returnTrip: true },
      });

      // Return Stripe payment URL for frontend to redirect
      return NextResponse.json({
        paymentUrl: session.url,
        message: "Addon requires payment. Complete payment to receive updated ticket.",
      });
    }

    // After successful payment (or if no addon), send updated ticket
    // Map booking to BookingData shape for PrintableTicket
    const bookingData = {
      bookingRef: updatedBooking.orderId,
      userName: updatedBooking.userName,
      userEmail: updatedBooking.userEmail,
      userPhone: updatedBooking.userPhone,
      totalAmount: updatedBooking.totalPrice,
      paymentMethod: updatedBooking.paymentMode,
      paymentStatus: updatedBooking.paymentStatus,
      bookingStatus: updatedBooking.bookingStatus,
      departureTrip: {
        route: updatedBooking.trip.routeName,
        date: updatedBooking.trip.departureDate,
        time: updatedBooking.trip.departureTime,
        bus: updatedBooking.trip.serviceType,
        boardingPoint: updatedBooking.boardingPoint || "Not specified",
        droppingPoint: updatedBooking.droppingPoint || "Not specified",
        seats: JSON.parse(updatedBooking.seats),
        passengers: updatedBooking.passengers
          .filter(p => !p.isReturn)
          .map(p => ({
            name: `${p.firstName} ${p.lastName}`,
            seat: p.seatNumber,
            title: p.title,
            isReturn: p.isReturn,
          })),
      },
      returnTrip: updatedBooking.returnTrip
        ? {
            route: updatedBooking.returnTrip.routeName,
            date: updatedBooking.returnTrip.departureDate,
            time: updatedBooking.returnTrip.departureTime,
            bus: updatedBooking.returnTrip.serviceType,
            boardingPoint: updatedBooking.returnBoardingPoint || "Not specified",
            droppingPoint: updatedBooking.returnDroppingPoint || "Not specified",
            seats: updatedBooking.returnSeats ? JSON.parse(updatedBooking.returnSeats) : [],
            passengers: updatedBooking.passengers
              .filter(p => p.isReturn)
              .map(p => ({
                name: `${p.firstName} ${p.lastName}`,
                seat: p.seatNumber,
                title: p.title,
                isReturn: p.isReturn,
              })),
          }
        : undefined,
      addons: Array.isArray(updatedBooking.addons)
        ? updatedBooking.addons
            .filter(
              (a): a is { name: string; details?: string; price?: string } =>
                !!a && typeof a === "object" && !Array.isArray(a) && typeof (a as any).name === "string"
            )
        : [],
    };

    // Render PrintableTicket to HTML
    const html = renderToStaticMarkup(
      React.createElement(PrintableTicket, { bookingData })
    );

    // Generate PDF from HTML using html-pdf
    const pdfBuffer: Buffer = await new Promise((resolve, reject) => {
      pdf.create(html, { format: "A4" }).toBuffer((err: Error, buffer: Buffer) => {
        if (err) reject(err);
        else resolve(buffer);
      });
    });

    // Setup Gmail SMTP transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    // Send email with PDF attachment
    await transporter.sendMail({
      from: `"Reeca Travel" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Your Updated Reeca Travel Ticket",
      text: `Dear ${updatedBooking.userName},\n\nAttached is your updated bus ticket.\nBooking Ref: ${updatedBooking.orderId}`,
      attachments: [
        {
          filename: `ReecaTicket-${updatedBooking.orderId}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    return NextResponse.json({ success: true, message: "Updated ticket sent to email." });
  } catch (err: any) {
    console.error("[booking/addons] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}