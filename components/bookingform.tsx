// src/components/booking/BookingForm.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface BookingFormProps {
  onSearch: (data: any) => void;
}

export default function BookingForm({ onSearch }: BookingFormProps) {
  const [fromLocation, setFromLocation] = useState("Gaborone");
  const [toLocation, setToLocation] = useState("OR Tambo Airport");
  const [departureDate, setDepartureDate] = useState<Date>();
  const [returnDate, setReturnDate] = useState<Date>();
  const [isReturnTrip, setIsReturnTrip] = useState(true);
  const [totalSeats, setTotalSeats] = useState("1");

  const handleSearch = () => {
    if (fromLocation && toLocation && departureDate) {
      onSearch({
        from: fromLocation,
        to: toLocation,
        departureDate,
        returnDate: isReturnTrip ? returnDate : null,
        seats: Number.parseInt(totalSeats),
      });
    }
  };

  return (
    <div className="relative">
      <div className="w-full h-64 md:h-80 rounded-t-xl overflow-hidden relative bg-white">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex gap-8 items-center">
            <div className="relative">
              <Image
                src="/images/scania-irizar-vip.png"
                alt="Scania Irizar i6s VIP"
                width={280}
                height={168}
                className="object-contain"
              />
              <div className="absolute bottom-2 left-2 bg-teal-600 text-white px-2 py-1 rounded text-xs font-bold">
                B609BRD
              </div>
            </div>
            <div className="relative">
              <Image
                src="/images/scania-higer-new.png"
                alt="Scania Higer Touring"
                width={280}
                height={168}
                className="object-contain"
              />
              <div className="absolute bottom-2 left-2 bg-teal-600 text-white px-2 py-1 rounded text-xs font-bold">
                B610BRD
              </div>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent flex items-end">
          <div className="p-6 text-white">
            <h2 className="text-2xl md:text-3xl font-bold">Reeca Travel</h2>
            <p className="text-sm md:text-base">Premium Bus Services - Gaborone ↔ Johannesburg</p>
          </div>
        </div>
      </div>

      <div className="bg-teal-600 text-white p-4 md:p-6 rounded-xl -mt-6 relative z-10 mx-4 md:mx-auto max-w-5xl shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1">
            <Label className="text-sm font-medium text-white">From</Label>
            <Select value={fromLocation} onValueChange={setFromLocation}>
              <SelectTrigger className="h-12 border-0 bg-white/10 text-white backdrop-blur">
                <SelectValue placeholder="Select origin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Gaborone">Gaborone</SelectItem>
                <SelectItem value="OR Tambo Airport">OR Tambo Airport</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-sm font-medium text-white">To</Label>
            <Select value={toLocation} onValueChange={setToLocation}>
              <SelectTrigger className="h-12 border-0 bg-white/10 text-white backdrop-blur">
                <SelectValue placeholder="Select destination" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OR Tambo Airport">OR Tambo Airport</SelectItem>
                <SelectItem value="Gaborone">Gaborone</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-sm font-medium text-white">Departure Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="h-12 w-full justify-start border-0 bg-white/10 text-white hover:bg-white/20 hover:text-white backdrop-blur"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {departureDate ? format(departureDate, "dd/MM/yyyy") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={departureDate}
                  onSelect={setDepartureDate}
                  initialFocus
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-white">Return Date</Label>
              <div className="flex items-center space-x-1">
                <Checkbox
                  id="returnTrip"
                  checked={isReturnTrip}
                  onCheckedChange={(checked) => setIsReturnTrip(!!checked)}
                  className="bg-white/10 data-[state=checked]:bg-amber-500 data-[state=checked]:text-white"
                />
                <Label htmlFor="returnTrip" className="text-xs text-white">
                  Return
                </Label>
              </div>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "h-12 w-full justify-start border-0 bg-white/10 hover:bg-white/20 hover:text-white backdrop-blur",
                    isReturnTrip ? "text-white" : "text-white/50",
                  )}
                  disabled={!isReturnTrip}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {returnDate && isReturnTrip ? format(returnDate, "dd/MM/yyyy") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={returnDate}
                  onSelect={setReturnDate}
                  initialFocus
                  disabled={(date) => date < (departureDate || new Date())}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center mt-4 gap-4">
          <div className="flex items-center space-x-4 w-full md:w-auto">
            <div className="space-y-1">
              <Label className="text-sm font-medium text-white">Passengers</Label>
              <Select value={totalSeats} onValueChange={setTotalSeats}>
                <SelectTrigger className="h-10 border-0 bg-white/10 text-white w-24 backdrop-blur">
                  <SelectValue placeholder="1" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleSearch}
            className="w-full md:w-auto h-12 bg-amber-500 text-gray-900 hover:bg-amber-400 font-semibold text-lg rounded-lg px-8"
          >
            SEARCH BUSES
          </Button>
        </div>
      </div>
    </div>
  );
}
