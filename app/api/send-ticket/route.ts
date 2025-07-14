import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import pdf from "html-pdf";
import puppeteer from "puppeteer";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function formatDate(dateInput: Date | string | undefined, formatStr: string) {
  if (!dateInput) return "N/A";
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (!(date instanceof Date) || isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-US", {
    weekday: formatStr.includes("EEEE") ? "long" : undefined,
    month: formatStr.includes("MMMM")
      ? "long"
      : formatStr.includes("MMM")
      ? "short"
      : undefined,
    day: formatStr.includes("dd") ? "2-digit" : undefined,
    year: formatStr.includes("yyyy") ? "numeric" : undefined,
  });
}

function renderTripSection(
  trip: {
    route: string;
    date: string | Date;
    time: string;
    bus: string;
    boardingPoint: string;
    droppingPoint: string;
    seats: string[];
    passengers: { name: string; seat: string; title?: string; isReturn?: boolean }[];
  } | undefined,
  label: string,
  bookingStatus: string
) {
  if (!trip) return "";
  const sortedPassengers = [...trip.passengers].sort((a, b) => {
    const numA = parseInt(a.seat.match(/\d+/)?.[0] || "0");
    const numB = parseInt(b.seat.match(/\d+/)?.[0] || "0");
    if (numA !== numB) return numA - numB;
    return a.seat.localeCompare(b.seat);
  });
  const sortedSeats = [...trip.seats].sort((a, b) => {
    const numA = parseInt(a.match(/\d+/)?.[0] || "0");
    const numB = parseInt(b.match(/\d+/)?.[0] || "0");
    if (numA !== numB) return numA - numB;
    return a.localeCompare(b);
  });
  return `
    <div style="margin-bottom:32px;">
      <div style="background:#f3f4f6;padding:8px;margin-bottom:8px;">
        <h3 style="font-weight:bold;color:#1f2937;">${label} Trip Details</h3>
      </div>
      <div style="border:1px solid #d1d5db;border-radius:8px;padding:12px;margin-bottom:16px;">
        <div style="font-weight:600;color:#1f2937;font-size:16px;margin-bottom:8px;">
          BUS TICKET - ${trip.route}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;font-size:13px;">
          <div>
            <p><strong>Date:</strong> ${formatDate(trip.date, "EEEE, MMMM dd, yyyy")}</p>
            <p><strong>Time:</strong> ${trip.time}</p>
            <p><strong>Bus:</strong> ${trip.bus}</p>
          </div>
          <div>
            <p><strong>Boarding:</strong> ${trip.boardingPoint}</p>
            <p><strong>Dropping:</strong> ${trip.droppingPoint}</p>
            <p><strong>Seats:</strong> ${sortedSeats.join(", ")}</p>
          </div>
        </div>
      </div>
      <div style="overflow-x:auto;margin-bottom:16px;">
        <table style="width:100%;border:1px solid #e5e7eb;border-radius:4px;font-size:13px;">
          <thead>
            <tr style="background:#f9fafb;">
              <th style="padding:6px;text-align:left;font-weight:600;color:#374151;">#</th>
              <th style="padding:6px;text-align:left;font-weight:600;color:#374151;">Name</th>
              <th style="padding:6px;text-align:left;font-weight:600;color:#374151;">Seat</th>
              <th style="padding:6px;text-align:left;font-weight:600;color:#374151;">Title</th>
            </tr>
          </thead>
          <tbody>
            ${
              sortedPassengers.length > 0
                ? sortedPassengers
                    .map(
                      (passenger, idx) => `
                  <tr style="border-top:1px solid #f3f4f6;">
                    <td style="padding:6px;">${idx + 1}</td>
                    <td style="padding:6px;">${passenger.name}</td>
                    <td style="padding:6px;font-weight:bold;">${passenger.seat}</td>
                    <td style="padding:6px;">${passenger.title || "Mr"}</td>
                  </tr>
                `
                    )
                    .join("")
                : `
                <tr>
                  <td colspan="4" style="padding:6px;color:#6b7280;text-align:center;">
                    No passenger data available
                  </td>
                </tr>
              `
            }
          </tbody>
        </table>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:8px;font-size:13px;color:#4b5563;">
        <span>Passengers: <span style="font-weight:600;">${sortedPassengers.length}</span></span>
        <span>Seats: <span style="font-weight:600;">${sortedSeats.join(", ")}</span></span>
        <span>Status: <span style="font-weight:600;color:#059669;">${bookingStatus}</span></span>
        <span>Date Issued: <span style="font-weight:600;">${formatDate(new Date(), "dd MMM yyyy")}</span></span>
      </div>
    </div>
  `;
}

export async function POST(req: NextRequest) {
  try {
    const { orderId, email } = await req.json();
    if (!orderId || !email) {
      return NextResponse.json({ error: "Missing orderId or email" }, { status: 400 });
    }

    // Fetch booking data
    const booking = await prisma.booking.findUnique({
      where: { orderId },
      include: { passengers: true, trip: true, returnTrip: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Map booking to BookingData shape for ticket
    const departurePassengers = booking.passengers
      .filter((p) => !p.isReturn)
      .map((p) => ({
        name: `${p.firstName} ${p.lastName}`,
        seat: p.seatNumber,
        title: p.title,
        isReturn: p.isReturn,
      }));

    const returnPassengers = booking.passengers
      .filter((p) => p.isReturn)
      .map((p) => ({
        name: `${p.firstName} ${p.lastName}`,
        seat: p.seatNumber,
        title: p.title,
        isReturn: p.isReturn,
      }));

    const departureTrip = {
      route: booking.trip.routeName,
      date: booking.trip.departureDate,
      time: booking.trip.departureTime,
      bus: booking.trip.serviceType,
      boardingPoint: booking.boardingPoint || "Not specified",
      droppingPoint: booking.droppingPoint || "Not specified",
      seats: JSON.parse(booking.seats),
      passengers: departurePassengers,
    };

    const returnTrip = booking.returnTrip
      ? {
          route: booking.returnTrip.routeName,
          date: booking.returnTrip.departureDate,
          time: booking.returnTrip.departureTime,
          bus: booking.returnTrip.serviceType,
          boardingPoint: booking.returnBoardingPoint || "Not specified",
          droppingPoint: booking.returnDroppingPoint || "Not specified",
          seats: booking.returnSeats ? JSON.parse(booking.returnSeats) : [],
          passengers: returnPassengers,
        }
      : undefined;

    // Addons support (if present)
    const addons =
      Array.isArray(booking.addons) && booking.addons.length > 0
        ? booking.addons.filter(
            (a): a is { name: string; details?: string; price?: string } =>
              !!a &&
              typeof a === "object" &&
              !Array.isArray(a) &&
              typeof (a as any).name === "string"
          )
        : [];

    // QR code data
    const qrData = {
      ref: booking.orderId,
      name: booking.userName,
      trips: [departureTrip, returnTrip]
        .filter((trip) => !!trip)
        .map((trip) => ({
          route: trip.route,
          date:
            trip.date instanceof Date
              ? trip.date.toISOString()
              : trip.date,
          time: trip.time,
          seats: trip.seats,
          passengers: trip.passengers.map((p) => ({
            name: p.name,
            seat: p.seat,
          })),
        })),
      amount: booking.totalPrice,
      type: returnTrip ? "Roundtrip" : "Departure",
    };
    const qrString = JSON.stringify(qrData);
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrString)}`;

    // Build HTML for ticket (matches PrintableTicket)
    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <title>REECA TRAVEL BUS TICKET</title>
          <style>
            body { font-family: Arial, sans-serif; background: #f9fafb; }
            .printable-ticket { max-width: 700px; margin: 0 auto; background: #fff; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 2px 8px #e5e7eb; }
            .header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 32px; }
            .company { font-size: 20px; font-weight: bold; color: #1f2937; }
            .ticket-title { font-size: 28px; font-weight: bold; color: #1f2937; margin-bottom: 4px; }
            .ticket-ref { font-size: 18px; font-weight: 600; color: #059669; }
            .section-title { font-weight: bold; color: #1f2937; margin-bottom: 8px; }
            .info { font-size: 14px; color: #374151; margin-bottom: 8px; }
            .qr { text-align: center; margin-top: 16px; }
            .addons { margin-top: 24px; }
            .addons-title { font-weight: bold; color: #1f2937; margin-bottom: 8px; }
            .addons-list { font-size: 14px; color: #374151; }
          </style>
        </head>
        <body>
          <div class="printable-ticket">
            <div class="header">
              <div>
                <div class="company">REECA TRAVEL</div>
                <div style="font-size:12px;color:#6b7280;">Your Journey, Our Priority</div>
              </div>
              <div style="text-align:right;">
                <div class="ticket-title">BUS TICKET</div>
                <div class="ticket-ref">#${booking.orderId}</div>
                <div style="font-size:13px;color:#374151;">${returnTrip ? "ROUNDTRIP" : "DEPARTURE TRIP"}</div>
              </div>
            </div>
            <div style="margin-bottom:24px;">
              <div class="section-title">Payer Information</div>
              <div class="info"><strong>Name:</strong> ${booking.userName}</div>
              <div class="info"><strong>Email:</strong> ${booking.userEmail}</div>
              <div class="info"><strong>Phone:</strong> ${booking.userPhone || "N/A"}</div>
            </div>
            ${renderTripSection(departureTrip, "Departure", booking.bookingStatus)}
            ${returnTrip ? renderTripSection(returnTrip, "Return", booking.bookingStatus) : ""}
            <div style="margin-bottom:24px;">
              <div class="section-title">Payment Information</div>
              <div class="info"><strong>Payment Method:</strong> ${booking.paymentMode}</div>
              <div class="info"><strong>Payment Status:</strong> <span style="font-weight:600;color:${booking.paymentStatus === "paid" ? "#059669" : "#dc2626"};">${booking.paymentStatus}</span></div>
              <div class="info"><strong>Booking Status:</strong> <span style="font-weight:600;color:#059669;">${booking.bookingStatus}</span></div>
              <div class="info"><strong>Total Amount:</strong> ${booking.totalPrice}</div>
            </div>
            <div class="qr">
              <div class="section-title">Booking QR Code</div>
              <img src="${qrCodeUrl}" alt="Booking QR Code" style="width:120px;height:120px;" />
              <div style="font-size:12px;color:#6b7280;">Scan this QR code for quick verification</div>
            </div>
            ${
              addons.length > 0
                ? `<div class="addons">
                    <div class="addons-title">Addons</div>
                    <ul class="addons-list">
                      ${addons
                        .map(
                          (addon) =>
                            `<li>${addon.name} - ${addon.details ?? ""} ${
                              addon.price ? `(${addon.price})` : ""
                            }</li>`
                        )
                        .join("")}
                    </ul>
                  </div>`
                : ""
            }
            <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;text-align:center;font-size:13px;color:#6b7280;">
              Thank you for choosing REECA TRAVEL for your journey!<br/>
              For support, contact us at +26773061124 or admin@reecatravel.co.bw
            </div>
          </div>
        </body>
      </html>
    `;

    // Generate PDF from HTML using Puppeteer
    const pdfBuffer: Buffer = await (async () => {
      const browser = await puppeteer.launch({
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
        headless: true // <-- FIXED
      });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });
      const buffer = await page.pdf({ format: "A4", printBackground: true });
      await browser.close();
      return Buffer.from(buffer); // <-- FIXED
    })();

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
      subject: "Your Reeca Travel Ticket",
      text: `Dear ${booking.userName},\n\nAttached is your bus ticket.\nBooking Ref: ${booking.orderId}`,
      attachments: [
        {
          filename: `ReecaTicket-${booking.orderId}.pdf`,
          content: pdfBuffer, // <-- Now a proper Buffer
        },
      ],
    });

    console.log(`[send-ticket] Ticket sent to ${email} for orderId: ${orderId}`);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[send-ticket] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}