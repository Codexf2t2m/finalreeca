import { BoardingPoint, SearchData } from "@/lib/types";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface SeatSelectionProps {
  selectedBus: any;
  selectedReturnBus?: any;
  onSeatSelect: (seatId: string) => void;
  selectedSeats: string[];
  onProceedToCheckout: () => void;
  showPayment: boolean;
  setShowPayment: (show: boolean) => void;
  onPaymentComplete: () => void;
  searchData: SearchData;
  boardingPoints: Record<string, BoardingPoint[]>;
}

const SeatSelection: React.FC<SeatSelectionProps> = ({
  selectedBus,
  selectedReturnBus,
  onSeatSelect,
  selectedSeats,
  onProceedToCheckout,
  showPayment,
  setShowPayment,
  onPaymentComplete,
  searchData,
  boardingPoints,
}) => {
  const [boardingPoint, setBoardingPoint] = useState("");
  const [droppingPoint, setDroppingPoint] = useState("");
  const [returnBoardingPoint, setReturnBoardingPoint] = useState("");
  const [returnDroppingPoint, setReturnDroppingPoint] = useState("");

  const totalFare = selectedBus.fare * selectedSeats.length + 
                   (selectedReturnBus ? selectedReturnBus.fare * selectedSeats.length : 0);

  const handleSubmit = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    onProceedToCheckout();
  };

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    onPaymentComplete();
  };

  if (showPayment) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6 text-center">Payment</h2>
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-2">Trip Details</h3>
            <div className="mb-4">
              <p className="font-medium">
                {selectedBus.route} - {selectedBus.serviceType}
              </p>
              <p className="text-sm text-gray-600">
                Departure: {format(new Date(selectedBus.departureDate), "EEEE, MMMM do, yyyy HH:mm")}
              </p>
              <p className="text-sm text-gray-600">Seats: {selectedSeats.join(", ")}</p>
              <p className="text-sm text-gray-600">Fare: P{selectedBus.fare * selectedSeats.length}</p>
            </div>
            {selectedReturnBus && (
              <div className="mb-4">
                <p className="font-medium">
                  {selectedReturnBus.route} - {selectedReturnBus.serviceType}
                </p>
                <p className="text-sm text-gray-600">
                  Departure: {format(new Date(selectedReturnBus.departureDate), "EEEE, MMMM do, yyyy HH:mm")}
                </p>
                <p className="text-sm text-gray-600">Seats: {selectedSeats.join(", ")}</p>
                <p className="text-sm text-gray-600">Fare: P{selectedReturnBus.fare * selectedSeats.length}</p>
              </div>
            )}
            <p className="font-bold text-xl text-right">Total Fare: P{totalFare}</p>
          </div>
          <form onSubmit={handlePayment}>
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2" htmlFor="cardNumber">
                Card Number
              </label>
              <input
                type="text"
                id="cardNumber"
                className="w-full border rounded px-3 py-2"
                placeholder="1234 5678 9012 3456"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2" htmlFor="cardName">
                Card Holder Name
              </label>
              <input
                type="text"
                id="cardName"
                className="w-full border rounded px-3 py-2"
                placeholder="John Doe"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2" htmlFor="expiryDate">
                  Expiry Date
                </label>
                <input
                  type="text"
                  id="expiryDate"
                  className="w-full border rounded px-3 py-2"
                  placeholder="MM/YY"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2" htmlFor="cvv">
                  CVV
                </label>
                <input
                  type="text"
                  id="cvv"
                  className="w-full border rounded px-3 py-2"
                  placeholder="123"
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2">
              Pay Now
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6">Select Your Seats</h2>
        
        {/* Outward Trip */}
        <div className="mb-8">
          <div className="mb-4">
            <h3 className="text-xl font-semibold">
              {selectedBus.route} - {selectedBus.serviceType}
            </h3>
            <p className="text-sm text-gray-600">
              Departure: {format(new Date(selectedBus.departureDate), "EEEE, MMMM do, yyyy HH:mm")}
            </p>
          </div>
          
          <div className="grid grid-cols-4 gap-4 mb-6">
            {Array.from({ length: selectedBus.totalSeats }, (_, i) => i + 1).map((seat) => (
              <div
                key={seat}
                onClick={() => onSeatSelect(seat.toString())}
                className={`flex items-center justify-center h-12 rounded-lg border-2 cursor-pointer transition-colors ${
                  selectedSeats.includes(seat.toString())
                    ? "bg-teal-600 border-teal-700 text-white"
                    : "bg-white border-gray-300 hover:bg-gray-100"
                }`}
              >
                {seat}
              </div>
            ))}
          </div>
        </div>
        
        {/* Return Trip */}
        {selectedReturnBus && (
          <div className="mb-8">
            <div className="mb-4">
              <h3 className="text-xl font-semibold">
                {selectedReturnBus.route} - {selectedReturnBus.serviceType}
              </h3>
              <p className="text-sm text-gray-600">
                Departure: {format(new Date(selectedReturnBus.departureDate), "EEEE, MMMM do, yyyy HH:mm")}
              </p>
            </div>
            
            <div className="grid grid-cols-4 gap-4 mb-6">
              {Array.from({ length: selectedReturnBus.totalSeats }, (_, i) => i + 1).map((seat) => (
                <div
                  key={`return-${seat}`}
                  onClick={() => onSeatSelect(seat.toString())}
                  className={`flex items-center justify-center h-12 rounded-lg border-2 cursor-pointer transition-colors ${
                    selectedSeats.includes(seat.toString())
                      ? "bg-teal-600 border-teal-700 text-white"
                      : "bg-white border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  {seat}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Boarding Points */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Journey Details</h3>
          
          {/* Outward Points */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-gray-700 font-medium mb-2" htmlFor="boardingPoint">
                Boarding Point (Outward)
              </label>
              <select
                id="boardingPoint"
                className="w-full border rounded px-3 py-2"
                value={boardingPoint}
                onChange={(e) => setBoardingPoint(e.target.value)}
                required
              >
                <option value="">Select Boarding Point</option>
                {boardingPoints[selectedBus.route.split(" → ")[0]]?.map((point: { id: string; name: string }) => (
                  <option key={point.id} value={point.name}>
                    {point.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-2" htmlFor="droppingPoint">
                Dropping Point (Outward)
              </label>
              <select
                id="droppingPoint"
                className="w-full border rounded px-3 py-2"
                value={droppingPoint}
                onChange={(e) => setDroppingPoint(e.target.value)}
                required
              >
                <option value="">Select Dropping Point</option>
                {boardingPoints[selectedBus.route.split(" → ")[1]]?.map((point: { id: string; name: string }) => (
                  <option key={point.id} value={point.name}>
                    {point.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Return Points */}
          {selectedReturnBus && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-gray-700 font-medium mb-2" htmlFor="returnBoardingPoint">
                  Boarding Point (Return)
                </label>
                <select
                  id="returnBoardingPoint"
                  className="w-full border rounded px-3 py-2"
                  value={returnBoardingPoint}
                  onChange={(e) => setReturnBoardingPoint(e.target.value)}
                  required
                >
                  <option value="">Select Boarding Point</option>
                  {boardingPoints[selectedReturnBus.route.split(" → ")[0]]?.map((point: { id: string; name: string }) => (
                    <option key={point.id} value={point.name}>
                      {point.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2" htmlFor="returnDroppingPoint">
                  Dropping Point (Return)
                </label>
                <select
                  id="returnDroppingPoint"
                  className="w-full border rounded px-3 py-2"
                  value={returnDroppingPoint}
                  onChange={(e) => setReturnDroppingPoint(e.target.value)}
                  required
                >
                  <option value="">Select Dropping Point</option>
                  {boardingPoints[selectedReturnBus.route.split(" → ")[1]]?.map((point: { id: string; name: string }) => (
                    <option key={point.id} value={point.name}>
                      {point.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-lg font-medium">
              Selected Seats: <span className="font-bold">{selectedSeats.join(", ")}</span>
            </p>
            <p className="text-sm text-gray-600">
              {searchData.seats} seat{searchData.seats > 1 ? "s" : ""} selected
            </p>
          </div>
          <p className="text-lg font-bold">Total Fare: P{totalFare}</p>
        </div>
        
        <Button
          onClick={handleSubmit}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 text-lg"
          disabled={
            selectedSeats.length !== searchData.seats || 
            !boardingPoint || 
            !droppingPoint || 
            (selectedReturnBus && (!returnBoardingPoint || !returnDroppingPoint))
          }
        >
          Proceed to Checkout
        </Button>
      </div>
    </div>
  );
};

export default SeatSelection;