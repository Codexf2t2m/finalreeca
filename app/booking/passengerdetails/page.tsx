'use client'
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, ChevronUp, Copy, Luggage, ShoppingBag, Shield, Car, Info } from "lucide-react";
import { SearchData, BoardingPoint } from "@/lib/types";
import { format } from "date-fns";
import { PolicyModal } from "@/components/PolicyModal";
import PaymentGateway from "../paymentgateway";

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
  addons: boolean;
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

const ADDONS = [
  {
    key: "extraBaggage",
    label: "Extra Baggage",
    description: "Additional baggage allowance for your trip.",
    price: 300,
    icon: <Luggage className="h-5 w-5 text-[#ffc721]" />,
  },
  {
    key: "wimpyMeal",
    label: "Wimpy Meal",
    description: "Delicious Wimpy meal for your journey available from Gaborone only.",
    price: 60,
    icon: <ShoppingBag className="h-5 w-5 text-[#ffc721]" />,
  },
  {
    key: "travelInsurance",
    label: "Add Travel Insurance",
    description: "Comprehensive travel insurance coverage.",
    price: 150,
    icon: <Shield className="h-5 w-5 text-[#ffc721]" />,
  },
  {
    key: "winCarCompetition",
    label: "Win a Car Competition",
    description: "Enter our exciting car competition at no extra cost!",
    price: 0,
    icon: <Car className="h-5 w-5 text-[#ffc721]" />,
  },
];

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
  const isRoundTrip = !!returnBus;
  const [selectedAddons, setSelectedAddons] = useState<{ [key: string]: { departure: boolean; return: boolean } }>({});
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
    points: true,
    addons: true
  });

  const [agent, setAgent] = useState<{ id: string; name: string; email: string } | null>(null);
  const [consultant, setConsultant] = useState<{ id: string; name: string; email: string } | null>(null);
  const [infantFare, setInfantFare] = useState(250);
  const [childFare, setChildFare] = useState(400);
  const [showInsuranceInfo, setShowInsuranceInfo] = useState(false);

  const getAddonsTotal = () => {
    let total = 0;
    const departurePassengers = passengers.filter(p => !p.isReturn);
    const returnPassengers = passengers.filter(p => p.isReturn);
    ADDONS.forEach(addon => {
      if (selectedAddons[addon.key]?.departure) {
        total += addon.price * departurePassengers.length;
      }
      if (isRoundTrip && selectedAddons[addon.key]?.return) {
        total += addon.price * returnPassengers.length;
      }
    });
    return total;
  };

  const openOnlySection = (section: keyof SectionState) => {
    setOpenSections(prev => {
      const newState: SectionState = { ...prev };
      Object.keys(newState).forEach(key => {
        newState[key as keyof SectionState] = key === section;
      });
      return newState;
    });
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
            lastName: departurePassengers[index].lastName,
            passportNumber: departurePassengers[index].passportNumber,
            birthdate: departurePassengers[index].birthdate,
            type: departurePassengers[index].type,
            hasInfant: departurePassengers[index].hasInfant,
            infantName: departurePassengers[index].infantName,
            infantBirthdate: departurePassengers[index].infantBirthdate,
            infantPassportNumber: departurePassengers[index].infantPassportNumber,
          };
        }
      }
      return passenger;
    });
    setPassengers(updatedPassengers);
  };

  const departurePricePerSeat = departureBus?.fare || 0;

  const getPassengerFare = (p: Passenger) => {
    if (p.type === "child") return childFare;
    return departurePricePerSeat;
  };

  const infantCount = passengers.filter(p => p.hasInfant).length;
  const infantTotal = infantCount * infantFare;
  const departureTotal = passengers.filter(p => !p.isReturn).reduce((sum, p) => sum + getPassengerFare(p), 0);
  const returnTotal = passengers.filter(p => p.isReturn).reduce((sum, p) => sum + getPassengerFare(p), 0);
  const baseTotal = departureTotal + returnTotal + infantTotal + getAddonsTotal();

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

  useEffect(() => {
    fetch("/api/consultant/me")
      .then(async res => {
        if (res.ok) {
          const consultantData = await res.json();
          setConsultant(consultantData);
        } else {
          setConsultant(null);
        }
      })
      .catch(() => setConsultant(null));
  }, []);

  useEffect(() => {
    fetch("/api/getfareprices")
      .then(res => res.json())
      .then(data => {
        setInfantFare(data.infant ?? 250);
        setChildFare(data.child ?? 400);
      });
  }, []);

  const agentDiscount: number = agent ? Math.round(baseTotal * 0.10) : 0;
  const finalTotal: number = baseTotal - agentDiscount;

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

  const departureOriginKey = ((departureBus?.routeOrigin || searchData.from || '') as string).toLowerCase().trim() || 'default';
  const departureDestinationKey = ((departureBus?.routeDestination || searchData.to || '') as string).toLowerCase().trim() || 'default';
  const departureOriginPoints = getBoardingPoints(departureOriginKey);
  const departureDestinationPoints = getBoardingPoints(departureDestinationKey);

  let returnOriginPoints: BoardingPoint[] = [];
  let returnDestinationPoints: BoardingPoint[] = [];

  if (isRoundTrip) {
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

  const handleAddonChange = (addonKey: string, tripType: "departure" | "return", checked: boolean) => {
    setSelectedAddons(prev => ({
      ...prev,
      [addonKey]: {
        ...prev[addonKey],
        [tripType]: checked,
      }
    }));
  };

  const handleSubmit = () => {
    console.log("\n===== [FORM] SUBMITTING PASSENGER DATA =====");
    console.log("Passengers:", JSON.stringify(passengers, null, 2));
    console.log("Contact Details:", JSON.stringify(contactDetails, null, 2));
    console.log("Emergency Contact:", JSON.stringify(emergencyContact, null, 2));
    console.log("Boarding Points:", {
      departure: departureBoardingPoint,
      return: returnBoardingPoint
    });
    console.log("Addons:", JSON.stringify(selectedAddons, null, 2));
    console.log("==========================================\n");

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

    if (isRoundTrip && (!returnBoardingPoint || !returnDroppingPoint)) {
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
          (p.type === "child" && !isValidChild(p.birthdate)) ||
          (p.hasInfant && !isValidInfant(p.infantBirthdate || ""))
      )
    ) {
      alert("Children must be 2-11 years old. Infants must be under 2 years old.");
      return;
    }

    onProceedToPayment();
  };

  const formatPoint = (point: string) => {
    if (point.trim().toLowerCase() === "or tambo" || point.trim().toLowerCase() === "or tambo airport") {
      return "OR Tambo Airport Bus Terminal";
    }
    return point;
  };


  function isValidChild(birthdate: string): boolean {
    if (!birthdate) return false;
    const birth = new Date(birthdate);
    const now = new Date();
    const age = (now.getTime() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    return age >= 2 && age < 11;
  }

  function isValidInfant(birthdate: string): boolean {
    if (!birthdate) return false;
    const birth = new Date(birthdate);
    const now = new Date();
    const age = (now.getTime() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    return age >= 0 && age < 2;
  }

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

  useEffect(() => {
    if (showPayment && departureBus) {
      console.log("\n===== [FORM] SENDING TO PAYMENT GATEWAY =====");
      const bookingData = {
        orderId: generateOrderId(),
        tripId: departureBus?.id,
        totalPrice: finalTotal,
        discountAmount: agentDiscount,
        selectedSeats: [...(departureSeats || []), ...(returnSeats || [])],
        departureSeats,
        returnSeats,
        addons: selectedAddons,
        passengers: passengers.map(p => ({
          firstName: p.firstName,
          lastName: p.lastName,
          seatNumber: p.seatNumber,
          title: p.title,
          isReturn: p.isReturn,
          hasInfant: !!p.hasInfant,
          infantBirthdate: p.infantBirthdate || null,
          type: p.type,
          birthdate: p.birthdate || null,
          passportNumber: p.passportNumber || null,
          infantName: p.infantName || null,
          infantPassportNumber: p.infantPassportNumber || null,
        })),
        userName: contactDetails.name,
        userEmail: contactDetails.email,
        userPhone: contactDetails.mobile,
        boardingPoint: departureBoardingPoint,
        droppingPoint: departureDroppingPoint,
        contactDetails,
        emergencyContact: {
          name: emergencyContact.name,
          phone: emergencyContact.phone,
        },
        paymentMode,
        returnTripId: returnBus?.id,
        returnBoardingPoint,
        returnDroppingPoint,
        agentId: agent?.id,
        consultantId: consultant?.id,
      };
      console.log("Full booking data:", JSON.stringify(bookingData, null, 2));
      console.log("==============================================\n");
    }
  }, [showPayment]);

  if (!boardingPoints || !departureBus || !searchData) {
    return <div className="text-center py-8 text-gray-600">Loading form data...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto my-4 sm:my-8 px-3 sm:px-4 font-sans">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        <div className="p-4 sm:p-6 border-b" style={{ backgroundColor: 'rgb(0, 153, 153)' }}>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
            Passenger Details & Contacts
          </h2>
          <p className="text-sm text-white/90 mt-1">
            Please provide details for all passengers and your contact information
          </p>
        </div>
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="bg-gray-50 rounded-lg p-4 sm:p-5 border border-gray-200 shadow-sm">
            <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center">
              <span className="bg-[rgb(0,153,153)] text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 text-sm">1</span>
              Fare Summary
            </h3>
            <div className="space-y-3">
              {departureBus && (
                <div className="flex flex-col sm:flex-row sm:justify-between border-b pb-2">
                  <div className="mb-2 sm:mb-0">
                    <p className="font-medium text-gray-700 text-sm sm:text-base">Departure: {departureBus.routeOrigin} → {departureBus.routeDestination}</p>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {departureBus.departureDate ? format(new Date(departureBus.departureDate), "dd MMM yyyy") : 'N/A'} • {departureSeats?.length || 0} seat(s)
                    </p>
                  </div>
                  <p className="font-semibold text-[rgb(0,153,153)] text-sm sm:text-base">P {departureTotal.toFixed(2)}</p>
                </div>
              )}
              {returnBus && (
                <div className="flex flex-col sm:flex-row sm:justify-between border-b pb-2">
                  <div className="mb-2 sm:mb-0">
                    <p className="font-medium text-gray-700 text-sm sm:text-base">Return: {returnBus.routeOrigin} → {returnBus.routeDestination}</p>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {returnBus.departureDate ? format(new Date(returnBus.departureDate), "dd MMM yyyy") : 'N/A'} • {returnSeats?.length || 0} seat(s)
                    </p>
                  </div>
                  <p className="font-semibold text-[rgb(0,153,153)] text-sm sm:text-base">P {returnTotal.toFixed(2)}</p>
                </div>
              )}
              {passengers.filter(p => p.type === "child").length > 0 && (
                <div className="flex justify-between pt-2">
                  <p className="font-medium text-gray-700 text-sm sm:text-base">Child Fare ({passengers.filter(p => p.type === "child").length}):</p>
                  <p className="font-medium text-[rgb(0,153,153)] text-sm sm:text-base">P {passengers.filter(p => p.type === "child").length * childFare}</p>
                </div>
              )}
              {infantCount > 0 && (
                <div className="flex justify-between pt-2">
                  <p className="font-medium text-gray-700 text-sm sm:text-base">Infant Fare ({infantCount}):</p>
                  <p className="font-medium text-[rgb(0,153,153)] text-sm sm:text-base">P {infantTotal.toFixed(2)}</p>
                </div>
              )}
              {Object.entries(selectedAddons).map(([key, value]) => {
                const addon = ADDONS.find(a => a.key === key);
                if (addon && (value.departure || value.return)) {
                  const addonTotal = addon.price * (value.departure ? passengers.filter(p => !p.isReturn).length : 0) +
                                     (isRoundTrip && value.return ? addon.price * passengers.filter(p => p.isReturn).length : 0);
                  return (
                    <div key={key} className="flex justify-between pt-2">
                      <p className="font-medium text-gray-700 text-sm sm:text-base">{addon.label}:</p>
                      <p className="font-medium text-[rgb(0,153,153)] text-sm sm:text-base">P {addonTotal.toFixed(2)}</p>
                    </div>
                  );
                }
                return null;
              })}
              {agent && (
                <div className="flex justify-between pt-2">
                  <p className="font-medium text-gray-700 text-sm sm:text-base">Agent Discount (10%):</p>
                  <p className="font-medium text-[rgb(0,153,153)] text-sm sm:text-base">-P {agentDiscount.toFixed(2)}</p>
                </div>
              )}
              <div className="flex justify-between pt-3 border-t-2 border-gray-200 mt-2">
                <p className="font-bold text-base sm:text-lg text-gray-800">Grand Total:</p>
                <p className="font-bold text-[rgb(0,153,153)] text-lg sm:text-xl">P {finalTotal.toFixed(2)}</p>
              </div>
            </div>
          </div>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => openOnlySection('passengers')}
              className="w-full p-4 bg-gray-50 hover:bg-gray-100 text-left flex flex-col sm:flex-row sm:justify-between sm:items-center transition-colors"
            >
              <div className="flex items-center gap-3 mb-2 sm:mb-0">
                <span className="bg-[rgb(0,153,153)] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">2</span>
                <h3 className="font-bold text-lg text-gray-800">
                  Passenger Details ({passengers.length})
                </h3>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                {returnSeats.length > 0 && (
                  <Button
                    onClick={e => {
                      e.stopPropagation();
                      copyDepartureToReturn();
                    }}
                    className="bg-[rgb(255,199,33)] hover:bg-[rgb(255,219,33)] text-white px-3 py-1 h-auto text-xs sm:text-sm border border-[rgb(255,199,33)] w-full sm:w-auto"
                    tabIndex={-1}
                  >
                    <Copy className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Copy to Return
                  </Button>
                )}
                {openSections.passengers ? <ChevronUp className="text-gray-500 mt-1 sm:mt-0" /> : <ChevronDown className="text-gray-500 mt-1 sm:mt-0" />}
              </div>
            </button>
            {openSections.passengers && (
              <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
                {passengers.length > 0 ? (
                  passengers.map((passenger, idx) => {
                    const isChild = passenger.type === "child";
                    return (
                      <div key={passenger.id} className="border border-gray-200 rounded-lg p-3 sm:p-4 bg-white shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3">
                          <span className={`font-medium text-white px-3 py-1 rounded-full text-sm w-fit ${passenger.isReturn ? 'bg-[rgb(148,138,84)]' : 'bg-[rgb(255,199,33)]'}`}>
                            {passenger.isReturn ? 'Return Seat' : 'Departure Seat'}: {passenger.seatNumber}
                          </span>
                          <Select
                            value={passenger.type || "adult"}
                            onValueChange={value => updatePassenger(passenger.id, "type", value)}
                          >
                            <SelectTrigger className="w-full sm:w-[180px] border-gray-300 focus:ring-[rgb(0,153,153)] focus:border-[rgb(0,153,153)]">
                              <SelectValue placeholder="Passenger Type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="adult">Adult</SelectItem>
                              <SelectItem value="child">Child (2-11 yrs)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                            <Select
                              value={passenger.title}
                              onValueChange={value => updatePassenger(passenger.id, "title", value)}
                            >
                              <SelectTrigger className="w-full border-gray-300 focus:ring-[rgb(0,153,153)] focus:border-[rgb(0,153,153)]">
                                <SelectValue placeholder="Title" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Mr">Mr</SelectItem>
                                <SelectItem value="Mrs">Mrs</SelectItem>
                                <SelectItem value="Ms">Ms</SelectItem>
                                <SelectItem value="Miss">Miss</SelectItem>
                                <SelectItem value="Dr">Dr</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
                            <Input
                              value={passenger.firstName}
                              onChange={e => updatePassenger(passenger.id, "firstName", e.target.value)}
                              placeholder="First name"
                              required
                              className="focus:ring-[rgb(0,153,153)] focus:border-[rgb(0,153,153)] border-gray-300"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
                            <Input
                              value={passenger.lastName}
                              onChange={e => updatePassenger(passenger.id, "lastName", e.target.value)}
                              placeholder="Last name"
                              required
                              className="focus:ring-[rgb(0,153,153)] focus:border-[rgb(0,153,153)] border-gray-300"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-4">
                          {isChild && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Birthdate</label>
                              <Input
                                type="date"
                                value={passenger.birthdate || ""}
                                onChange={e => updatePassenger(passenger.id, "birthdate", e.target.value)}
                                placeholder="Birthdate"
                                required={isChild}
                                className="focus:ring-[rgb(0,153,153)] focus:border-[rgb(0,153,153)] border-gray-300"
                                min={getDateYearsAgo(11)}
                                max={getDateYearsAgo(2)}
                              />
                            </div>
                          )}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {isChild ? "Passport Number" : "Passport Number"}
                            </label>
                            <Input
                              value={passenger.passportNumber || ""}
                              onChange={e => updatePassenger(passenger.id, "passportNumber", e.target.value)}
                              placeholder={isChild ? "Passport Number" : "Passport Number"}
                              required
                              className="focus:ring-[rgb(0,153,153)] focus:border-[rgb(0,153,153)] border-gray-300"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-4">
                          <Checkbox
                            id={`infant-${passenger.id}`}
                            checked={!!passenger.hasInfant}
                            onCheckedChange={checked => updatePassenger(passenger.id, "hasInfant", checked)}
                            className="border-[rgb(255,199,33)] data-[state=checked]:bg-[rgb(0,153,153)] data-[state=checked]:border-[rgb(0,153,153)]"
                          />
                          <label htmlFor={`infant-${passenger.id}`} className="text-sm text-gray-600">
                            Bringing an infant (0-2 yrs, sits on lap)
                          </label>
                        </div>
                        {passenger.hasInfant && (
                          <div className="mt-4 p-3 sm:p-4 rounded bg-gray-50 border border-gray-200">
                            <h4 className="font-medium text-[rgb(0,153,153)] mb-3">Infant Details</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Infant's Name</label>
                                <Input
                                  value={passenger.infantName || ""}
                                  onChange={e => updatePassenger(passenger.id, "infantName", e.target.value)}
                                  placeholder="Infant's Name"
                                  required
                                  className="focus:ring-[rgb(0,153,153)] focus:border-[rgb(0,153,153)] border-gray-300"
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
                                  className="focus:ring-[rgb(0,153,153)] focus:border-[rgb(0,153,153)] border-gray-300"
                                  max={new Date().toISOString().split("T")[0]}
                                />
                              </div>
                            </div>
                            <div className="mt-4">
                              <label className="block text-sm font-medium text-gray-700 mb-1">Passport Number</label>
                              <Input
                                value={passenger.infantPassportNumber || ""}
                                onChange={e => updatePassenger(passenger.id, "infantPassportNumber", e.target.value)}
                                placeholder="Passport Number"
                                required
                                className="focus:ring-[rgb(0,153,153)] focus:border-[rgb(0,153,153)] border-gray-300"
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
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => openOnlySection('contact')}
              className="w-full p-4 bg-gray-50 hover:bg-gray-100 text-left flex justify-between items-center transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="bg-[rgb(0,153,153)] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">3</span>
                <h3 className="font-bold text-lg text-gray-800">Purchaser Details</h3>
              </div>
              {openSections.contact ? <ChevronUp className="text-gray-500" /> : <ChevronDown className="text-gray-500" />}
            </button>
            {openSections.contact && (
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                    <Input
                      value={contactDetails.name}
                      onChange={(e) => handleContactChange('name', e.target.value)}
                      placeholder="Your Name"
                      className="w-full focus:ring-[rgb(0,153,153)] focus:border-[rgb(0,153,153)] border-gray-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <Input
                      type="email"
                      value={contactDetails.email}
                      onChange={(e) => handleContactChange('email', e.target.value)}
                      placeholder="Email"
                      className="w-full focus:ring-[rgb(0,153,153)] focus:border-[rgb(0,153,153)] border-gray-300"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                    <Input
                      type="tel"
                      value={contactDetails.mobile}
                      onChange={(e) => handleContactChange('mobile', e.target.value)}
                      placeholder="Mobile"
                      className="w-full focus:ring-[rgb(0,153,153)] focus:border-[rgb(0,153,153)] border-gray-300"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ID Type</label>
                    <Select
                      value={contactDetails.idType}
                      onValueChange={(value) => handleContactChange('idType', value)}
                      required
                    >
                      <SelectTrigger className="focus:ring-[rgb(0,153,153)] focus:border-[rgb(0,153,153)] border-gray-300">
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
                      className="focus:ring-[rgb(0,153,153)] focus:border-[rgb(0,153,153)] border-gray-300"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => openOnlySection('emergency')}
              className="w-full p-4 bg-gray-50 hover:bg-gray-100 text-left flex justify-between items-center transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="bg-[rgb(0,153,153)] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">4</span>
                <h3 className="font-bold text-lg text-gray-800">Emergency Contact</h3>
              </div>
              {openSections.emergency ? <ChevronUp className="text-gray-500" /> : <ChevronDown className="text-gray-500" />}
            </button>
            {openSections.emergency && (
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <Input
                    value={emergencyContact.name}
                    onChange={(e) => handleEmergencyChange('name', e.target.value)}
                    placeholder="Name"
                    className="focus:ring-[rgb(0,153,153)] focus:border-[rgb(0,153,153)] border-gray-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <Input
                    type="tel"
                    value={emergencyContact.phone}
                    onChange={(e) => handleEmergencyChange('phone', e.target.value)}
                    placeholder="Phone Number"
                    className="focus:ring-[rgb(0,153,153)] focus:border-[rgb(0,153,153)] border-gray-300"
                  />
                </div>
              </div>
            )}
          </div>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => openOnlySection('points')}
              className="w-full p-4 bg-gray-50 hover:bg-gray-100 text-left flex justify-between items-center transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="bg-[rgb(0,153,153)] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">5</span>
                <h3 className="font-bold text-lg text-gray-800">Trip Points</h3>
              </div>
              {openSections.points ? <ChevronUp className="text-gray-500" /> : <ChevronDown className="text-gray-500" />}
            </button>
            {openSections.points && (
              <div className="p-4 space-y-6">
                <div>
                  <h4 className="font-bold text-[rgb(148,138,84)] mb-3 text-base sm:text-lg">Departure Trip Points</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Boarding Point
                      </label>
                      <select
                        value={departureBoardingPoint}
                        onChange={(e) => setDepartureBoardingPoint(e.target.value)}
                        className="w-full p-2 sm:p-3 border border-gray-300 rounded-md focus:ring-[rgb(0,153,153)] focus:border-[rgb(0,153,153)] text-sm sm:text-base"
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
                        className="w-full p-2 sm:p-3 border border-gray-300 rounded-md focus:ring-[rgb(0,153,153)] focus:border-[rgb(0,153,153)] text-sm sm:text-base"
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
                {isRoundTrip && (
                  <div>
                    <h4 className="font-bold text-[rgb(148,138,84)] mb-3 text-base sm:text-lg">Return Trip Points</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Boarding Point
                        </label>
                        <select
                          value={returnBoardingPoint}
                          onChange={(e) => setReturnBoardingPoint(e.target.value)}
                          className="w-full p-2 sm:p-3 border border-gray-300 rounded-md focus:ring-[rgb(0,153,153)] focus:border-[rgb(0,153,153)] text-sm sm:text-base"
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
                          className="w-full p-2 sm:p-3 border border-gray-300 rounded-md focus:ring-[rgb(0,153,153)] focus:border-[rgb(0,153,153)] text-sm sm:text-base"
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
          <div className="border-2 border-[rgb(255,199,33)] rounded-xl overflow-hidden mt-6 bg-gray-50">
            <button
              onClick={() => openOnlySection('addons')}
              className="w-full p-4 bg-gray-100 text-left flex justify-between items-center hover:bg-gray-200 transition-all"
            >
              <h3 className="font-bold text-lg text-[rgb(148,138,84)] flex items-center gap-2">
                Personalize Your Trip
              </h3>
              {openSections.addons ? <ChevronUp className="text-[rgb(148,138,84)]" /> : <ChevronDown className="text-[rgb(148,138,84)]" />}
            </button>
            {openSections.addons && (
              <div className="p-4 space-y-4">
                <div className="text-sm text-[rgb(0,153,153)] mb-4 font-medium bg-gray-100 p-3 rounded-lg border border-gray-200">
                  Select extras for each passenger. Prices are per passenger, per trip.
                </div>
                {ADDONS.map(addon => (
                  <div key={addon.key} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 border border-gray-200 rounded-lg p-3 sm:p-4 bg-white hover:bg-gray-50 transition-all">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-2 bg-gray-100 rounded-full border border-gray-200">
                        {addon.icon}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-[rgb(0,153,153)] text-sm sm:text-base">{addon.label}</div>
                        <div className="text-xs sm:text-sm text-[rgb(148,138,84)] mt-1">{addon.description}</div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 ml-auto">
                      <div className="flex gap-3">
                        <label className="flex items-center gap-1 text-sm">
                          <Checkbox
                            checked={!!selectedAddons[addon.key]?.departure}
                            onCheckedChange={checked => handleAddonChange(addon.key, "departure", !!checked)}
                            className="border-[rgb(255,199,33)] data-[state=checked]:bg-[rgb(0,153,153)] data-[state=checked]:border-[rgb(0,153,153)]"
                          />
                          <span className="text-xs sm:text-sm">Departure</span>
                        </label>
                        {isRoundTrip && (
                          <label className="flex items-center gap-1 text-sm">
                            <Checkbox
                              checked={!!selectedAddons[addon.key]?.return}
                              onCheckedChange={checked => handleAddonChange(addon.key, "return", !!checked)}
                              className="border-[rgb(255,199,33)] data-[state=checked]:bg-[rgb(0,153,153)] data-[state=checked]:border-[rgb(0,153,153)]"
                            />
                            <span className="text-xs sm:text-sm">Return</span>
                          </label>
                        )}
                      </div>
                      <span className="font-bold text-[rgb(255,199,33)] text-sm sm:text-base bg-gray-100 px-2 py-1 rounded-full border border-gray-200">
                        {addon.price > 0 ? `P ${addon.price}` : 'FREE'}
                      </span>
                    </div>
                    {addon.key === "travelInsurance" && (
                      <button
                        onClick={() => setShowInsuranceInfo(!showInsuranceInfo)}
                        className="ml-2 p-1 rounded-full hover:bg-gray-200 transition-colors"
                      >
                        <Info className="h-4 w-4 text-gray-600" />
                      </button>
                    )}
                  </div>
                ))}
                {showInsuranceInfo && (
                  <div className="p-3 bg-gray-100 rounded-lg border border-gray-200 text-sm text-gray-700">
                    <p className="font-medium text-[rgb(0,153,153)] mb-2">Travel Insurance Information</p>
                    <p>This travel insurance is applicable for day trips only.</p>
                    <p className="mt-2">For stays, please contact the office as per your dates.</p>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="border border-gray-200 rounded-lg p-4 sm:p-5 bg-gray-50">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center text-base sm:text-lg">
              <span className="bg-[rgb(0,153,153)] text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 text-sm">6</span>
              Payment Mode
            </h3>
            <div>
              <Select
                value={paymentMode}
                onValueChange={setPaymentMode}
                required
              >
                <SelectTrigger className="focus:ring-[rgb(0,153,153)] focus:border-[rgb(0,153,153)] border-gray-300">
                  <SelectValue placeholder="Select payment mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Credit Card">Credit Card | Debit Card</SelectItem>
                  {consultant && (
                    <SelectItem value="Cash">Paid in Cash</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-start space-x-2 mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <Checkbox
              id="terms"
              checked={agreedToTerms}
              onCheckedChange={(checked: boolean | string) => {
                setAgreedToTerms(!!checked);
                if (checked) setShowPolicyModal(true);
              }}
              className="border-[rgb(255,199,33)] data-[state=checked]:bg-[rgb(0,153,153)] data-[state=checked]:border-[rgb(0,153,153)] mt-1"
            />
            <label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-700">
              By continuing you agree to our <span className="underline text-[rgb(0,153,153)] cursor-pointer hover:text-[rgb(0,123,123)] font-semibold" onClick={() => setShowPolicyModal(true)}>TERMS & CONDITIONS</span> and Cancellation Policies
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
            className="w-full h-12 sm:h-14 bg-[rgb(255,192,2)] hover:bg-[rgb(0,123,123)] text-white font-semibold rounded-xl text-base sm:text-lg transition-all transform hover:scale-[1.02] shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            Pay (P {finalTotal.toFixed(2)})
          </Button>
        </div>
      </div>
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="max-w-lg mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle>Complete Your Booking</DialogTitle>
          </DialogHeader>
          {departureBus && (
            <PaymentGateway
              bookingData={{
                orderId: generateOrderId(),
                tripId: departureBus?.id,
                totalPrice: finalTotal,
                discountAmount: agentDiscount,
                selectedSeats: [...(departureSeats || []), ...(returnSeats || [])],
                departureSeats,
                returnSeats,
                addons: selectedAddons,
                passengers: passengers.map(p => ({
                  firstName: p.firstName,
                  lastName: p.lastName,
                  seatNumber: p.seatNumber,
                  title: p.title,
                  isReturn: p.isReturn,
                  hasInfant: !!p.hasInfant,
                  infantBirthdate: p.infantBirthdate || null,
                  type: p.type,
                  birthdate: p.birthdate || null,
                  passportNumber: p.passportNumber || null,
                  infantName: p.infantName || null,
                  infantPassportNumber: p.infantPassportNumber || null,
                })),
                userName: contactDetails.name,
                userEmail: contactDetails.email,
                userPhone: contactDetails.mobile,
                boardingPoint: departureBoardingPoint,
                droppingPoint: departureDroppingPoint,
                contactDetails,
                emergencyContact: {
                  name: emergencyContact.name,
                  phone: emergencyContact.phone,
                },
                paymentMode,
                returnTripId: returnBus?.id,
                returnBoardingPoint,
                returnDroppingPoint,
                agentId: agent?.id,
                consultantId: consultant?.id,
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
        mode="user"
        onAgree={() => {
          setPolicyAccepted(true);
          setShowPolicyModal(false);
        }}
      />
    </div>
  );
}

function getDateYearsAgo(years: number) {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return d.toISOString().split("T")[0];
}
