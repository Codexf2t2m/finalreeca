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

type PassengerType = "adult" | "child";
interface Passenger {
  type: PassengerType;
  id: string;
  title: string;
  firstName: string;
  lastName: string;
  seatNumber: string;
  isReturn: boolean;
  hasInfant?: boolean;
  infantName?: string;
  infantPassportNumber?: string;
  infantBirthdate?: string;
  birthdate: string;
  passportNumber: string;
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
    return <div className="text-center py-8 text-gray-600">Loading form data...</div>;
  }

  const [passengers, setPassengers] = useState<Passenger[]>(() => {
    const departurePassengers = (departureSeats || []).map(seat => ({
      id: `departure-${seat}`,
      type: "adult" as PassengerType,
      title: 'Mr',
      firstName: '',
      lastName: '',
      seatNumber: seat,
      isReturn: false,
      birthdate: '',
      passportNumber: '',
      hasInfant: false,
      infantBirthdate: '',
      infantName: '',
      infantPassportNumber: ''
    }));
    const returnPassengers = (returnSeats || []).map(seat => ({
      id: `return-${seat}`,
      type: "adult" as PassengerType,
      title: 'Mr',
      firstName: '',
      lastName: '',
      seatNumber: seat,
      isReturn: true,
      birthdate: '',
      passportNumber: '',
      hasInfant: false,
      infantBirthdate: '',
      infantName: '',
      infantPassportNumber: ''
    }));
    return [...departurePassengers, ...returnPassengers];
  });

  useEffect(() => {
    const departurePassengers = (departureSeats || []).map(seat => {
      const existing = passengers.find(p => p.seatNumber === seat && !p.isReturn);
      return {
        id: `departure-${seat}`,
        type: existing?.type || "adult",
        firstName: existing?.firstName || "",
        lastName: existing?.lastName || "",
        seatNumber: seat,
        title: existing?.title || "Mr",
        isReturn: false,
        birthdate: existing?.birthdate || "",
        passportNumber: existing?.passportNumber || "",
        hasInfant: existing?.hasInfant || false,
        infantBirthdate: existing?.infantBirthdate || "",
        infantName: existing?.infantName || "",
        infantPassportNumber: existing?.infantPassportNumber || ""
      };
    });
    const returnPassengers = (returnSeats || []).map(seat => {
      const existing = passengers.find(p => p.seatNumber === seat && p.isReturn);
      return {
        id: `return-${seat}`,
        type: existing?.type || "adult",
        firstName: existing?.firstName || "",
        lastName: existing?.lastName || "",
        seatNumber: seat,
        title: existing?.title || "Mr",
        isReturn: true,
        birthdate: existing?.birthdate || "",
        passportNumber: existing?.passportNumber || "",
        hasInfant: existing?.hasInfant || false,
        infantBirthdate: existing?.infantBirthdate || "",
        infantName: existing?.infantName || "",
        infantPassportNumber: existing?.infantPassportNumber || ""
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

  const departurePricePerSeat = departureBus?.fare || 0;

  const getPassengerFare = (p: Passenger) => {
    if (!p.birthdate) return departurePricePerSeat;
    const age = Math.floor((new Date().getTime() - new Date(p.birthdate).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    if (age < 2) return 250;
    if (age < 5) return 400;
    return departurePricePerSeat;
  };

  const infantCount = passengers.filter(p => p.hasInfant).length;
  const infantTotal = infantCount * 100;

  const departureTotal = passengers
    .filter(p => !p.isReturn)
    .reduce((sum, p) => sum + getPassengerFare(p), 0);

  const returnTotal = passengers
    .filter(p => p.isReturn)
    .reduce((sum, p) => sum + getPassengerFare(p), 0);

  const baseTotal = departureTotal + returnTotal + infantTotal;
  const [agent, setAgent] = useState<{ id: string; name: string; email: string } | null>(null);

  useEffect(() => {
    fetch("/api/agent/me")
      .then(async res => {
        if (res.ok) {
          const agentData = await res.json();
          setAgent(agentData);
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
    if (now.getDate() < birth.getDate()) {
      return months - 1 < 18;
    }
    return months < 18;
  }

  return (
    <div className="max-w-6xl mx-auto my-8 px-4 font-sans">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        {/* Header with gradient */}
        <div className="p-6 border-b bg-gradient-to-r from-[#009393] to-[#0a6e6e]">
          <h2 className="text-2xl font-bold text-white tracking-wide">
            Passenger Details & Contact Information
          </h2>
          <p className="text-sm text-white/90 mt-1">
            Please provide details for all passengers and your contact information
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Fare Summary Card */}
          <div className="bg-gray-50 rounded-lg p-5 border border-gray-200 shadow-sm">
            <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center">
              <span className="bg-[#009393] text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 text-sm">1</span>
              Fare Summary
            </h3>
            <div className="space-y-3">
              {departureBus && (
                <div className="flex justify-between border-b pb-2">
                  <div>
                    <p className="font-medium text-gray-700">Departure: {departureBus.routeOrigin} → {departureBus.routeDestination}</p>
                    <p className="text-sm text-gray-500">
                      {departureBus.departureDate ? format(new Date(departureBus.departureDate), "dd MMM yyyy") : 'N/A'} • {departureSeats?.length || 0} seat(s)
                    </p>
                  </div>
                  <p className="font-semibold text-[#009393]">P {departureTotal.toFixed(2)}</p>
                </div>
              )}
              {returnBus && (
                <div className="flex justify-between border-b pb-2">
                  <div>
                    <p className="font-medium text-gray-700">Return: {returnBus.routeOrigin} → {returnBus.routeDestination}</p>
                    <p className="text-sm text-gray-500">
                      {returnBus.departureDate ? format(new Date(returnBus.departureDate), "dd MMM yyyy") : 'N/A'} • {returnSeats?.length || 0} seat(s)
                    </p>
                  </div>
                  <p className="font-semibold text-[#009393]">P {returnTotal.toFixed(2)}</p>
                </div>
              )}
              {agent && (
                <div className="flex justify-between pt-2">
                  <p className="font-medium text-gray-700">Agent Discount (10%):</p>
                  <p className="font-medium text-[#009393]">-P {agentDiscount.toFixed(2)}</p>
                </div>
              )}
              {infantCount > 0 && (
                <div className="flex justify-between pt-2">
                  <p className="font-medium text-gray-700">Infant Fare (P 100 x {infantCount}):</p>
                  <p className="font-medium text-[#009393]">P {infantTotal.toFixed(2)}</p>
                </div>
              )}
              <div className="flex justify-between pt-3 border-t border-gray-200 mt-2">
                <p className="font-bold text-lg text-gray-800">Grand Total:</p>
                <p className="font-bold text-[#009393] text-xl">P {finalTotal.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Passenger Details Section */}
          <div className="border rounded-lg overflow-hidden border-gray-200">
            <button
              onClick={() => toggleSection('passengers')}
              className="w-full p-4 bg-gray-50 hover:bg-gray-100 text-left flex justify-between items-center transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="bg-[#009393] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">2</span>
                <h3 className="font-bold text-lg text-gray-800">
                  Passenger Details ({passengers.length})
                </h3>
                {returnSeats.length > 0 && (
                  <Button
                    onClick={e => {
                      e.stopPropagation();
                      copyDepartureToReturn();
                    }}
                    className="ml-2 bg-[#009393]/10 hover:bg-[#009393]/20 text-[#009393] px-3 py-1 h-auto text-sm border border-[#009393]/30"
                    tabIndex={-1}
                  >
                    <Copy className="mr-2 h-4 w-4" /> Copy Departure Details to Return
                  </Button>
                )}
              </div>
              {openSections.passengers ? <ChevronUp className="text-gray-500" /> : <ChevronDown className="text-gray-500" />}
            </button>
            {openSections.passengers && (
              <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
                {passengers.length > 0 ? (
                  passengers.map((passenger, idx) => {
                    const isChild = passenger.type === "child";
                    return (
                      <div key={passenger.id} className="border rounded-lg p-4 bg-white shadow-sm">
                        <div className="flex items-center gap-4 mb-3">
                          <span className="font-medium text-gray-700 bg-gray-100 px-3 py-1 rounded-full text-sm">
                            Seat: {passenger.seatNumber}
                          </span>
                          <Select
                            value={passenger.type || "adult"}
                            onValueChange={value => updatePassenger(passenger.id, "type", value)}
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Passenger Type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="adult">Adult (above 5 yrs)</SelectItem>
                              <SelectItem value="child">Child (2-5 yrs)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
                            <Input
                              value={passenger.firstName}
                              onChange={e => updatePassenger(passenger.id, "firstName", e.target.value)}
                              placeholder="First name"
                              required
                              className="focus:ring-[#009393] focus:border-[#009393]"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
                            <Input
                              value={passenger.lastName}
                              onChange={e => updatePassenger(passenger.id, "lastName", e.target.value)}
                              placeholder="Last name"
                              required
                              className="focus:ring-[#009393] focus:border-[#009393]"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Birthdate</label>
                            <Input
                              type="date"
                              value={passenger.birthdate || ""}
                              onChange={e => updatePassenger(passenger.id, "birthdate", e.target.value)}
                              placeholder="Birthdate"
                              required
                              className="focus:ring-[#009393] focus:border-[#009393]"
                              max={new Date().toISOString().split("T")[0]}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {isChild ? "Birth Certificate Number" : "Passport Number"}
                            </label>
                            <Input
                              value={passenger.passportNumber || ""}
                              onChange={e => updatePassenger(passenger.id, "passportNumber", e.target.value)}
                              placeholder={isChild ? "Birth Certificate Number" : "Passport Number"}
                              required
                              className="focus:ring-[#009393] focus:border-[#009393]"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-4">
                          <Checkbox
                            id={`infant-${passenger.id}`}
                            checked={!!passenger.hasInfant}
                            onCheckedChange={checked => updatePassenger(passenger.id, "hasInfant", checked)}
                            className="border-gray-300 data-[state=checked]:bg-[#009393] data-[state=checked]:border-[#009393]"
                          />
                          <label htmlFor={`infant-${passenger.id}`} className="text-sm text-gray-600">
                            Bringing an infant (0-2 yrs, sits on lap)
                          </label>
                        </div>
                        {passenger.hasInfant && (
                          <div className="mt-4 p-4 rounded bg-[#009393]/5 border border-[#009393]/20">
                            <h4 className="font-medium text-[#009393] mb-3">Infant Details</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Infant's Name</label>
                                <Input
                                  value={passenger.infantName || ""}
                                  onChange={e => updatePassenger(passenger.id, "infantName", e.target.value)}
                                  placeholder="Infant's Name"
                                  required
                                  className="focus:ring-[#009393] focus:border-[#009393]"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Infant's Birthdate</label>
                                <Input
                                  type="date"
                                  value={passenger.infantBirthdate || ""}
                                  onChange={e => updatePassenger(passenger.id, "infantBirthdate", e.target.value)}
                                  placeholder="Infant's Birthdate"
                                  required
                                  className="focus:ring-[#009393] focus:border-[#009393]"
                                  max={new Date().toISOString().split("T")[0]}
                                />
                              </div>
                            </div>
                            <div className="mt-4">
                              <label className="block text-sm font-medium text-gray-700 mb-1">Birth Certificate Number</label>
                              <Input
                                value={passenger.infantPassportNumber || ""}
                                onChange={e => updatePassenger(passenger.id, "infantPassportNumber", e.target.value)}
                                placeholder="Birth Certificate Number"
                                required
                                className="focus:ring-[#009393] focus:border-[#009393]"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No passengers to display
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Contact Details Section */}
          <div className="border rounded-lg overflow-hidden border-gray-200">
            <button
              onClick={() => toggleSection('contact')}
              className="w-full p-4 bg-gray-50 hover:bg-gray-100 text-left flex justify-between items-center transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="bg-[#009393] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">3</span>
                <h3 className="font-bold text-lg text-gray-800">CardHolder Details</h3>
              </div>
              {openSections.contact ? <ChevronUp className="text-gray-500" /> : <ChevronDown className="text-gray-500" />}
            </button>
            {openSections.contact && (
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                    <Input
                      value={contactDetails.name}
                      onChange={(e) => handleContactChange('name', e.target.value)}
                      placeholder="Your Name"
                      className="w-full focus:ring-[#009393] focus:border-[#009393]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <Input
                      type="email"
                      value={contactDetails.email}
                      onChange={(e) => handleContactChange('email', e.target.value)}
                      placeholder="Email"
                      className="w-full focus:ring-[#009393] focus:border-[#009393]"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                    <Input
                      type="tel"
                      value={contactDetails.mobile}
                      onChange={(e) => handleContactChange('mobile', e.target.value)}
                      placeholder="Mobile"
                      className="w-full focus:ring-[#009393] focus:border-[#009393]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Alternate Mobile</label>
                    <Input
                      type="tel"
                      value={contactDetails.alternateMobile}
                      onChange={(e) => handleContactChange('alternateMobile', e.target.value)}
                      placeholder="Alternate Mobile"
                      className="w-full focus:ring-[#009393] focus:border-[#009393]"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ID Type</label>
                    <Select
                      value={contactDetails.idType}
                      onValueChange={(value) => handleContactChange('idType', value)}
                      required
                    >
                      <SelectTrigger className="focus:ring-[#009393] focus:border-[#009393]">
                        <SelectValue placeholder="ID Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Passport">Passport</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Passport Number</label>
                    <Input
                      value={contactDetails.idNumber}
                      onChange={(e) => handleContactChange('idNumber', e.target.value)}
                      placeholder="Passport Number"
                      className="focus:ring-[#009393] focus:border-[#009393]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Emergency Contact Section */}
          <div className="border rounded-lg overflow-hidden border-gray-200">
            <button
              onClick={() => toggleSection('emergency')}
              className="w-full p-4 bg-gray-50 hover:bg-gray-100 text-left flex justify-between items-center transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="bg-[#009393] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">4</span>
                <h3 className="font-bold text-lg text-gray-800">Emergency Contact</h3>
              </div>
              {openSections.emergency ? <ChevronUp className="text-gray-500" /> : <ChevronDown className="text-gray-500" />}
            </button>
            {openSections.emergency && (
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <Input
                    value={emergencyContact.name}
                    onChange={(e) => handleEmergencyChange('name', e.target.value)}
                    placeholder="Name"
                    className="focus:ring-[#009393] focus:border-[#009393]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <Input
                    type="tel"
                    value={emergencyContact.phone}
                    onChange={(e) => handleEmergencyChange('phone', e.target.value)}
                    placeholder="Phone Number"
                    className="focus:ring-[#009393] focus:border-[#009393]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Trip Points Section */}
          <div className="border rounded-lg overflow-hidden border-gray-200">
            <button
              onClick={() => toggleSection('points')}
              className="w-full p-4 bg-gray-50 hover:bg-gray-100 text-left flex justify-between items-center transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="bg-[#009393] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">5</span>
                <h3 className="font-bold text-lg text-gray-800">Trip Points</h3>
              </div>
              {openSections.points ? <ChevronUp className="text-gray-500" /> : <ChevronDown className="text-gray-500" />}
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
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#009393] focus:border-[#009393]"
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
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#009393] focus:border-[#009393]"
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
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#009393] focus:border-[#009393]"
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
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#009393] focus:border-[#009393]"
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

          {/* Payment Mode Section */}
          <div className="border rounded-lg p-5 bg-gray-50 border-gray-200">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center">
              <span className="bg-[#009393] text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 text-sm">6</span>
              Payment Mode
            </h3>
            <div>
              <Select
                value={paymentMode}
                onValueChange={setPaymentMode}
                required
              >
                <SelectTrigger className="focus:ring-[#009393] focus:border-[#009393]">
                  <SelectValue placeholder="Select payment mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Credit Card">Credit Card | Debit Card | Net Banking | Visa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="flex items-start space-x-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <Checkbox
              id="terms"
              checked={agreedToTerms}
              onCheckedChange={(checked) => {
                setAgreedToTerms(!!checked);
                if (checked) setShowPolicyModal(true);
              }}
              className="border-gray-300 data-[state=checked]:bg-[#009393] data-[state=checked]:border-[#009393] mt-1"
            />
            <label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-700">
              By continuing you agree to our <span className="underline text-[#009393] cursor-pointer hover:text-[#007575]" onClick={() => setShowPolicyModal(true)}>TERMS & CONDITIONS</span> and Cancellation Policies
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
            className="w-full h-14 bg-[#009393] hover:bg-[#958c55] text-white font-semibold rounded-xl text-lg transition-colors"
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
