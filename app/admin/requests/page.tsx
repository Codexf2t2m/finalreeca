// app/admin/requests/page.tsx
"use client"
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Eye, Search, Users } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";



interface Request {
  id: string;
  requestRef: string;
  passengerName: string;
  email: string;
  phone: string;
  route: string;
  date: Date;
  time: string;
  passengers: number;
  status: string;
  requestedAt: Date;
  specialRequests: string;
  adminNotes: string;
}

export default function RequestsManagement() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [showRequestDetails, setShowRequestDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      request.passengerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.requestRef.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || request.status.toLowerCase() === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleViewRequest = (request: Request) => {
    setSelectedRequest(request);
    setShowRequestDetails(true);
  };

  const handleUpdateRequestStatus = (requestId: string, newStatus: string) => {
    setRequests((prev) =>
      prev.map((request) => (request.id === requestId ? { ...request, status: newStatus } : request)),
    );
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
                  placeholder="Search by name, request ref, or email..."
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
            <Button className="bg-teal-600 hover:bg-teal-700 text-white">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-teal-900">
            <Users className="h-5 w-5" />
            All Requests ({filteredRequests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left p-3 font-semibold text-gray-700">Request Ref</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Passenger</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Route</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Date & Time</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Passengers</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Status</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3">
                      <span className="font-mono text-sm font-semibold text-teal-600">{request.requestRef}</span>
                    </td>
                    <td className="p-3">
                      <div>
                        <p className="font-semibold text-gray-900">{request.passengerName}</p>
                        <p className="text-sm text-gray-600">{request.email}</p>
                        <p className="text-sm text-gray-600">{request.phone}</p>
                      </div>
                    </td>
                    <td className="p-3">
                      <p className="text-sm font-medium text-gray-900">{request.route}</p>
                    </td>
                    <td className="p-3">
                      <p className="text-sm font-medium text-gray-900">{format(request.date, "MMM dd, yyyy")}</p>
                      <p className="text-xs text-gray-600">{request.time}</p>
                    </td>
                    <td className="p-3">
                      <p className="text-sm font-medium text-gray-900">{request.passengers}</p>
                    </td>
                    <td className="p-3">
                      <div className="space-y-1">
                        <Badge
                          className={cn(
                            "text-xs",
                            request.status === "Approved"
                              ? "bg-green-100 text-green-800"
                              : request.status === "Pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800",
                          )}
                        >
                          {request.status}
                        </Badge>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewRequest(request)}
                          className="text-teal-600 border-teal-600 hover:bg-teal-50"
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
        </CardContent>
      </Card>

      {/* Request Details Dialog */}
      <Dialog open={showRequestDetails} onOpenChange={setShowRequestDetails}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-teal-900">Request Details</DialogTitle>
            <DialogDescription>Complete information for request {selectedRequest?.requestRef}</DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-6">
              {/* Passenger Information */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-3 text-gray-800">Passenger Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <span className="font-semibold ml-2">{selectedRequest.passengerName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <span className="font-semibold ml-2">{selectedRequest.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-semibold ml-2">{selectedRequest.phone}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Passengers:</span>
                    <span className="font-semibold ml-2">{selectedRequest.passengers}</span>
                  </div>
                </div>
              </div>

              {/* Journey Information */}
              <div className="p-4 bg-teal-50 rounded-lg">
                <h4 className="font-semibold mb-3 text-teal-800">Journey Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-teal-600">Route:</span>
                    <span className="font-semibold ml-2">{selectedRequest.route}</span>
                  </div>
                  <div>
                    <span className="text-teal-600">Date:</span>
                    <span className="font-semibold ml-2">{format(selectedRequest.date, "EEEE, MMMM dd, yyyy")}</span>
                  </div>
                  <div>
                    <span className="text-teal-600">Time:</span>
                    <span className="font-semibold ml-2">{selectedRequest.time}</span>
                  </div>
                </div>
              </div>

              {/* Special Requests */}
              {selectedRequest.specialRequests && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold mb-2 text-blue-800">Special Requests</h4>
                  <p className="text-sm text-blue-700">{selectedRequest.specialRequests}</p>
                </div>
              )}

              {/* Admin Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={() => handleUpdateRequestStatus(selectedRequest.id, "Approved")}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  disabled={selectedRequest.status === "Approved"}
                >
                  Approve Request
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleUpdateRequestStatus(selectedRequest.id, "Cancelled")}
                  disabled={selectedRequest.status === "Cancelled"}
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
