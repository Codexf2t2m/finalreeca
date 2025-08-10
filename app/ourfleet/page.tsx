"use client";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useState } from "react";
import HireBusModal from "../booking/hirebusmodal";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function FleetPage() {
  const [showHireModal, setShowHireModal] = useState(false);

  const vehicles = [
    {
      type: "Luxury Coach",
      name: "SCANIA TOURING",
      description: "Our flagship service with premium comfort for long-distance travel between Gaborone and Johannesburg. Features reclining seats, onboard entertainment, and climate control.",
      capacity: "57 passengers",
      image: "/images/scania-higer-new.png",
      features: [
        "Air conditioning",
        "Reclining seats",
        "Onboard entertainment",
        "USB charging ports",
        "Ample legroom",
      ]
    },
    {
      type: "Executive Combi",
      name: "Mercedes-Benz Sprinter",
      description: "Premium combi service for smaller groups with luxury amenities. Perfect for business travelers or small family trips.",
      capacity: "25 passengers",
      image: "/images/cons.jpg",
      features: [
        "Luxury leather seats",
        "Climate control",
        "Charging ports",
        "Complimentary water",
        "Executive class service"
      ]
    },
    {
      type: "luxurious shuttle",
      name: "Toyota Quantum",
      description: "Reliable and comfortable transport for small groups at affordable rates. Our most economical option for regional travel.",
      capacity: "13 passengers",
      image: "/images/mbus2.webp",
      features: [
        "Comfortable seating",
        "Air conditioning",
        "Reliable service",
        "Affordable rates",
        "Frequent departures"
      ]
    }
  ];

  const NavLinks = () => (
    <>
    <a
        href="/"
        className="text-[#007F7F] hover:text-[#B9B28F] font-medium"
      >
        Home
      </a>
      <a
        href="https://reecatravel.co.bw/?cat=5"
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#007F7F] hover:text-[#B9B28F] font-medium"
      >
        Reeca Holidays
      </a>
      <a
        href="/ourfleet"
        className="text-[#007F7F] hover:text-[#B9B28F] font-medium border-b-2 border-[#B9B28F]"
      >
        Our Fleet
      </a>
      <a href="#" className="text-[#007F7F] hover:text-[#B9B28F] font-medium">
        Help
      </a>
      <a
        href="https://reecatravel.co.bw/aboutus"
        className="text-[#007F7F] hover:text-[#B9B28F] font-medium"
      >
        About Us
      </a>
      <a
        href="https://reecatravel.co.bw/contactus"
        className="text-[#007F7F] hover:text-[#B9B28F] font-medium"
      >
        Contact
      </a>
    </>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-teal-50">
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Sheet>
                <SheetTrigger asChild className="md:hidden">
                  <Button variant="outline" size="icon">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left">
                  <div className="flex flex-col space-y-3 mt-6">
                    <NavLinks />
                  </div>
                </SheetContent>
              </Sheet>
              <div className="w-24 h-14 bg-white rounded-lg flex items-center justify-center p-1">
                <Image
                  src="/images/reeca-travel-logo.png"
                  alt="Reeca Transport"
                  width={150}
                  height={150}
                  className="object-contain"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#007F7F]">REECA TRANSPORT</h1>
                <p className="text-xs text-[#B9B28F]">Clean & serviced vehicles</p>
              </div>
            </div>
            <nav className="hidden md:flex gap-6">
              <NavLinks />
            </nav>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-[#007F7F] mb-4">Our Fleet</h1>
          <p className="text-xl text-[#B9B28F] max-w-2xl mx-auto">
            Travel in comfort and style with our modern fleet of buses and combis
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {vehicles.map((vehicle, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow duration-300">
              <div className="h-48 relative bg-gray-100">
                <Image
                  src={vehicle.image}
                  alt={vehicle.name}
                  fill
                  className="object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <span className="text-xs font-semibold text-white bg-[#007F7F] px-2 py-1 rounded">{vehicle.type}</span>
                  <h3 className="text-xl font-bold text-white mt-2">{vehicle.name}</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-[#007F7F]">{vehicle.capacity}</span>
                  <span className="text-xs font-semibold bg-[#FFC002]/20 text-[#007F7F] px-2 py-1 rounded">Available</span>
                </div>
                <p className="text-gray-600 mb-4">{vehicle.description}</p>
                <ul className="space-y-2 mb-6">
                  {vehicle.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <svg className="w-4 h-4 text-[#007F7F] mt-1 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full bg-[#FFD700] hover:bg-[#006B6B] text-white"
                  onClick={() => setShowHireModal(true)}
                >
                  Hire This Vehicle
                </Button>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-gradient-to-r from-[#007F7F] to-[#006B6B] rounded-xl p-8 text-white mb-16">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Need a Custom Solution?</h2>
            <p className="text-lg mb-6 opacity-90">
              Whether you need transportation for a corporate event, wedding, or group tour,
              we can provide customized solutions to meet your specific requirements.
            </p>
            <Button
              className="bg-[#B9B28F] hover:bg-[#A8A088] text-white px-8 py-6 text-lg"
              onClick={() => setShowHireModal(true)}
            >
              Hire a Coach for Your Group
            </Button>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-[#007F7F] mb-6">Why Choose Our Fleet?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-start">
              <div className="bg-[#007F7F]/10 p-3 rounded-full mr-4">
                <svg className="w-6 h-6 text-[#007F7F]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#007F7F] mb-2">Safety First</h3>
                <p className="text-gray-600">All our vehicles undergo regular maintenance and safety checks by certified technicians.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-[#007F7F]/10 p-3 rounded-full mr-4">
                <svg className="w-6 h-6 text-[#007F7F]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#007F7F] mb-2">Punctual Service</h3>
                <p className="text-gray-600">We pride ourselves on timely departures and arrivals for all our scheduled services.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-[#007F7F]/10 p-3 rounded-full mr-4">
                <svg className="w-6 h-6 text-[#007F7F]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"></path>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#007F7F] mb-2">Comfort Guaranteed</h3>
                <p className="text-gray-600">Modern amenities and spacious seating ensure a comfortable journey every time.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-bold mb-4">REECA TRANSPORT</h3>
              <p className="text-gray-400">
                Clean & serviced vehicles between Botswana and South Africa.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><a href="/" className="text-gray-400 hover:text-white">Home</a></li>
                <li><a href="/booking" className="text-gray-400 hover:text-white">Book a Trip</a></li>
                <li><a href="/ourfleet" className="text-gray-400 hover:text-white">Our Fleet</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Contact Us</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Information</h4>
              <ul className="space-y-2">
                <li><a href="https://reecatravel.co.bw/forum/termandcondition" className="text-gray-400 hover:text-white">Terms & Conditions</a></li>
                <li><a href="https://reecatravel.co.bw/forum/privacypolicy" className="text-gray-400 hover:text-white">Privacy Policy</a></li>
                <li><a href="https://reecatravel.co.bw/forum/cancellationpolicy" className="text-gray-400 hover:text-white">Cancellation Policy</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Contact</h4>
              <address className="not-italic text-gray-400">
                <p>Mogobe Plaza, Gaborone CBD, 4th Floor</p>
                <p>Emergency Phone: +267 77655348</p>
                <p>Office Line: +267 73061124</p>
                <p>WhatsApp: +267 76506348</p>
                <p>Email: tickets@reecatravel.co.bw</p>
                <p>Travel Services: traveltalk@reecatravel.co.bw</p>
              </address>
            </div>
          </div>
          <div className="mt-8 text-center text-gray-500">
            <p>© {new Date().getFullYear()} REECA Transport. All rights reserved.</p>
          </div>
        </div>
      </footer>
      {showHireModal && (
        <HireBusModal
          onClose={() => setShowHireModal(false)}
          onSubmit={async (formData) => {
            await fetch("/api/inquiries", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(formData),
            });
            setShowHireModal(false);
            alert("Your hire inquiry has been submitted. We'll contact you soon!");
          }}
        />
      )}
    </div>
  );
}
