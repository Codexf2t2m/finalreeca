'use client';
import { Download, ArrowLeft } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useEffect, useState } from "react";
import { PassengerManifest } from "@/components/passengermanifest";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

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

  // Get trip info from first booking
  const trip = bookings[0]?.trip || {};
  const route = trip.routeOrigin && trip.routeDestination
    ? `${trip.routeOrigin} → ${trip.routeDestination}`
    : "";
  const date = trip.departureDate
    ? new Date(trip.departureDate).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : "";
  const time = trip.departureTime || "";

  // Flatten passengers and add booking info
  const currentTripPassengers = bookings.flatMap(booking =>
    booking.passengers
      .filter((p: any) => !p.isReturn)
      .map((p: any) => ({
        name: `${p.firstName} ${p.lastName}`,
        seat: p.seatNumber,
        title: p.title,
        boarded: p.boarded,
        agent: booking.agent?.name || "Client",
        bookingRef: booking.orderId,
        route,
        date,
        time,
      }))
  );

  // PDF Export
  const handlePdfDownload = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Add watermark background
    doc.setFillColor(240, 240, 240);
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight(), 'F');
    
    // Add logo
    const logoUrl = "/images/reeca-travel-logo.png";
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = logoUrl;

    const generatePdf = () => {
      doc.addImage(img, "PNG", 20, 15, 25, 25);
      
      // Header
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFontSize(20);
      doc.text("PASSENGER MANIFEST", 105, 25, { align: 'center' });
      
      // Trip info
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text(`Route: ${route}`, 20, 50);
      doc.text(`Date: ${date}`, 20, 58);
      doc.text(`Time: ${time}`, 20, 66);
      doc.text(`Total Passengers: ${currentTripPassengers.length}`, 20, 74);
      
      // Table
      autoTable(doc, {
        head: [["Name", "Seat", "Title", "Booking Ref", "Agent", "Boarded"]],
        body: currentTripPassengers.map(p => [
          p.name,
          p.seat,
          p.title,
          p.bookingRef,
          p.agent,
          p.boarded ? "✓" : "✗",
        ]),
        startY: 80,
        theme: 'grid',
        headStyles: {
          fillColor: [15, 118, 110], // teal-700
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 10
        },
        bodyStyles: {
          textColor: [15, 23, 42], // slate-900
          fontSize: 9,
          cellPadding: 3
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252] // slate-50
        },
        styles: {
          lineColor: [226, 232, 240], // slate-200
          lineWidth: 0.2
        },
        margin: { top: 80 }
      });
      
      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139); // slate-500
        doc.text(`Page ${i} of ${pageCount}`, 105, 287, { align: 'center' });
        doc.text(`Generated on ${new Date().toLocaleString()}`, 105, 292, { align: 'center' });
      }
      
      doc.save(`manifest-${route}-${date.replace(/\s+/g, '-')}.pdf`);
    };

    if (img.complete) {
      generatePdf();
    } else {
      img.onload = generatePdf;
    }
  };

  // Excel Export
  const handleExcelDownload = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      currentTripPassengers.map(p => ({
        Name: p.name,
        Seat: p.seat,
        Title: p.title,
        "Booking Ref": p.bookingRef,
        Agent: p.agent,
        Boarded: p.boarded ? "Yes" : "No",
        Route: p.route,
        Date: p.date,
        Time: p.time,
      }))
    );
    
    // Set column widths
    worksheet['!cols'] = [
      { wch: 25 }, // Name
      { wch: 8 },  // Seat
      { wch: 10 }, // Title
      { wch: 15 }, // Booking Ref
      { wch: 20 }, // Agent
      { wch: 10 }, // Boarded
      { wch: 30 }, // Route
      { wch: 15 }, // Date
      { wch: 10 }  // Time
    ];
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Manifest");
    XLSX.writeFile(workbook, `manifest-${route}-${date.replace(/\s+/g, '-')}.xlsx`);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto my-8 px-4 space-y-6">
        <Skeleton className="h-10 w-32" />
        <div className="flex gap-4">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="space-y-2">
          {[...Array(10)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto my-8 px-4">
      <div className="flex flex-col space-y-8">
        {/* Header */}
        <div className="flex flex-col space-y-4">
          <button
            onClick={() => router.push("/admin?tab=schedule")}
            className="flex items-center gap-2 text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Bus Schedule
          </button>
          
          <div className="flex justify-between items-end border-b border-slate-200 pb-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Passenger Manifest</h1>
              <div className="flex gap-6 mt-2 text-sm text-slate-600">
                <span className="flex items-center gap-1">
                  <span className="font-medium">Route:</span> {route}
                </span>
                <span className="flex items-center gap-1">
                  <span className="font-medium">Date:</span> {date}
                </span>
                <span className="flex items-center gap-1">
                  <span className="font-medium">Time:</span> {time}
                </span>
                <span className="flex items-center gap-1">
                  <span className="font-medium">Passengers:</span> {currentTripPassengers.length}
                </span>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handlePdfDownload}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-lg shadow-sm hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
              >
                <Download className="w-4 h-4" />
                <span className="text-sm font-medium">PDF</span>
              </button>
              <button
                onClick={handleExcelDownload}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg shadow-sm hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
              >
                <Download className="w-4 h-4" />
                <span className="text-sm font-medium">Excel</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Passenger Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Passenger
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Seat
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Booking Ref
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Agent
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Boarded
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {currentTripPassengers.map((passenger, index) => (
                  <tr key={index} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                          {passenger.name.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-slate-900">{passenger.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900 font-mono">{passenger.seat}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-100 text-slate-800">
                        {passenger.title}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">
                      {passenger.bookingRef}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {passenger.agent}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${passenger.boarded ? 'bg-green-100 text-green-800' : 'bg-rose-100 text-rose-800'}`}>
                        {passenger.boarded ? 'Boarded' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Summary */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-medium text-slate-900 mb-4">Trip Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-slate-200 rounded-lg p-4">
              <div className="text-sm font-medium text-slate-500">Total Passengers</div>
              <div className="mt-1 text-3xl font-semibold text-slate-900">{currentTripPassengers.length}</div>
            </div>
            <div className="border border-slate-200 rounded-lg p-4">
              <div className="text-sm font-medium text-slate-500">Passengers Boarded</div>
              <div className="mt-1 text-3xl font-semibold text-green-600">
                {currentTripPassengers.filter(p => p.boarded).length}
              </div>
            </div>
            <div className="border border-slate-200 rounded-lg p-4">
              <div className="text-sm font-medium text-slate-500">Pending Boarding</div>
              <div className="mt-1 text-3xl font-semibold text-amber-600">
                {currentTripPassengers.filter(p => !p.boarded).length}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}