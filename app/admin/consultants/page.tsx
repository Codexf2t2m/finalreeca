"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ConsultantManagementPage() {
  const [consultants, setConsultants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedConsultant, setSelectedConsultant] = useState<any | null>(null);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [consultantBookings, setConsultantBookings] = useState<any[]>([]);
  const [consultantSales, setConsultantSales] = useState<any>({
    bookings: 0,
    revenue: 0,
    commission: 0,
  });

  useEffect(() => {
    fetch("/api/consultants")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch consultants");
        return res.json();
      })
      .then((data) => {
        setConsultants(data.consultants || []);
        setLoading(false);
      })
      .catch((err) => {
        setError("Could not load consultants.");
        setLoading(false);
      });
  }, []);

  const handleApprove = async (id: string) => {
    try {
      const response = await fetch(`/api/consultants/${id}/approve`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to approve consultant");
      setConsultants(
        consultants.map((c) => (c.id === id ? { ...c, approved: true } : c))
      );
    } catch (error) {
      console.error("Error approving consultant:", error);
    }
  };

  const handleDecline = async (id: string) => {
    try {
      const response = await fetch(`/api/consultants/${id}/decline`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to decline consultant");
      setConsultants(consultants.filter((c) => c.id !== id));
    } catch (error) {
      console.error("Error declining consultant:", error);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      const response = await fetch(`/api/consultants/${id}/remove`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to remove consultant");
      setConsultants(consultants.filter((c) => c.id !== id));
    } catch (error) {
      console.error("Error removing consultant:", error);
    }
  };

  const handleViewActivity = async (id: string) => {
    setActivityModalOpen(true);
    try {
      const bookingsResponse = await fetch(`/api/consultants/${id}/bookings`);
      const salesResponse = await fetch(`/api/reports/sales-by-consultant`);
      if (!bookingsResponse.ok || !salesResponse.ok) throw new Error("Failed to fetch activity data");
      const bookingsData = await bookingsResponse.json();
      const salesData = await salesResponse.json();
      setConsultantBookings(bookingsData.bookings || []);
      const consultantSalesData = salesData.find((s: any) => s.id === id) || { bookings: 0, revenue: 0, commission: 0 };
      setConsultantSales(consultantSalesData);
    } catch (error) {
      console.error("Error fetching activity data:", error);
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
        <p className="mt-4 text-lg font-medium text-teal-600">Loading consultants...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <p className="mt-4 text-lg font-medium text-red-600">{error}</p>
      </div>
    );
  }

  if (!consultants.length) {
    return (
      <div className="max-w-3xl mx-auto my-12 px-4 text-center">
        <h2 className="text-3xl font-bold text-teal-900 mb-6">Consultant Management</h2>
        <div className="bg-gray-50 rounded-lg p-8 border border-gray-200">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
            />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">No consultants found</h3>
          <p className="mt-1 text-gray-500">There are currently no consultants registered in the system.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto my-12 px-4">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-teal-900">Consultant Management</h2>
        <div className="text-sm text-gray-500">
          Total consultants: <span className="font-medium">{consultants.length}</span>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {consultants.map((consultant) => (
              <tr key={consultant.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{consultant.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{consultant.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {consultant.suspended ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      Suspended
                    </span>
                  ) : consultant.approved ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Approved
                    </span>
                  ) : (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                      Pending
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap space-x-2">
                  {!consultant.approved && !consultant.suspended && (
                    <>
                      <Button
                        size="sm"
                        className="bg-teal-600 hover:bg-teal-700 text-white"
                        onClick={() => handleApprove(consultant.id)}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-gray-300 hover:bg-gray-50"
                        onClick={() => handleDecline(consultant.id)}
                      >
                        Decline
                      </Button>
                    </>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    className="hover:bg-red-700"
                    onClick={() => handleRemove(consultant.id)}
                  >
                    Remove
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-blue-300 hover:bg-blue-50 text-blue-700"
                    onClick={() => setSelectedConsultant(consultant)}
                  >
                    View Details
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-purple-300 hover:bg-purple-50 text-purple-700"
                    onClick={() => handleViewActivity(consultant.id)}
                  >
                    View Activity
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedConsultant && (
        <Dialog open={!!selectedConsultant} onOpenChange={() => setSelectedConsultant(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Consultant Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <div><strong>Name:</strong> {selectedConsultant.name}</div>
              <div><strong>Email:</strong> {selectedConsultant.email}</div>
              <div><strong>Organization:</strong> {selectedConsultant.organization}</div>
              <div><strong>Mobile:</strong> {selectedConsultant.mobile}</div>
              <div><strong>ID Number:</strong> {selectedConsultant.idNumber}</div>
              <div><strong>Status:</strong> {selectedConsultant.approved ? "Approved" : "Pending"}</div>
            </div>
            <DialogFooter>
              {!selectedConsultant.approved && (
                <Button onClick={() => handleApprove(selectedConsultant.id)}>Approve</Button>
              )}
              <Button variant="destructive" onClick={() => handleDecline(selectedConsultant.id)}>Decline</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

        {activityModalOpen && (
          <Dialog open={activityModalOpen} onOpenChange={() => setActivityModalOpen(false)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Consultant Activity</DialogTitle>
              </DialogHeader>
              <div>
                <h4 className="font-semibold mb-2">Bookings</h4>
                <ul>
                  {consultantBookings.map(b => (
                    <li key={b.id}>
                      {b.orderId} - {b.userName} - {b.seatCount} seats - {b.totalPrice} - {b.trip.routeName} ({b.trip.departureDate})
                    </li>
                  ))}
                </ul>
                <h4 className="font-semibold mt-4 mb-2">Sales</h4>
                <div>
                  Bookings: {consultantSales.bookings}<br />
                  Revenue: {consultantSales.revenue}<br />
                  Commission: {consultantSales.commission}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
    </div>
  );
}