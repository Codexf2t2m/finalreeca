// app/admin/requests/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye, Search, CheckCircle, XCircle, Download, Users, ChevronLeft, ChevronRight } from "lucide-react";
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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [modalClosing, setModalClosing] = useState(false);

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

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredInquiries.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredInquiries.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const nextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);
  const prevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);

  const handleViewInquiry = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    setShowInquiryDetails(true);
  };

  // Update status handler to auto-close modal after action
  const handleUpdateInquiryStatus = async (inquiryId: string, newStatus: string) => {
    await fetch(`/api/inquiries/${inquiryId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setInquiries((prev) =>
      prev.map((inquiry) =>
        inquiry.id === inquiryId ? { ...inquiry, status: newStatus } : inquiry
      )
    );
    setModalClosing(true);
    setTimeout(() => {
      setShowInquiryDetails(false);
      setModalClosing(false);
    }, 300); // 0.3s delay for fade-out
  };

  const handleDeleteInquiry = async (inquiryId: string) => {
    await fetch(`/api/inquiries/${inquiryId}/status`, {
      method: "DELETE",
    });
    setInquiries((prev) => prev.filter((inquiry) => inquiry.id !== inquiryId));
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
      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by company, contact person, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-auto">
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
            </div>
            <div className="w-full md:w-auto">
              <Select 
                value={itemsPerPage.toString()} 
                onValueChange={(value) => {
                  setItemsPerPage(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full md:w-32">
                  <SelectValue placeholder="Items per page" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="25">25 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                  <SelectItem value="100">100 per page</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              className="border-teal-600 text-teal-600 hover:bg-teal-50"
              onClick={handleExportExcel}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-gray-200 shadow-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">
                Inquiries Management
              </CardTitle>
              <CardDescription className="text-sm text-gray-600">
                {filteredInquiries.length} inquiries found
              </CardDescription>
            </div>
            {filteredInquiries.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Page {currentPage} of {totalPages}</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {filteredInquiries.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No inquiries found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search or filter criteria
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Company
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact Person
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Journey
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Passengers
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentItems.map((inquiry) => (
                      <tr key={inquiry.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-teal-600">{inquiry.companyName}</div>
                          <div className="text-sm text-gray-500">{inquiry.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{inquiry.contactPerson}</div>
                          <div className="text-sm text-gray-500">{inquiry.phone}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{inquiry.origin} → {inquiry.destination}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{inquiry.date}</div>
                          <div className="text-xs text-gray-500">{inquiry.time}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{inquiry.passengers}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge
                            className={cn(
                              "text-xs",
                              inquiry.status === "Approved"
                                ? "bg-green-100 text-green-800"
                                : inquiry.status === "Pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                            )}
                          >
                            {inquiry.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewInquiry(inquiry)}
                              className="text-gray-600 hover:text-teal-600"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-700">
                    Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{" "}
                    <span className="font-medium">
                      {Math.min(indexOfLastItem, filteredInquiries.length)}
                    </span>{" "}
                    of <span className="font-medium">{filteredInquiries.length}</span> inquiries
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={prevPage}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => paginate(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    {totalPages > 5 && currentPage < totalPages - 2 && (
                      <span className="flex items-center px-3 text-sm text-gray-700">...</span>
                    )}
                    {totalPages > 5 && currentPage < totalPages - 2 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => paginate(totalPages)}
                      >
                        {totalPages}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={nextPage}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {showInquiryDetails && (
        <Dialog
          open={showInquiryDetails}
          onOpenChange={setShowInquiryDetails}
        >
          <DialogContent
            className={`max-w-2xl max-h-[90vh] overflow-y-auto transition-opacity duration-300 ${modalClosing ? "opacity-0" : "opacity-100"}`}
          >
            <DialogHeader>
              <DialogTitle className="text-teal-900">Inquiry Details</DialogTitle>
              <DialogDescription>
                Complete information for inquiry from {selectedInquiry?.companyName}
              </DialogDescription>
            </DialogHeader>
            {selectedInquiry && (
              <div className="space-y-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-3 text-gray-800">Contact Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Company:</span>
                      <span className="font-semibold ml-2">{selectedInquiry.companyName}</span>
                    </div>
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
                  </div>
                </div>

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
                    <div>
                      <span className="text-teal-600">Passengers:</span>
                      <span className="font-semibold ml-2">{selectedInquiry.passengers}</span>
                    </div>
                    <div>
                      <span className="text-teal-600">Requested At:</span>
                      <span className="font-semibold ml-2">{selectedInquiry.requestedAt}</span>
                    </div>
                  </div>
                </div>

                {selectedInquiry.specialRequests && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold mb-2 text-blue-800">Special Requests</h4>
                    <p className="text-sm text-blue-700">{selectedInquiry.specialRequests}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    onClick={() => handleUpdateInquiryStatus(selectedInquiry.id, "Approved")}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    disabled={selectedInquiry.status === "Approved"}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve Inquiry
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleUpdateInquiryStatus(selectedInquiry.id, "Declined")}
                    disabled={selectedInquiry.status === "Declined"}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Decline Inquiry
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}