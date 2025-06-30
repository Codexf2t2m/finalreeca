"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Booking, SearchData } from "@/lib/types";
import { boardingPoints } from "@/lib/data";
import SeatSelection from "./booking/seatselection";
import ThemeToggle from "@/components/theme-toggle";
import RequestForm from "./booking/requestform";
import BookingForm from "@/components/bookingform";
import TripManagement from "./management/tripmanagement";
import BusSchedules from "./booking/busschedule";

export default function BookingApp() {
  const [currentStep, setCurrentStep] = useState<"search" | "schedules" | "seats">("search");
  const [activeTab, setActiveTab] = useState<"book" | "manage">("book");
  const [searchData, setSearchData] = useState<SearchData | null>(null);
  const [selectedBus, setSelectedBus] = useState<any>(null);
  const [selectedReturnBus, setSelectedReturnBus] = useState<any>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [showPayment, setShowPayment] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);

  // Robust date handling for DD/MM/YYYY format
  const parseDate = (dateStr: string): Date => {
    if (!dateStr) return new Date();
    
    // Handle DD/MM/YYYY format
    if (dateStr.includes('/')) {
      const [day, month, year] = dateStr.split('/').map(Number);
      return new Date(year, month - 1, day);
    }
    
    // Handle other formats
    return new Date(dateStr);
  };

  const isValidDate = (date: any): boolean => {
    if (!date) return false;
    
    const d = date instanceof Date ? date : parseDate(date);
    return !isNaN(d.getTime());
  };

  const toDateObj = (date: any): Date => {
    if (date instanceof Date) return date;
    return parseDate(date);
  };

  const handleSearch = (data: { from: string; to: string; date: any; returnDate?: any; seats: number }) => {
    // Convert and validate dates
    const departureDate = toDateObj(data.date);
    const returnDate = data.returnDate ? toDateObj(data.returnDate) : undefined;

    if (!isValidDate(departureDate)) {
      alert("Please select a valid departure date");
      return;
    }
    
    if (data.returnDate && !isValidDate(returnDate)) {
      alert("Please select a valid return date");
      return;
    }

    setSearchData({
      from: data.from,
      to: data.to,
      departureDate,
      returnDate: returnDate || null,
      seats: data.seats,
      isReturn: !!data.returnDate,
    });
    setCurrentStep("schedules");
  };

  const handleSelectBus = (bus: any) => {
    if (bus.isReturnTrip) {
      setSelectedReturnBus(bus);
    } else {
      setSelectedBus(bus);
    }
    
    setSelectedSeats([]);
    
    if (bus.isRequest) {
      setShowRequestForm(true);
    } else {
      setCurrentStep("seats");
    }
  };

  const handleSeatSelect = (seatId: string) => {
    setSelectedSeats((prev) => {
      if (prev.includes(seatId)) {
        return prev.filter((id) => id !== seatId);
      } else if (searchData && prev.length < searchData.seats) {
        return [...prev, seatId];
      }
      return prev;
    });
  };

  const handleProceedToCheckout = () => {
    setShowPayment(true);
  };

  const handlePaymentComplete = () => {
    setShowPayment(false);
    setBookingComplete(true);
  };

  const handleRequestSubmit = () => {
    setShowRequestForm(false);
    setBookingComplete(true);
  };

  if (bookingComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-amber-50 to-teal-50">
        <div className="w-full max-w-md text-center bg-white p-8 rounded-xl shadow-2xl">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold mb-4 text-teal-900">
            {selectedBus?.isRequest ? "Request Submitted!" : "Booking Confirmed!"}
          </h2>
          <p className="text-amber-700 mb-6">
            {selectedBus?.isRequest
              ? "Your tour vehicle request has been submitted. We'll contact you within 2 hours."
              : "Your Reeca Travel bus ticket has been successfully booked"}
          </p>

          <div className="p-4 bg-gradient-to-br from-teal-50 to-amber-50 rounded-lg mb-6 border border-teal-200">
            <div className="text-sm text-teal-700">
              {selectedBus?.isRequest ? "Request Reference" : "Booking Reference"}
            </div>
            <div className="text-xl font-bold text-teal-900">
              #RT{Math.random().toString(36).substr(2, 9).toUpperCase()}
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => window.location.reload()}
              className="w-full h-12 bg-teal-600 hover:bg-teal-700 text-white"
            >
              Book Another Trip
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setBookingComplete(false);
                setActiveTab("manage");
                setCurrentStep("search");
              }}
              className="w-full h-12 border-teal-600 text-teal-600 hover:bg-teal-50"
            >
              Manage Bookings
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (showRequestForm && selectedBus) {
    return (
      <div className="bg-gradient-to-br from-amber-50 to-teal-50 min-h-screen">
        <header className="bg-white border-b shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-12 h-8 bg-white rounded-lg flex items-center justify-center p-1">
                  <Image src="/images/reeca-travel-logo.png" alt="Reeca Travel" width={40} height={24} className="object-contain" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-teal-900">Reeca Travel</h1>
                  <p className="text-xs text-amber-600">Tour Vehicle Request</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setShowRequestForm(false);
                  setCurrentStep("schedules");
                }}
                className="text-teal-600 border-teal-600 hover:bg-teal-50"
              >
                Back to Schedule
              </Button>
            </div>
          </div>
        </header>

        <RequestForm selectedBus={selectedBus} onSubmitRequest={handleRequestSubmit} />
      </div>
    );
  }

  if (currentStep === "seats" && selectedBus && searchData) {
    return (
      <div className="bg-gradient-to-br from-amber-50 to-teal-50 min-h-screen">
        <header className="bg-white border-b shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-12 h-8 bg-white rounded-lg flex items-center justify-center p-1">
                  <Image src="/images/reeca-travel-logo.png" alt="Reeca Travel" width={40} height={24} className="object-contain" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-teal-900">Reeca Travel</h1>
                  <p className="text-xs text-amber-600">Seat Selection</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setCurrentStep("schedules")}
                className="text-teal-600 border-teal-600 hover:bg-teal-50"
              >
                Back to Schedule
              </Button>
            </div>
          </div>
        </header>

        <SeatSelection
          selectedBus={selectedBus}
          selectedReturnBus={selectedReturnBus}
          onSeatSelect={handleSeatSelect}
          selectedSeats={selectedSeats}
          onProceedToCheckout={handleProceedToCheckout}
          showPayment={showPayment}
          setShowPayment={setShowPayment}
          onPaymentComplete={handlePaymentComplete}
          searchData={searchData}
          boardingPoints={boardingPoints}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-teal-50">
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-8 bg-white rounded-lg flex items-center justify-center p-1">
                <Image src="/images/reeca-travel-logo.png" alt="Reeca Travel" width={40} height={24} className="object-contain" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-teal-900">Reeca Travel</h1>
                <p className="text-xs text-amber-600">Premium Bus Services</p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "book" | "manage")} className="max-w-6xl mx-auto">
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-amber-100">
            <TabsTrigger
              value="book"
              className="flex items-center gap-2 data-[state=active]:bg-teal-600 data-[state=active]:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Book Trip
            </TabsTrigger>
            <TabsTrigger
              value="manage"
              className="flex items-center gap-2 data-[state=active]:bg-teal-600 data-[state=active]:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Manage Trips
            </TabsTrigger>
          </TabsList>

          <TabsContent value="book">
            {currentStep === "search" && (
              <div>
                <div className="text-center mb-8">
                  <h1 className="text-4xl font-bold mb-4 text-teal-900">Book Your Journey with Reeca Travel</h1>
                  <p className="text-xl text-amber-700">
                    Premium comfort and reliable service between Gaborone and Johannesburg
                  </p>
                </div>
                <BookingForm onSearch={handleSearch} />
              </div>
            )}

            {currentStep === "schedules" && searchData && (
              <div>
                <Button
                  variant="ghost"
                  onClick={() => setCurrentStep("search")}
                  className="mb-4 text-teal-600 hover:bg-teal-50"
                >
                  ← Back to Search
                </Button>
                <BusSchedules
                  searchData={searchData}
                  onSelectBus={handleSelectBus}
                  boardingPoints={boardingPoints}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="manage">
            <TripManagement bookings={bookings} setBookings={setBookings} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}