// app/admin/requests/page.tsx
"use client"
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Eye, Search, Users } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";



interface Inquiry {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  passengers: number;
  date: string;
  time: string;
  origin: string;
  destination: string;
  specialRequests?: string;
  status: string;
  requestedAt: string;
}

export default function InquiriesManagement() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [showInquiryDetails, setShowInquiryDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    async function fetchInquiries() {
      const res = await fetch("/api/inquiries");
      const data = await res.json();
      setInquiries(data.inquiries || []);
    }
    fetchInquiries();
  }, []);

  const filteredInquiries = inquiries.filter((inquiry) => {
    const matchesSearch =
      inquiry.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || inquiry.status.toLowerCase() === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleViewInquiry = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    setShowInquiryDetails(true);
  };

  const handleUpdateInquiryStatus = (inquiryId: string, newStatus: string) => {
    setInquiries((prev) =>
      prev.map((inquiry) => (inquiry.id === inquiryId ? { ...inquiry, status: newStatus } : inquiry)),
    );
  };

  const handleExportExcel = () => {
    const exportData = inquiries.map((inq) => ({
      "Company Name": inq.companyName,
      "Contact Person": inq.contactPerson,
      "Email": inq.email,
      "Phone": inq.phone,
      "Passengers": inq.passengers,
      "Date": inq.date,
      "Time": inq.time,
      "Origin": inq.origin,
      "Destination": inq.destination,
      "Special Requests": inq.specialRequests || "",
      "Status": inq.status,
      "Requested At": inq.requestedAt,
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bus Hire Inquiries");
    XLSX.writeFile(workbook, "bus_hire_inquiries.xlsx");
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by name, inquiry ref, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Button className="bg-teal-600 hover:bg-teal-700 text-white" onClick={handleExportExcel}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Inquiries Table */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-teal-900">
            <Users className="h-5 w-5" />
            All Inquiries ({filteredInquiries.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Contact Person</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Passengers</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Origin</th>
                  <th>Destination</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInquiries.map((inq) => (
                  <tr key={inq.id}>
                    <td>{inq.companyName}</td>
                    <td>{inq.contactPerson}</td>
                    <td>{inq.email}</td>
                    <td>{inq.phone}</td>
                    <td>{inq.passengers}</td>
                    <td>{inq.date}</td>
                    <td>{inq.time}</td>
                    <td>{inq.origin}</td>
                    <td>{inq.destination}</td>
                    <td>{inq.status}</td>
                    <td>
                      {/* Actions */}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Inquiry Details Dialog */}
      <Dialog open={showInquiryDetails} onOpenChange={setShowInquiryDetails}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-teal-900">Inquiry Details</DialogTitle>
            <DialogDescription>
              Complete information for inquiry {selectedInquiry?.companyName}
            </DialogDescription>
          </DialogHeader>
          {selectedInquiry && (
            <div className="space-y-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-3 text-gray-800">Contact Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Contact Person:</span>
                    <span className="font-semibold ml-2">{selectedInquiry.contactPerson}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <span className="font-semibold ml-2">{selectedInquiry.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-semibold ml-2">{selectedInquiry.phone}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Passengers:</span>
                    <span className="font-semibold ml-2">{selectedInquiry.passengers}</span>
                  </div>
                </div>
              </div>

              {/* Journey Information */}
              <div className="p-4 bg-teal-50 rounded-lg">
                <h4 className="font-semibold mb-3 text-teal-800">Journey Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-teal-600">Origin:</span>
                    <span className="font-semibold ml-2">{selectedInquiry.origin}</span>
                  </div>
                  <div>
                    <span className="text-teal-600">Destination:</span>
                    <span className="font-semibold ml-2">{selectedInquiry.destination}</span>
                  </div>
                  <div>
                    <span className="text-teal-600">Date:</span>
                    <span className="font-semibold ml-2">{selectedInquiry.date}</span>
                  </div>
                  <div>
                    <span className="text-teal-600">Time:</span>
                    <span className="font-semibold ml-2">{selectedInquiry.time}</span>
                  </div>
                </div>
              </div>

              {/* Special Requests */}
              {selectedInquiry.specialRequests && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold mb-2 text-blue-800">Special Requests</h4>
                  <p className="text-sm text-blue-700">{selectedInquiry.specialRequests}</p>
                </div>
              )}

              {/* Admin Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={() => handleUpdateInquiryStatus(selectedInquiry.id, "Approved")}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  disabled={selectedInquiry.status === "Approved"}
                >
                  Approve Request
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleUpdateInquiryStatus(selectedInquiry.id, "Cancelled")}
                  disabled={selectedInquiry.status === "Cancelled"}
                >
                  Cancel Request
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
