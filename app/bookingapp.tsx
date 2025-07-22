"use client";

import { useEffect, useState } from "react";
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
import PassengerDetailsForm from "./booking/passengerdetails/page";
import HireBusModal from "./booking/hirebusmodal";
import { Bus } from "lucide-react"; 

export default function BookingApp() {
  const [currentStep, setCurrentStep] = useState<
    "search" | "schedules" | "departure-seats" | "return-schedules" | "return-seats" | "passenger-details"
  >("search");
  
  const [activeTab, setActiveTab] = useState<"book" | "manage">("book");
  const [searchData, setSearchData] = useState<SearchData | null>(null);
  const [selectedDepartureBus, setSelectedDepartureBus] = useState<any>(null);
  const [selectedReturnBus, setSelectedReturnBus] = useState<any>(null);
  const [selectedDepartureSeats, setSelectedDepartureSeats] = useState<string[]>([]);
  const [selectedReturnSeats, setSelectedReturnSeats] = useState<string[]>([]);
  const [showPayment, setShowPayment] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isReturnTripSelection, setIsReturnTripSelection] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(true); // Set true when booking is open
  const [showHireModal, setShowHireModal] = useState(false);
  const [agent, setAgent] = useState<{ name: string; email: string } | null>(null);

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
    const returnDate = data.returnDate ? toDateObj(data.returnDate) : null;

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
      returnDate,
      seats: data.seats,
      isReturn: !!data.returnDate,
    });
    setCurrentStep("schedules");
  };

  const handleSelectBus = (bus: any, isReturnTrip = false) => {
    if (isReturnTrip) {
      setSelectedReturnBus(bus);
      if (bus.isRequest) {
        setShowRequestForm(true);
      } else {
        setCurrentStep("return-seats");
      }
    } else {
      setSelectedDepartureBus(bus);
      if (bus.isRequest) {
        setShowRequestForm(true);
      } else {
        setCurrentStep("departure-seats");
      }
    }
  };

  const handleSeatSelect = (seatId: string, isReturnTrip = false) => {
    if (isReturnTrip) {
      setSelectedReturnSeats((prev) => {
        if (prev.includes(seatId)) {
          return prev.filter((id) => id !== seatId);
        } else if (searchData && prev.length < searchData.seats) {
          return [...prev, seatId];
        }
        return prev;
      });
    } else {
      setSelectedDepartureSeats((prev) => {
        if (prev.includes(seatId)) {
          return prev.filter((id) => id !== seatId);
        } else if (searchData && prev.length < searchData.seats) {
          return [...prev, seatId];
        }
        return prev;
      });
    }
  };

  const handleProceedToPassengerDetails = () => {
    if (searchData?.isReturn && selectedReturnSeats.length === 0) {
      setIsReturnTripSelection(true);
      setCurrentStep("return-schedules");
    } else {
      setCurrentStep("passenger-details");
    }
  };

  const handleProceedToPayment = () => {
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

  useEffect(() => {
    if (activeTab !== "manage" || !bookingOpen) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      setShowLeaveModal(true);
      e.returnValue = ""; // Show browser dialog
      return "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [activeTab, bookingOpen]);

  useEffect(() => {
    // Try to fetch agent info on mount
    fetch("/api/agent/me")
      .then(async res => {
        if (res.ok) {
          const agentData = await res.json();
          setAgent(agentData);
          console.log("BookingApp: Agent detected", agentData);
        } else {
          setAgent(null);
          console.log("BookingApp: No agent detected");
        }
      })
      .catch(() => setAgent(null));
  }, []);

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
            {selectedDepartureBus?.isRequest ? "Request Submitted!" : "Booking Confirmed!"}
          </h2>
          <p className="text-amber-700 mb-6">
            {selectedDepartureBus?.isRequest
              ? "Your tour vehicle request has been submitted. We'll contact you within 2 hours."
              : "Your Reeca Travel bus ticket has been successfully booked"}
          </p>

          <div className="p-4 bg-gradient-to-br from-teal-50 to-amber-50 rounded-lg mb-6 border border-teal-200">
            <div className="text-sm text-teal-700">
              {selectedDepartureBus?.isRequest ? "Request Reference" : "Booking Reference"}
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

  if (showRequestForm && (selectedDepartureBus || selectedReturnBus)) {
    const bus = selectedDepartureBus || selectedReturnBus;
    return (
      <div className="bg-gradient-to-br from-amber-50 to-teal-50 min-h-screen">
        <header className="bg-white border-b shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-24 h-14 bg-white rounded-lg flex items-center justify-center p-1">
                  <Image
                    src="/images/reeca-travel-logo.png"
                    alt="Reeca Travel"
                    width={96}
                    height={56}
                    className="object-contain"
                  />
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

        <RequestForm selectedBus={bus} onSubmitRequest={handleRequestSubmit} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-teal-50">
      {agent && (
        <div className="w-full bg-amber-100 border-b border-amber-300 py-2 px-4 flex items-center justify-center">
          <span className="text-amber-800 font-semibold text-lg">
            Booking as Agent: {agent.name}
          </span>
        </div>
      )}
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-24 h-14 bg-white rounded-lg flex items-center justify-center p-1">
                <Image
                  src="/images/reeca-travel-logo.png"
                  alt="Reeca Travel"
                  width={96}
                  height={56}
                  className="object-contain"
                />
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
                {/* Bus Hire Button - only visible on landing/search page */}
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
                  onSelectBus={(bus) => handleSelectBus(bus)}
                  boardingPoints={boardingPoints}
                />
              </div>
            )}

            {currentStep === "departure-seats" && selectedDepartureBus && searchData && (
              <div>
                <Button
                  variant="ghost"
                  onClick={() => setCurrentStep("schedules")}
                  className="mb-4 text-teal-600 hover:bg-teal-50"
                >
                  ← Back to Schedule
                </Button>
                <SeatSelection
                  selectedBus={selectedDepartureBus}
                  onSeatSelect={(seatId) => handleSeatSelect(seatId)}
                  selectedSeats={selectedDepartureSeats}
                  onProceed={handleProceedToPassengerDetails}
                  searchData={searchData}
                  isReturnTrip={false}
                />
              </div>
            )}

            {currentStep === "return-schedules" && searchData && (
              <div>
                <Button
                  variant="ghost"
                  onClick={() => setCurrentStep("departure-seats")}
                  className="mb-4 text-teal-600 hover:bg-teal-50"
                >
                  ← Back to Departure Seats
                </Button>
                <BusSchedules
                  searchData={{
                    ...searchData,
                    from: searchData.to,
                    to: searchData.from,
                    departureDate: searchData.returnDate || new Date(),
                    returnDate: null
                  }}
                  onSelectBus={(bus) => handleSelectBus(bus, true)}
                  boardingPoints={boardingPoints}
                  isReturnTrip={true}
                />
              </div>
            )}

            {currentStep === "return-seats" && selectedReturnBus && searchData && (
              <div>
                <Button
                  variant="ghost"
                  onClick={() => setCurrentStep("return-schedules")}
                  className="mb-4 text-teal-600 hover:bg-teal-50"
                >
                  ← Back to Return Schedules
                </Button>
                <SeatSelection
                  selectedBus={selectedReturnBus}
                  onSeatSelect={(seatId) => handleSeatSelect(seatId, true)}
                  selectedSeats={selectedReturnSeats}
                  onProceed={handleProceedToPassengerDetails}
                  searchData={{
                    ...searchData,
                    from: searchData.to,
                    to: searchData.from,
                    departureDate: searchData.returnDate || new Date(),
                  }}
                  isReturnTrip={true}
                  maxSelectableSeats={selectedDepartureSeats.length}
                />
              </div>
            )}

            {currentStep === "passenger-details" && searchData && (
              <div>
                <Button
                  variant="ghost"
                  onClick={() => {
                    if (selectedReturnBus) {
                      setCurrentStep("return-seats");
                    } else if (searchData.isReturn && !selectedReturnBus) {
                      setCurrentStep("return-schedules");
                    } else {
                      setCurrentStep("departure-seats");
                    }
                  }}
                  className="mb-4 text-teal-600 hover:bg-teal-50"
                >
                  ← Back to Seat Selection
                </Button>
                <PassengerDetailsForm
                  departureBus={selectedDepartureBus}
                  returnBus={selectedReturnBus}
                  departureSeats={selectedDepartureSeats}
                  returnSeats={selectedReturnSeats}
                  searchData={searchData}
                  boardingPoints={boardingPoints}
                  onProceedToPayment={handleProceedToPayment}
                  showPayment={showPayment}
                  setShowPayment={setShowPayment}
                  onPaymentComplete={handlePaymentComplete}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="manage">
            <div className="max-w-xl mx-auto bg-white p-6 rounded-lg shadow mb-8">
              <h2 className="text-2xl font-bold text-teal-900 mb-4">Manage Your Trip</h2>
              <form
                className="space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const bookingRef = (formData.get("bookingRef") as string).trim();
                  const idNumber = (formData.get("idNumber") as string).trim();
                  const email = (formData.get("email") as string)?.trim() || "";
                  // Fetch booking data from backend
                  const res = await fetch(`/api/booking/lookup`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ bookingRef, contactIdNumber: idNumber, email }), // <-- FIXED
                  });
                  if (res.ok) {
                    const data = await res.json();
                    setBookings([data]); // Show only the found booking
                  } else {
                    alert("Booking not found. Please check your details.");
                  }
                }}
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700">Booking Reference</label>
                  <input name="bookingRef" required className="mt-1 block w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">ID Number</label>
                  <input name="idNumber" required className="mt-1 block w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email (optional)</label>
                  <input name="email" type="email" className="mt-1 block w-full border rounded px-3 py-2" />
                </div>
                <button type="submit" className="w-full bg-teal-600 text-white py-2 rounded font-semibold mt-2">Find My Booking</button>
              </form>
            </div>
            {/* Show booking details and actions if a booking is found */}
            {bookings.length > 0 && (
              <TripManagement bookings={bookings} setBookings={setBookings} />
            )}
          </TabsContent>
        </Tabs>
      </div>
      {activeTab === "manage" && showLeaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-lg font-bold mb-2">Leave Booking?</h2>
            <p>Do you want to discard your booking or continue?</p>
            <div className="mt-4 flex gap-2">
              <button
                className="bg-red-500 text-white px-4 py-2 rounded"
                onClick={() => {
                  setBookingOpen(false);
                  setShowLeaveModal(false);
                  // Optionally clear sensitive data here
                }}
              >
                Discard
              </button>
              <button
                className="bg-teal-600 text-white px-4 py-2 rounded"
                onClick={() => setShowLeaveModal(false)}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}