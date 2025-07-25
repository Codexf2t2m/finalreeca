"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function AgentManagementPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/agents")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch agents");
        return res.json();
      })
      .then((data) => {
        setAgents(data.agents || []);
        setLoading(false);
      })
      .catch((err) => {
        setError("Could not load agents.");
        setLoading(false);
      });
  }, []);

  const handleApprove = async (id: string) => {
    try {
      const response = await fetch(`/api/agents/${id}/approve`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to approve agent");
      setAgents(
        agents.map((a) => (a.id === id ? { ...a, approved: true } : a))
      );
    } catch (error) {
      console.error("Error approving agent:", error);
    }
  };

  const handleDecline = async (id: string) => {
    try {
      const response = await fetch(`/api/agents/${id}/decline`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to decline agent");
      setAgents(agents.filter((a) => a.id !== id));
    } catch (error) {
      console.error("Error declining agent:", error);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      const response = await fetch(`/api/agents/${id}/remove`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to remove agent");
      setAgents(agents.filter((a) => a.id !== id));
    } catch (error) {
      console.error("Error removing agent:", error);
    }
  };

  const handleSuspend = async (id: string) => {
    try {
      const response = await fetch(`/api/agents/${id}/suspend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ days: 30 }), // Suspend for 30 days
      });
      if (!response.ok) throw new Error("Failed to suspend agent");
      setAgents(
        agents.map((a) =>
          a.id === id ? { ...a, suspended: true, suspensionDate: new Date() } : a
        )
      );
    } catch (error) {
      console.error("Error suspending agent:", error);
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
        <p className="mt-4 text-lg font-medium text-teal-600">Loading agents...</p>
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

  if (!agents.length) {
    return (
      <div className="max-w-3xl mx-auto my-12 px-4 text-center">
        <h2 className="text-3xl font-bold text-teal-900 mb-6">Agent Management</h2>
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
          <h3 className="mt-2 text-lg font-medium text-gray-900">No agents found</h3>
          <p className="mt-1 text-gray-500">There are currently no agents registered in the system.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto my-12 px-4">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-teal-900">Agent Management</h2>
        <div className="text-sm text-gray-500">
          Total agents: <span className="font-medium">{agents.length}</span>
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
            {agents.map((agent) => (
              <tr key={agent.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{agent.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{agent.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {agent.suspended ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      Suspended
                    </span>
                  ) : agent.approved ? (
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
                  {!agent.approved && !agent.suspended && (
                    <>
                      <Button
                        size="sm"
                        className="bg-teal-600 hover:bg-teal-700 text-white"
                        onClick={() => handleApprove(agent.id)}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-gray-300 hover:bg-gray-50"
                        onClick={() => handleDecline(agent.id)}
                      >
                        Decline
                      </Button>
                    </>
                  )}
                  {!agent.suspended && agent.approved && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-yellow-300 hover:bg-yellow-50 text-yellow-700"
                      onClick={() => handleSuspend(agent.id)}
                    >
                      Suspend
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    className="hover:bg-red-700"
                    onClick={() => handleRemove(agent.id)}
                  >
                    Remove
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}