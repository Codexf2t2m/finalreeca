// src/lib/data.ts

import { BoardingPoint, Booking, BusCategory } from "./types";

export const busCategories: BusCategory[] = [
  {
    id: "RT001",
    registration: "B609BRD",
    name: "Scania Irizar i6s VIP",
    image: "/images/scania-irizar-vip.png",
    price: 500,
    features: ["AC", "Video", "2+2 Seating", "VIP"],
    amenities: [
      { icon: "Snowflake", name: "AC" },
      { icon: "Wifi", name: "WiFi" },
      { icon: "Tv", name: "Video" },
    ],
    rating: 4.9,
    description: "Premium VIP comfort with luxury amenities",
    seats: 57,
    departureTime: "07:00",
    arrivalTime: "13:30",
    duration: "6h30min",
  },
  {
    id: "RT002",
    registration: "B610BRD",
    name: "Scania Higer Touring",
    image: "/images/scania-higer-new.png",
    price: 500,
    features: ["AC", "Video", "2+2 Seating"],
    amenities: [
      { icon: "Wifi", name: "Free WiFi" },
      { icon: "Snowflake", name: "AC" },
      { icon: "Tv", name: "Video" },
    ],
    rating: 4.8,
    description: "Comfortable premium travel experience",
    seats: 60,
    departureTime: "15:00",
    arrivalTime: "21:30",
    duration: "6h30min",
  },
];

export const boardingPoints: Record<string, BoardingPoint[]> = {
  gaborone: [
    { name: "Mogobe Plaza, Gaborone CBD", times: ["07:00", "15:00"] },
    { name: "Shell Riverwalk", times: ["07:30", "15:30"] },
  ],
  ortambo: [{ name: "OR Tambo Airport", times: ["08:00", "17:00"] }],
};

export const routes = [
  "Gaborone → OR Tambo Airport",
  "OR Tambo Airport → Gaborone",
];

export const mockBookings: Booking[] = [
  {
    id: "RT001",
    bookingRef: "BOOK-20240618-001",
    passengerName: "Topo Rapula",
    email: "toporapula@gmail.com",
    phone: "+267 71234567",
    route: "Gaborone → OR Tambo Airport",
    date: new Date(2024, 11, 15),
    time: "07:00",
    bus: "Scania Irizar i6s VIP",
    seats: ["12A", "12B"],
    passengers: 2,
    totalAmount: 1000,
    paymentMethod: "Card",
    bookingStatus: "Confirmed",
    paymentStatus: "Paid",
    boardingPoint: "Mogobe Plaza, Gaborone CBD",
    droppingPoint: "OR Tambo Airport",
    specialRequests: "Window seat, extra luggage",
  },
  {
    id: "RT002",
    bookingRef: "BOOK-20240618-002",
    passengerName: "Jane Doe",
    email: "jane@example.com",
    phone: "+267 76543210",
    route: "OR Tambo Airport → Gaborone",
    date: new Date(2024, 11, 20),
    time: "08:00",
    bus: "Scania Higer Touring",
    seats: ["5A"],
    passengers: 1,
    totalAmount: 500,
    paymentMethod: "Card",
    bookingStatus: "Confirmed",
    paymentStatus: "Paid",
    boardingPoint: "OR Tambo Airport",
    droppingPoint: "Shell Riverwalk",
    specialRequests: "",
  },
];
