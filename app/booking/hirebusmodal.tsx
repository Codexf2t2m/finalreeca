import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Bus, Loader2, CheckCircle } from "lucide-react";

export default function HireBusModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (data: any) => Promise<void> }) {
  const [form, setForm] = useState({
    companyName: "",
    contactPerson: "",
    email: "",
    phone: "",
    passengers: "",
    date: "",
    time: "",
    origin: "",
    destination: "",
    specialRequests: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit(form);
    setLoading(false);
    setSubmitted(true);
    setForm({
      companyName: "",
      contactPerson: "",
      email: "",
      phone: "",
      passengers: "",
      date: "",
      time: "",
      origin: "",
      destination: "",
      specialRequests: "",
    });
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="bg-white shadow-xl rounded-r-2xl w-full max-w-md p-8 animate-slide-in-left overflow-y-auto"
        style={{
          minHeight: "100vh",
          maxHeight: "100vh",
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        }}
      >
        <div className="flex items-center gap-3 mb-6">
          <Bus className="w-8 h-8 text-amber-600" />
          <h2 className="text-2xl font-bold text-teal-900">Hire a Bus / Company Booking</h2>
        </div>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 text-teal-600 animate-spin mb-4" />
            <p className="text-lg font-medium text-gray-800">Submitting your inquiry...</p>
          </div>
        ) : submitted ? (
          <div className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
            <p className="text-lg font-bold text-teal-900">Inquiry Submitted!</p>
            <p className="text-sm text-gray-600 mt-2 text-center">
              Thank you for your request. Our team will contact you soon.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Company Name</Label>
              <Input name="companyName" value={form.companyName} onChange={handleChange} required />
            </div>
            <div>
              <Label>Contact Person</Label>
              <Input name="contactPerson" value={form.contactPerson} onChange={handleChange} required />
            </div>
            <div>
              <Label>Email</Label>
              <Input name="email" type="email" value={form.email} onChange={handleChange} required />
            </div>
            <div>
              <Label>Phone</Label>
              <Input name="phone" value={form.phone} onChange={handleChange} required />
            </div>
            <div>
              <Label>Number of Passengers</Label>
              <Input name="passengers" type="number" value={form.passengers} onChange={handleChange} required />
            </div>
            <div>
              <Label>Date</Label>
              <Input name="date" type="date" value={form.date} onChange={handleChange} required />
            </div>
            <div>
              <Label>Time</Label>
              <Input name="time" type="time" value={form.time} onChange={handleChange} required />
            </div>
            <div>
              <Label>Origin</Label>
              <Input name="origin" value={form.origin} onChange={handleChange} required />
            </div>
            <div>
              <Label>Destination</Label>
              <Input name="destination" value={form.destination} onChange={handleChange} required />
            </div>
            <div>
              <Label>Special Requests</Label>
              <Textarea name="specialRequests" value={form.specialRequests} onChange={handleChange} />
            </div>
            <div className="flex gap-2 justify-end mt-6">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" className="bg-teal-600 text-white">Submit Inquiry</Button>
            </div>
          </form>
        )}
      </div>
      <div
        className="flex-1 bg-black bg-opacity-40"
        onClick={onClose}
      />
    </div>
  );
}