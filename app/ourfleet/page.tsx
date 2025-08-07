"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useState } from "react";
import HireBusModal from "../booking/hirebusmodal";

export default function FleetPage() {
  const [showHireModal, setShowHireModal] = useState(false);

  const vehicles = [
    {
      type: "Premium Coach",
      name: "Luxury Intercity Bus",
      description: "Our flagship service with premium comfort for long-distance travel between Gaborone and Johannesburg. Features reclining seats, onboard entertainment, and climate control.",
      capacity: "44 passengers",
      image: "/images/bus2.png",
      features: [
        "Air conditioning",
        "Reclining seats",
        "Onboard entertainment",
        "USB charging ports",
        "Ample legroom",
        "Onboard restroom"
      ]
    },
    {
      type: "Executive Combi",
      name: "Mercedes-Benz Sprinter",
      description: "Premium combi service for smaller groups with luxury amenities. Perfect for business travelers or small family trips.",
      capacity: "14 passengers",
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
      type: "Standard Combi",
      name: "Toyota Quantum",
      description: "Reliable and comfortable transport for small groups at affordable rates. Our most economical option for regional travel.",
      capacity: "14 passengers",
      image: "/images/mbus.png",
      features: [
        "Comfortable seating",
        "Air conditioning",
        "Reliable service",
        "Affordable rates",
        "Frequent departures"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-teal-50">
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-24 h-14 bg-white rounded-lg flex items-center justify-center p-1">
                <Image
                  src="/images/reeca-travel-logo.jpg"
                  alt="Reeca Travel"
                  width={100}
                  height={80}
                  className="object-contain"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-teal-900">REECA TRAVEL</h1>
                <p className="text-xs text-amber-600">Premium Intercity Bus Services</p>
              </div>
            </div>
            <nav className="hidden md:flex gap-6">
              <a href="/" className="text-teal-800 hover:text-amber-600 font-medium">Home</a>
              <a href="/booking" className="text-teal-800 hover:text-amber-600 font-medium">Book a Trip</a>
              <a href="#" className="text-teal-800 hover:text-amber-600 font-medium border-b-2 border-amber-600">Our Fleet</a>
              <a href="#" className="text-teal-800 hover:text-amber-600 font-medium">Contact</a>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-teal-900 mb-4">Our Fleet</h1>
          <p className="text-xl text-amber-700 max-w-2xl mx-auto">
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
                  <span className="text-xs font-semibold text-white bg-teal-600 px-2 py-1 rounded">{vehicle.type}</span>
                  <h3 className="text-xl font-bold text-white mt-2">{vehicle.name}</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-teal-600">{vehicle.capacity}</span>
                  <span className="text-xs font-semibold bg-amber-100 text-amber-800 px-2 py-1 rounded">Available</span>
                </div>
                <p className="text-gray-600 mb-4">{vehicle.description}</p>
                <ul className="space-y-2 mb-6">
                  {vehicle.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <svg className="w-4 h-4 text-teal-500 mt-1 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className="w-full bg-teal-600 hover:bg-teal-700"
                  onClick={() => setShowHireModal(true)}
                >
                  Hire This Vehicle
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-r from-teal-600 to-teal-800 rounded-xl p-8 text-white mb-16">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Need a Custom Solution?</h2>
            <p className="text-lg mb-6 opacity-90">
              Whether you need transportation for a corporate event, wedding, or group tour, 
              we can provide customized solutions to meet your specific requirements.
            </p>
            <Button 
              className="bg-amber-500 hover:bg-amber-600 text-white px-8 py-6 text-lg"
              onClick={() => setShowHireModal(true)}
            >
              Hire a Coach for Your Group
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-teal-900 mb-6">Why Choose Our Fleet?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-start">
              <div className="bg-teal-100 p-3 rounded-full mr-4">
                <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-teal-900 mb-2">Safety First</h3>
                <p className="text-gray-600">All our vehicles undergo regular maintenance and safety checks by certified technicians.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-teal-100 p-3 rounded-full mr-4">
                <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-teal-900 mb-2">Punctual Service</h3>
                <p className="text-gray-600">We pride ourselves on timely departures and arrivals for all our scheduled services.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-teal-100 p-3 rounded-full mr-4">
                <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"></path>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-teal-900 mb-2">Comfort Guaranteed</h3>
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
              <h3 className="text-lg font-bold mb-4">REECA TRAVEL</h3>
              <p className="text-gray-400">Premium bus services between Botswana and South Africa.</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><a href="/" className="text-gray-400 hover:text-white">Home</a></li>
                <li><a href="/booking" className="text-gray-400 hover:text-white">Book a Trip</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Our Fleet</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Contact Us</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Information</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">Terms & Conditions</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Contact</h4>
              <address className="not-italic text-gray-400">
                <p>Gaborone, Botswana</p>
                <p>Phone: +267 123 4567</p>
                <p>Email: info@reecatravel.com</p>
              </address>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500">
            <p>© {new Date().getFullYear()} REECA Travel. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {showHireModal && (
        <HireBusModal
          onClose={() => setShowHireModal(false)}
          onSubmit={async (formData: any) => {
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