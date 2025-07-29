'use client';

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, ChevronUp, Copy } from "lucide-react";
import { SearchData, BoardingPoint } from "@/lib/types";
import { format } from "date-fns";
import PaymentGateway from "../paymentgateway";
import { PolicyModal } from "@/components/PolicyModal";

interface Passenger {
  id: string;
  title: string;
  firstName: string;
  lastName: string;
  seatNumber: string;
  isReturn: boolean;
  hasInfant?: boolean;         // <-- NEW
  infantBirthdate?: string;    // <-- NEW
}

interface ContactDetails {
  name: string;
  email: string;
  mobile: string;
  alternateMobile: string;
  idType: string;
  idNumber: string;
}

interface EmergencyContact {
  name: string;
  phone: string;
}

interface SectionState {
  passengers: boolean;
  contact: boolean;
  emergency: boolean;
  points: boolean;
}

interface PassengerDetailsFormProps {
  departureBus: any;
  returnBus: any;
  departureSeats: string[];
  returnSeats: string[];
  searchData: SearchData;
  boardingPoints: Record<string, BoardingPoint[]>;
  onProceedToPayment: () => void;
  showPayment: boolean;
  setShowPayment: (show: boolean) => void;
  onPaymentComplete: () => void;
}

function generateOrderId() {
  return `RT${Math.floor(100000 + Math.random() * 900000)}`;
}

export default function PassengerDetailsForm({
  departureBus,
  returnBus,
  departureSeats = [],
  returnSeats = [],
  searchData = {} as SearchData,
  boardingPoints = {},
  onProceedToPayment,
  showPayment,
  setShowPayment,
  onPaymentComplete
}: PassengerDetailsFormProps) {
  const getBoardingPoints = (key: string): BoardingPoint[] => {
    if (!boardingPoints || typeof boardingPoints !== 'object') {
      return [{ id: 'default', name: 'Default', times: [] }];
    }
    const normalizedKey = key.trim().toLowerCase() || 'default';
    const points = boardingPoints[normalizedKey];
    if (!points || !Array.isArray(points)) {
      return [{
        id: 'default',
        name: key.trim(),
        times: []
      }];
    }
    return points;
  };

  if (!boardingPoints || !departureBus || !searchData) {
    return <div className="text-center py-8">Loading form data...</div>;
  }

  const [passengers, setPassengers] = useState<Passenger[]>(() => {
    const departurePassengers = (departureSeats || []).map(seat => ({
      id: `departure-${seat}`,
      title: 'Mr',
      firstName: '',
      lastName: '',
      seatNumber: seat,
      isReturn: false
    }));
    const returnPassengers = (returnSeats || []).map(seat => ({
      id: `return-${seat}`,
      title: 'Mr',
      firstName: '',
      lastName: '',
      seatNumber: seat,
      isReturn: true
    }));
    return [...departurePassengers, ...returnPassengers];
  });

  useEffect(() => {
    const departurePassengers = (departureSeats || []).map(seat => {
      const existing = passengers.find(p => p.seatNumber === seat && !p.isReturn);
      return {
        id: `departure-${seat}`,
        firstName: existing?.firstName || "",
        lastName: existing?.lastName || "",
        seatNumber: seat,
        title: existing?.title || "Mr",
        isReturn: false,
      };
    });
    const returnPassengers = (returnSeats || []).map(seat => {
      const existing = passengers.find(p => p.seatNumber === seat && p.isReturn);
      return {
        id: `return-${seat}`,
        firstName: existing?.firstName || "",
        lastName: existing?.lastName || "",
        seatNumber: seat,
        title: existing?.title || "Mr",
        isReturn: true,
      };
    });
    setPassengers([...departurePassengers, ...returnPassengers]);
  }, [departureSeats.join(','), returnSeats.join(',')]);

  const [contactDetails, setContactDetails] = useState<ContactDetails>({
    name: '',
    email: '',
    mobile: '',
    alternateMobile: '',
    idType: 'Passport',
    idNumber: ''
  });

  const [emergencyContact, setEmergencyContact] = useState<EmergencyContact>({
    name: '',
    phone: ''
  });

  const [paymentMode, setPaymentMode] = useState('Credit Card');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [departureBoardingPoint, setDepartureBoardingPoint] = useState('');
  const [departureDroppingPoint, setDepartureDroppingPoint] = useState('');
  const [returnBoardingPoint, setReturnBoardingPoint] = useState('');
  const [returnDroppingPoint, setReturnDroppingPoint] = useState('');
  const [openSections, setOpenSections] = useState<SectionState>({
    passengers: true,
    contact: true,
    emergency: true,
    points: true
  });

  const toggleSection = (section: keyof SectionState) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const copyDepartureToReturn = () => {
    const departurePassengers = passengers.filter(p => !p.isReturn);
    const returnPassengers = passengers.filter(p => p.isReturn);

    const updatedPassengers = passengers.map(passenger => {
      if (passenger.isReturn) {
        const index = returnPassengers.findIndex(rp => rp.id === passenger.id);
        if (index !== -1 && departurePassengers[index]) {
          return {
            ...passenger,
            title: departurePassengers[index].title,
            firstName: departurePassengers[index].firstName,
            lastName: departurePassengers[index].lastName
          };
        }
      }
      return passenger;
    });

    setPassengers(updatedPassengers);
  };

  const departurePricePerSeat: number = departureBus?.fare || 0;
  const returnPricePerSeat: number = returnBus?.fare || 0;
  const departureTotal: number = departurePricePerSeat * (departureSeats?.length || 0);
  const returnTotal: number = returnPricePerSeat * (returnSeats?.length || 0);
  const infantCount: number = passengers.filter(p => p.hasInfant).length;
  const infantTotal: number = infantCount * 100;
  const baseTotal: number = departureTotal + returnTotal + infantTotal;
  const [agent, setAgent] = useState<{ id: string; name: string; email: string } | null>(null);

  useEffect(() => {
    fetch("/api/agent/me")
      .then(async res => {
        if (res.ok) {
          const agentData = await res.json();
          setAgent(agentData); // agentData should include id, name, email
        } else {
          setAgent(null);
        }
      })
      .catch(() => setAgent(null));
  }, []);

  const agentDiscount: number = agent ? Math.round(baseTotal * 0.10) : 0;
  const finalTotal: number = baseTotal - agentDiscount;

  const departureOriginKey = ((departureBus?.routeOrigin || searchData.from || '') as string).toLowerCase().trim() || 'default';
  const departureDestinationKey = ((departureBus?.routeDestination || searchData.to || '') as string).toLowerCase().trim() || 'default';
  const departureOriginPoints = getBoardingPoints(departureOriginKey);
  const departureDestinationPoints = getBoardingPoints(departureDestinationKey);

  let returnOriginPoints: BoardingPoint[] = [];
  let returnDestinationPoints: BoardingPoint[] = [];

  if (returnBus || (returnSeats && returnSeats.length > 0)) {
    const returnOriginKey = ((returnBus?.routeOrigin || searchData.to || '') as string).toLowerCase().trim() || 'default';
    const returnDestinationKey = ((returnBus?.routeDestination || searchData.from || '') as string).toLowerCase().trim() || 'default';
    returnOriginPoints = getBoardingPoints(returnOriginKey);
    returnDestinationPoints = getBoardingPoints(returnDestinationKey);
  }

  const updatePassenger = (id: string, field: string, value: string | boolean) => {
    setPassengers(prev =>
      prev.map(passenger =>
        passenger.id === id ? { ...passenger, [field]: value } : passenger
      )
    );
  };

  const handleContactChange = (field: keyof ContactDetails, value: string) => {
    setContactDetails(prev => ({ ...prev, [field]: value }));
  };

  const handleEmergencyChange = (field: keyof EmergencyContact, value: string) => {
    setEmergencyContact(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (passengers.some(p => !p.firstName.trim() || !p.lastName.trim())) {
      alert('Please provide first and last names for all passengers');
      return;
    }
    if (!contactDetails.name || !contactDetails.email || !contactDetails.mobile) {
      alert('Please provide your name, email and mobile number');
      return;
    }
    if (!emergencyContact.name || !emergencyContact.phone) {
      alert('Please provide emergency contact details');
      return;
    }
    if (!departureBoardingPoint || !departureDroppingPoint) {
      alert('Please select departure boarding and dropping points');
      return;
    }
    if (returnBus && (!returnBoardingPoint || !returnDroppingPoint)) {
      alert('Please select return boarding and dropping points');
      return;
    }
    if (!agreedToTerms) {
      alert('Please agree to the terms and conditions');
      return;
    }
    if (
      passengers.some(
        (p) =>
          p.hasInfant &&
          (!p.infantBirthdate || !isValidInfant(p.infantBirthdate))
      )
    ) {
      alert("Each infant must have a valid birthdate and be less than 18 months old.");
      return;
    }
    onProceedToPayment();
  };

  const formatPoint = (point: string) => {
    if (point.trim().toLowerCase() === "or tambo" || point.trim().toLowerCase() === "or tambo airport") {
      return "OR Tambo Airport";
    }
    return point;
  };

  function isValidInfant(birthdate: string): boolean {
    if (!birthdate) return false;
    const birth = new Date(birthdate);
    const now = new Date();
    const months =
      (now.getFullYear() - birth.getFullYear()) * 12 +
      (now.getMonth() - birth.getMonth());
    // If the day of the month hasn't occurred yet, subtract one month
    if (now.getDate() < birth.getDate()) {
      return months - 1 < 18;
    }
    return months < 18;
  }

  return (
    <div className="max-w-6xl mx-auto my-8 px-4">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
        <div className="p-6 border-b bg-gradient-to-r from-gray-50 to-gray-100">
          <h2 className="text-xl font-bold text-gray-800">
            Passenger Details & Contact Information
          </h2>
          <p className="text-sm text-gray-600">
            Please provide details for all passengers and your contact information
          </p>
        </div>
        <div className="p-6 space-y-6">
          <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
            <h3 className="font-bold text-lg text-amber-800 mb-4">Fare Summary</h3>
            <div className="space-y-3">
              {departureBus && (
                <div className="flex justify-between border-b pb-2">
                  <div>
                    <p className="font-medium">Departure: {departureBus.routeOrigin} → {departureBus.routeDestination}</p>
                    <p className="text-sm text-gray-600">
                      {departureBus.departureDate ? format(new Date(departureBus.departureDate), "dd MMM yyyy") : 'N/A'} • {departureSeats?.length || 0} seat(s)
                    </p>
                  </div>
                  <p className="font-semibold">P {departureTotal.toFixed(2)}</p>
                </div>
              )}
              {returnBus && (
                <div className="flex justify-between border-b pb-2">
                  <div>
                    <p className="font-medium">Return: {returnBus.routeOrigin} → {returnBus.routeDestination}</p>
                    <p className="text-sm text-gray-600">
                      {returnBus.departureDate ? format(new Date(returnBus.departureDate), "dd MMM yyyy") : 'N/A'} • {returnSeats?.length || 0} seat(s)
                    </p>
                  </div>
                  <p className="font-semibold">P {returnTotal.toFixed(2)}</p>
                </div>
              )}
              {agent && (
                <div className="flex justify-between pt-2">
                  <p className="font-bold text-lg text-amber-700">Agent Discount (10%):</p>
                  <p className="font-bold text-amber-700">-P {agentDiscount.toFixed(2)}</p>
                </div>
              )}
              {infantCount > 0 && (
                <div className="flex justify-between pt-2">
                  <p className="font-bold text-lg text-blue-700">Infant Fare (P 100 x {infantCount}):</p>
                  <p className="font-bold text-blue-700">P {infantTotal.toFixed(2)}</p>
                </div>
              )}
              <div className="flex justify-between pt-2">
                <p className="font-bold text-lg">Grand Total:</p>
                <p className="font-bold text-teal-600 text-xl">P {finalTotal.toFixed(2)}</p>
              </div>
            </div>
          </div>
          <div className="border rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('passengers')}
              className="w-full p-4 bg-gray-50 text-left flex justify-between items-center"
            >
              <div className="flex items-center gap-4">
                <h3 className="font-bold text-lg text-gray-800">
                  Passenger Details ({passengers.length})
                </h3>
                {returnSeats.length > 0 && (
                  <Button
                    onClick={e => {
                      e.stopPropagation();
                      copyDepartureToReturn();
                    }}
                    className="ml-2 bg-amber-500 hover:bg-amber-600 text-white px-3 py-1 h-auto text-sm"
                    tabIndex={-1}
                  >
                    <Copy className="mr-2 h-4 w-4" /> Copy Departure Details to Return
                  </Button>
                )}
              </div>
              {openSections.passengers ? <ChevronUp /> : <ChevronDown />}
            </button>
            {openSections.passengers && (
              <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                {passengers.length > 0 ? (
                  passengers.map((passenger) => (
                    <div key={passenger.id} className="border rounded-lg p-4 bg-white">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-medium text-gray-700">Seat: {passenger.seatNumber}</span>
                        <span className={`text-sm px-2 py-1 rounded ${
                          passenger.isReturn
                            ? "bg-blue-100 text-blue-800"
                            : "bg-amber-100 text-amber-800"
                        }`}>
                          {passenger.isReturn ? 'Return' : 'Departure'}
                        </span>
                      </div>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <Select
                            value={passenger.title}
                            onValueChange={(value) => updatePassenger(passenger.id, 'title', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Title" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Mr">Mr</SelectItem>
                              <SelectItem value="Mrs">Mrs</SelectItem>
                              <SelectItem value="Miss">Miss</SelectItem>
                              <SelectItem value="Ms">Ms</SelectItem>
                              <SelectItem value="Dr">Dr</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            value={passenger.firstName}
                            onChange={(e) => updatePassenger(passenger.id, 'firstName', e.target.value)}
                            placeholder="First name"
                            required
                          />
                          <Input
                            value={passenger.lastName}
                            onChange={(e) => updatePassenger(passenger.id, 'lastName', e.target.value)}
                            placeholder="Last name"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Infant Details (if any)
                          </label>
                          <div className="flex gap-3">
                            <Checkbox
                              checked={!!passenger.hasInfant}
                              onCheckedChange={(checked) => updatePassenger(passenger.id, 'hasInfant', checked)}
                              className="h-6 w-6"
                            />
                            <span className="text-sm text-gray-600">
                              Check this box if you are bringing an infant
                            </span>
                          </div>
                          {passenger.hasInfant && (
                            <div className="grid grid-cols-1 gap-3">
                              <Input
                                type="date"
                                value={passenger.infantBirthdate}
                                onChange={(e) => updatePassenger(passenger.id, 'infantBirthdate', e.target.value)}
                                placeholder="Infant's Birthdate"
                                className="w-full"
                                required
                                max={new Date().toISOString().split("T")[0]}
                              />
                              {passenger.infantBirthdate && !isValidInfant(passenger.infantBirthdate) && (
                                <span className="text-xs text-red-600">
                                  Infant must be less than 18 months old.
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No passengers to display
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="border rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('contact')}
              className="w-full p-4 bg-gray-50 text-left flex justify-between items-center"
            >
              <h3 className="font-bold text-lg text-gray-800">CardHolder Details</h3>
              {openSections.contact ? <ChevronUp /> : <ChevronDown />}
            </button>
            {openSections.contact && (
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    value={contactDetails.name}
                    onChange={(e) => handleContactChange('name', e.target.value)}
                    placeholder="Your Name"
                    className="w-full"
                  />
                  <Input
                    type="email"
                    value={contactDetails.email}
                    onChange={(e) => handleContactChange('email', e.target.value)}
                    placeholder="Email"
                    className="w-full"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    type="tel"
                    value={contactDetails.mobile}
                    onChange={(e) => handleContactChange('mobile', e.target.value)}
                    placeholder="Mobile"
                    className="w-full"
                  />
                  <Input
                    type="tel"
                    value={contactDetails.alternateMobile}
                    onChange={(e) => handleContactChange('alternateMobile', e.target.value)}
                    placeholder="Alternate Mobile"
                    className="w-full"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    value={contactDetails.idType}
                    onValueChange={(value) => handleContactChange('idType', value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="ID Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Passport">Passport</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    value={contactDetails.idNumber}
                    onChange={(e) => handleContactChange('idNumber', e.target.value)}
                    placeholder="Passport Number"
                  />
                </div>
              </div>
            )}
          </div>
          <div className="border rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('emergency')}
              className="w-full p-4 bg-gray-50 text-left flex justify-between items-center"
            >
              <h3 className="font-bold text-lg text-gray-800">Emergency Contact</h3>
              {openSections.emergency ? <ChevronUp /> : <ChevronDown />}
            </button>
            {openSections.emergency && (
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  value={emergencyContact.name}
                  onChange={(e) => handleEmergencyChange('name', e.target.value)}
                  placeholder="Name"
                />
                <Input
                  type="tel"
                  value={emergencyContact.phone}
                  onChange={(e) => handleEmergencyChange('phone', e.target.value)}
                  placeholder="Phone Number"
                />
              </div>
            )}
          </div>
          <div className="border rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('points')}
              className="w-full p-4 bg-gray-50 text-left flex justify-between items-center"
            >
              <h3 className="font-bold text-lg text-gray-800">Trip Points</h3>
              {openSections.points ? <ChevronUp /> : <ChevronDown />}
            </button>
            {openSections.points && (
              <div className="p-4 space-y-6">
                <div>
                  <h4 className="font-bold text-gray-700 mb-3">Departure Trip Points</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Boarding Point
                      </label>
                      <select
                        value={departureBoardingPoint}
                        onChange={(e) => setDepartureBoardingPoint(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                      >
                        <option value="">Select boarding point</option>
                        {departureOriginPoints.map((point) => (
                          <option key={point.id} value={point.name}>
                            {formatPoint(point.name)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Dropping Point
                      </label>
                      <select
                        value={departureDroppingPoint}
                        onChange={(e) => setDepartureDroppingPoint(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                      >
                        <option value="">Select dropping point</option>
                        {departureDestinationPoints.map((point) => (
                          <option key={point.id} value={point.name}>
                          {formatPoint(point.name)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                {returnBus && (
                  <div>
                    <h4 className="font-bold text-gray-700 mb-3">Return Trip Points</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Boarding Point
                        </label>
                        <select
                          value={returnBoardingPoint}
                          onChange={(e) => setReturnBoardingPoint(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                        >
                          <option value="">Select boarding point</option>
                          {returnOriginPoints.map((point) => (
                            <option key={point.id} value={point.name}>
                            {formatPoint(point.name)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Dropping Point
                        </label>
                        <select
                          value={returnDroppingPoint}
                          onChange={(e) => setReturnDroppingPoint(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                        >
                          <option value="">Select dropping point</option>
                          {returnDestinationPoints.map((point) => (
                            <option key={point.id} value={point.name}>
                            {formatPoint(point.name)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="border rounded-lg p-4 bg-white">
            <h3 className="font-bold text-gray-800 mb-3">Payment Mode</h3>
            <div>
              <Select
                value={paymentMode}
                onValueChange={setPaymentMode}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Credit Card">Credit Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-start space-x-2 pt-2 bg-gray-50 p-4 rounded-lg">
            <Checkbox
              id="terms"
              checked={agreedToTerms}
              onCheckedChange={(checked) => {
                setAgreedToTerms(!!checked);
                if (checked) setShowPolicyModal(true);
              }}
            />
            <label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              By continuing you agree to our <span className="underline text-teal-700 cursor-pointer" onClick={() => setShowPolicyModal(true)}>TERMS & CONDITIONS</span> and Cancellation Policies
            </label>
          </div>
          <Button
            onClick={() => {
              if (!policyAccepted) {
                setShowPolicyModal(true);
                return;
              }
              handleSubmit();
            }}
            disabled={!agreedToTerms}
            className="w-full h-14 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg text-lg"
          >
            Pay (P {finalTotal.toFixed(2)})
          </Button>
        </div>
      </div>
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Complete Your Booking</DialogTitle>
          </DialogHeader>
          {departureBus && (
            <PaymentGateway
              bookingData={{
                orderId: generateOrderId(), // <-- always 6 digits with RT prefix
                tripId: departureBus?.id,
                totalPrice: finalTotal,
                discountAmount: agentDiscount,
                selectedSeats: [...(departureSeats || []), ...(returnSeats || [])],
                departureSeats,
                returnSeats,
                passengers: passengers.map(p => ({
                  firstName: p.firstName,
                  lastName: p.lastName,
                  seatNumber: p.seatNumber,
                  title: p.title,
                  isReturn: p.isReturn,
                  hasInfant: !!p.hasInfant,
                  infantBirthdate: p.infantBirthdate || null,
                })),
                userName: contactDetails.name,
                userEmail: contactDetails.email,
                userPhone: contactDetails.mobile,
                boardingPoint: departureBoardingPoint,
                droppingPoint: departureDroppingPoint,
                contactDetails,
                emergencyContact,
                paymentMode,
                returnTripId: returnBus?.id,
                returnBoardingPoint,
                returnDroppingPoint,
                agentId: agent?.id,
              }}
              onPaymentComplete={onPaymentComplete}
              setShowPayment={setShowPayment}
            />
          )}
        </DialogContent>
      </Dialog>
      <PolicyModal
        isOpen={showPolicyModal}
        onClose={() => setShowPolicyModal(false)}
        onAgree={() => {
          setPolicyAccepted(true);
          setShowPolicyModal(false);
        }}
        agreed={policyAccepted}
        setAgreed={setPolicyAccepted}
      />
    </div>
  );
}
