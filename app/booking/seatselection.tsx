import React, { useState, useRef } from "react";
import { jsPDF } from "jspdf";
import { renderToStaticMarkup } from "react-dom/server";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BoardingPoint, SearchData } from "@/lib/types";
import QRCode from "react-qr-code";

interface Seat {
  id: string;
  number: string;
  isAvailable: boolean;
  isSelected: boolean;
  row: number;
  position: string;
  side: string;
  seatIndex: number;
}

interface SeatSelectionProps {
  selectedBus: any;
  onSeatSelect: (seatId: string) => void;
  selectedSeats: string[];
  onProceedToCheckout: () => void;
  showPayment: boolean;
  setShowPayment: (show: boolean) => void;
  onPaymentComplete: () => void;
  searchData: SearchData;
  boardingPoints: Record<string, BoardingPoint[]>;
}

const generateSeatLayout = (totalSeats = 57, availableSeatsCount?: number): Seat[] => {
  const seats: Seat[] = [];
  const totalRows = Math.ceil(totalSeats / 4);
  const availableSeats = new Set<number>();
  if (availableSeatsCount !== undefined) {
    const allSeatIndices = Array.from({ length: totalSeats }, (_, i) => i);
    const shuffled = [...allSeatIndices].sort(() => 0.5 - Math.random());
    const selectedIndices = shuffled.slice(0, availableSeatsCount);
    selectedIndices.forEach((index) => availableSeats.add(index));
  }
  let seatIndex = 0;
  for (let row = 1; row <= totalRows; row++) {
    ["A", "B", "C", "D"].forEach((position) => {
      if (seatIndex < totalSeats) {
        const isAvailable = availableSeatsCount === undefined ? Math.random() > 0.4 : availableSeats.has(seatIndex);
        seats.push({
          id: `${row}${position}`,
          number: `${row}${position}`,
          isAvailable,
          isSelected: false,
          row,
          position,
          side: position === "A" || position === "B" ? "left" : "right",
          seatIndex,
        });
        seatIndex++;
      }
    });
  }
  return seats;
};

const SeatSelection: React.FC<SeatSelectionProps> = ({
  selectedBus,
  onSeatSelect,
  selectedSeats,
  onProceedToCheckout,
  showPayment,
  setShowPayment,
  onPaymentComplete,
  searchData,
  boardingPoints,
}) => {
  const [seatLayout] = useState<Seat[]>(() => generateSeatLayout(selectedBus?.seats || 57, selectedBus?.availableSeats));
  const [boardingPoint, setBoardingPoint] = useState("");
  const [droppingPoint, setDroppingPoint] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const qrRef = useRef<HTMLDivElement>(null);

  const isGaboroneToORTambo = searchData.from === "Gaborone" && searchData.to === "OR Tambo Airport";
  const isORTamboToGaborone = searchData.from === "OR Tambo Airport" && searchData.to === "Gaborone";

  const gaboronePickupPoints = [
    { name: "Mogobe Plaza" },
    { name: "Engine Tlokweng Bus Stop" },
  ];

  const ortamboDropOffPoints = [
    { name: "OR Tambo Airport" },
  ];

  const handleProceedToCheckout = () => {
    if (!userName || !userEmail) {
      alert('Please provide your name and email');
      return;
    }
    if (!boardingPoint || !droppingPoint) {
      alert('Please select both boarding and dropping points');
      return;
    }
    onProceedToCheckout();
  };

  const generateTicket = async () => {
    const doc = new jsPDF();

    // Add content to the PDF
    doc.text(`Ticket Details`, 10, 10);
    doc.text(`User Name: ${userName}`, 10, 20);
    doc.text(`User Email: ${userEmail}`, 10, 30);
    doc.text(`Selected Seats: ${selectedSeats.join(", ")}`, 10, 40);
    doc.text(`Boarding Point: ${boardingPoint}`, 10, 50);
    doc.text(`Dropping Point: ${droppingPoint}`, 10, 60);
    doc.text(`Order ID: RT${Date.now()}`, 10, 70);
    doc.text(`Total Price: P${selectedBus.fare * selectedSeats.length}`, 10, 80);

    // Generate QR code SVG in a hidden div and convert to PNG
    const qrCodeData = `Order ID: RT${Date.now()}`;

    // Render QRCode to hidden div
    const svg = qrRef.current?.querySelector("svg");
    if (svg) {
      // Create a canvas and draw the SVG onto it
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const img = new window.Image();
      const svgSize = 128;
      canvas.width = svgSize;
      canvas.height = svgSize;
      img.width = svgSize;
      img.height = svgSize;
      img.onload = function () {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, svgSize, svgSize);
          ctx.drawImage(img, 0, 0, svgSize, svgSize);
          const pngUrl = canvas.toDataURL("image/png");
          doc.addImage(pngUrl, "PNG", 10, 100, 50, 50);
          doc.save(`ticket_RT${Date.now()}.pdf`);
          onPaymentComplete();
        }
      };
      img.src = "data:image/svg+xml;base64," + window.btoa(unescape(encodeURIComponent(svgData)));
    } else {
      // fallback: just save the PDF without QR
      doc.save(`ticket_RT${Date.now()}.pdf`);
      onPaymentComplete();
    }
  };

  return (
    <div className="max-w-6xl mx-auto my-8 px-4">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
        <div className="p-6 border-b bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="flex flex-col md:flex-row justify-between items-start">
            <div>
              <div className="font-bold text-xl text-gray-800">
                {selectedBus.registration} - {selectedBus.name}
              </div>
              <div className="text-sm text-gray-600">AC, Video ({selectedBus.seats} seats) (2+2 Configuration)</div>
            </div>
            <div className="mt-2 md:mt-0 text-right">
              <div className="text-sm text-gray-600 capitalize">
                {searchData.from} → {searchData.to}
              </div>
              <div className="text-sm text-gray-600">
                {new Date(searchData.departureDate).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-6">
          <div className="lg:col-span-2">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Select Your Seats</h3>
            <div className="border-2 border-gray-300 rounded-xl p-6 bg-white">
              <div className="space-y-3">
                {Array.from({ length: Math.ceil(selectedBus.seats / 4) }).map((_, rowIndex) => (
                  <div key={rowIndex} className="flex items-center justify-center gap-4">
                    <div className="w-6 text-center text-xs font-medium text-gray-500">{rowIndex + 1}</div>
                    <div className="flex gap-2">
                      {["A", "B"].map((position) => {
                        const seatId = `${rowIndex + 1}${position}`;
                        const seat = seatLayout.find((s) => s.id === seatId);
                        if (!seat) return null;
                        return (
                          <button
                            key={seatId}
                            onClick={() => onSeatSelect(seatId)}
                            disabled={!seat.isAvailable}
                            className={`w-10 h-10 rounded-lg text-xs font-bold flex items-center justify-center border-2 transition-all duration-200 ${
                              selectedSeats.includes(seatId)
                                ? "bg-teal-500 text-white border-teal-600 shadow-md"
                                : seat.isAvailable
                                ? "bg-gray-200 hover:bg-gray-300 border-gray-300 hover:border-gray-400"
                                : "bg-gray-400 text-gray-600 cursor-not-allowed border-gray-500"
                            }`}
                          >
                            {seatId}
                          </button>
                        );
                      })}
                    </div>
                    <div className="w-8 border-l-2 border-dashed border-gray-300 h-8 flex items-center justify-center">
                      <div className="text-xs text-gray-400">||</div>
                    </div>
                    <div className="flex gap-2">
                      {["C", "D"].map((position) => {
                        const seatId = `${rowIndex + 1}${position}`;
                        const seat = seatLayout.find((s) => s.id === seatId);
                        if (!seat) return null;
                        return (
                          <button
                            key={seatId}
                            onClick={() => onSeatSelect(seatId)}
                            disabled={!seat.isAvailable}
                            className={`w-10 h-10 rounded-lg text-xs font-bold flex items-center justify-center border-2 transition-all duration-200 ${
                              selectedSeats.includes(seatId)
                                ? "bg-teal-500 text-white border-teal-600 shadow-md"
                                : seat.isAvailable
                                ? "bg-gray-200 hover:bg-gray-300 border-gray-300 hover:border-gray-400"
                                : "bg-gray-400 text-gray-600 cursor-not-allowed border-gray-500"
                            }`}
                          >
                            {seatId}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="lg:col-span-1">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Booking Summary</h3>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-700">Selected Seats:</span>
                  <span className="font-semibold text-gray-900">
                    {selectedSeats.length > 0 ? selectedSeats.join(", ") : "None"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Price per seat:</span>
                  <span className="font-semibold text-gray-900">P{selectedBus.fare}</span>
                </div>
                <div className="flex justify-between text-lg">
                  <span className="font-bold text-gray-900">Total Amount:</span>
                  <span className="font-bold text-teal-600 text-xl">P{selectedBus.fare * selectedSeats.length}</span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="userName" className="text-sm font-medium text-gray-700">
                  User Name
                </Label>
                <Input
                  id="userName"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter your name"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="userEmail" className="text-sm font-medium text-gray-700">
                  User Email
                </Label>
                <Input
                  id="userEmail"
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="boardingPoint" className="text-sm font-medium text-gray-700">
                  Boarding Point
                </Label>
                <Select value={boardingPoint} onValueChange={setBoardingPoint}>
                  <SelectTrigger id="boardingPoint" className="mt-1 border-gray-200 focus:border-teal-500">
                    <SelectValue placeholder="Select boarding point" />
                  </SelectTrigger>
                  <SelectContent>
                    {isGaboroneToORTambo && gaboronePickupPoints.map((point) => (
                      <SelectItem key={point.name} value={point.name}>
                        {point.name}
                      </SelectItem>
                    ))}
                    {isORTamboToGaborone && ortamboDropOffPoints.map((point) => (
                      <SelectItem key={point.name} value={point.name}>
                        {point.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="droppingPoint" className="text-sm font-medium text-gray-700">
                  Dropping Point
                </Label>
                <Select value={droppingPoint} onValueChange={setDroppingPoint}>
                  <SelectTrigger id="droppingPoint" className="mt-1 border-gray-200 focus:border-teal-500">
                    <SelectValue placeholder="Select dropping point" />
                  </SelectTrigger>
                  <SelectContent>
                    {isGaboroneToORTambo && ortamboDropOffPoints.map((point) => (
                      <SelectItem key={point.name} value={point.name}>
                        {point.name}
                      </SelectItem>
                    ))}
                    {isORTamboToGaborone && gaboronePickupPoints.map((point) => (
                      <SelectItem key={point.name} value={point.name}>
                        {point.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleProceedToCheckout}
                disabled={selectedSeats.length === 0 || !boardingPoint || !droppingPoint || !userName || !userEmail}
                className="w-full h-12 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg"
              >
                PROCEED TO PAYMENT
              </Button>
            </div>
          </div>
        </div>
      </div>
      {/* Hidden QR code for PNG conversion */}
      <div style={{ position: "absolute", left: -9999, top: -9999, visibility: "hidden" }} ref={qrRef}>
        <QRCode value={`Order ID: RT${Date.now()}`} size={128} />
      </div>
      <Dialog open={showPayment} onOpenChange={(open) => !open && setShowPayment(false)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-teal-900">Complete Your Booking</DialogTitle>
            <DialogDescription>Secure payment for your Reeca Travel bus ticket</DialogDescription>
          </DialogHeader>
          <div className="p-4">
            <p>Processing your payment...</p>
            <Button onClick={generateTicket} className="mt-4 w-full h-12 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg">
              Download Ticket
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SeatSelection;
