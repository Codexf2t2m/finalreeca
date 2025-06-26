export interface BusCategory {
  id: string;
  registration: string;
  name: string;
  image: string;
  price: number;
  features: string[];
  amenities: { icon: any; name: string }[];
  rating: number;
  description: string;
  seats: number;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  isRequest?: boolean;
  route?: string; // <-- Add this line (optional)
}

export interface BoardingPoint {
  id: string;
  name: string;
  times: string[];
}

export interface SearchData {
  from: string;
  to: string;
  departureDate: Date;
  returnDate: Date | null;
  seats: number;
  isReturn: boolean
}

export interface Booking {
  id: string;
  bookingRef: string;
  passengerName: string;
  email: string;
  phone: string;
  route: string;
  date: Date;
  time: string;
  bus: string;
  seats: string[];
  passengers: number;
  totalAmount: number;
  paymentMethod: string;
  bookingStatus: "Confirmed" | "Pending" | "Cancelled";
  paymentStatus: "Paid" | "Unpaid";
  boardingPoint: string;
  droppingPoint: string;
  specialRequests?: string;
}

export interface Seat {
  id: string;
  number: string;
  isAvailable: boolean;
  isSelected: boolean;
  row: number;
  position: string;
  side: string;
  seatIndex: number;
}

export interface PassengerDetails {
  fullName: string;
  email: string;
  phone: string;
  passengers: number;
  specialRequests: string;
}

export interface PaymentData {
  totalPrice: number;
  selectedSeats: string[];
  userName: string;
  userEmail: string;
  boardingPoint: string;
  droppingPoint: string;
  orderId: string;
}
