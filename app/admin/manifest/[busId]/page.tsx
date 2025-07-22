'use client';
import { Download } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useEffect, useState } from "react";
import { PassengerManifest } from "@/components/passengermanifest";
import { useRouter } from "next/navigation";

export default function ManifestPage({ params }: { params: { busId: string } }) {
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/bus/${params.busId}/bookings`)
      .then(res => res.json())
      .then(data => {
        setBookings(data.bookings || []);
        setLoading(false);
      });
  }, [params.busId]);

  if (loading) {
    return <div className="text-center py-12 text-teal-600">Loading manifest...</div>;
  }

  // Get trip info from first booking (assuming all bookings are for the same trip)
  const trip = bookings[0]?.trip || {};
  const route = trip.routeOrigin && trip.routeDestination
    ? `${trip.routeOrigin} → ${trip.routeDestination}`
    : "";
  const date = trip.departureDate
    ? new Date(trip.departureDate).toLocaleDateString()
    : "";
  const time = trip.departureTime || "";

  // Flatten passengers and add booking info
  const passengers = bookings.flatMap(booking =>
    booking.passengers.map((p: any) => ({
      name: `${p.firstName} ${p.lastName}`,
      seat: p.seatNumber,
      title: p.title,
      isReturn: p.isReturn,
      boarded: p.boarded ? "Yes" : "No",
      agent: booking.agent?.name || "Client",
      bookingRef: booking.orderId,
      route,
      date,
      time,
    }))
  );

  // PDF Export
  const handlePdfDownload = () => {
    const doc = new jsPDF();
    doc.text("Passenger Manifest", 14, 16);
    doc.text(`Route: ${route}`, 14, 24);
    doc.text(`Date: ${date}`, 14, 32);
    doc.text(`Time: ${time}`, 14, 40);
    autoTable(doc, {
      head: [["Name", "Seat", "Title", "Booking Ref", "Agent", "Boarded"]],
      body: passengers.map(p => [
        p.name,
        p.seat,
        p.title,
        p.bookingRef,
        p.agent,
        p.boarded,
      ]),
      startY: 46,
    });
    doc.save("manifest.pdf");
  };

  // Excel Export
  const handleExcelDownload = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      passengers.map(p => ({
        Name: p.name,
        Seat: p.seat,
        Title: p.title,
        BookingRef: p.bookingRef,
        Agent: p.agent,
        Boarded: p.boarded,
        Route: p.route,
        Date: p.date,
        Time: p.time,
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Manifest");
    XLSX.writeFile(workbook, "manifest.xlsx");
  };

  return (
    <div className="max-w-4xl mx-auto my-8 px-4">
      <button
        className="mb-4 px-4 py-2 bg-gray-100 text-teal-700 rounded hover:bg-teal-50"
        onClick={() => router.push("/admin?tab=schedule")}
      >
        ← Back to Bus Schedule
      </button>
      <h2 className="text-2xl font-bold text-teal-900 mb-4">Passenger Manifest</h2>
      <div className="flex gap-4 mb-4">
        <button
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded shadow hover:bg-teal-700"
          onClick={handlePdfDownload}
        >
          <Download className="w-4 h-4" />
          Download PDF
        </button>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded shadow hover:bg-amber-600"
          onClick={handleExcelDownload}
        >
          <Download className="w-4 h-4" />
          Download Excel
        </button>
      </div>
      <PassengerManifest passengers={passengers} tripType="departure" />
      <PassengerManifest passengers={passengers} tripType="return" />
      <div className="mt-6">
        <h3 className="font-bold text-lg text-gray-800 mb-2">Booking Info</h3>
        <table className="min-w-full border border-gray-200 rounded">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Name</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Seat</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Title</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Booking Ref</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Agent</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Boarded</th>
            </tr>
          </thead>
          <tbody>
            {passengers.map((p, idx) => (
              <tr key={idx} className="border-t border-gray-100">
                <td className="px-3 py-2 text-xs">{p.name}</td>
                <td className="px-3 py-2 text-xs">{p.seat}</td>
                <td className="px-3 py-2 text-xs">{p.title}</td>
                <td className="px-3 py-2 text-xs">{p.bookingRef}</td>
                <td className="px-3 py-2 text-xs">{p.agent}</td>
                <td className="px-3 py-2 text-xs">{p.boarded}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}