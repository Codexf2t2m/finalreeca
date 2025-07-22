"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function AgentManagementPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/agents")
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch agents");
        return res.json();
      })
      .then(data => {
        setAgents(data.agents || []);
        setLoading(false);
      })
      .catch(err => {
        setError("Could not load agents.");
        setLoading(false);
      });
  }, []);

  const handleApprove = async (id: string) => {
    await fetch(`/api/agents/${id}/approve`, { method: "POST" });
    setAgents(agents.map(a => a.id === id ? { ...a, approved: true } : a));
  };

  const handleDecline = async (id: string) => {
    await fetch(`/api/agents/${id}/decline`, { method: "POST" });
    setAgents(agents.filter(a => a.id !== id));
  };

  if (loading) return <div className="py-8 text-center text-teal-600">Loading agents...</div>;
  if (error) return <div className="py-8 text-center text-red-600">{error}</div>;
  if (!agents.length) {
    return (
      <div className="max-w-3xl mx-auto my-8 px-4 text-center">
        <h2 className="text-2xl font-bold text-teal-900 mb-4">Agent Management</h2>
        <p className="text-gray-600 text-lg">No agents found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto my-8 px-4">
      <h2 className="text-2xl font-bold text-teal-900 mb-4">Agent Management</h2>
      <table className="min-w-full border border-gray-200 rounded">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Name</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Email</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Status</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody>
          {agents.map(agent => (
            <tr key={agent.id} className="border-t border-gray-100">
              <td className="px-3 py-2 text-xs">{agent.name}</td>
              <td className="px-3 py-2 text-xs">{agent.email}</td>
              <td className="px-3 py-2 text-xs">
                {agent.approved ? (
                  <span className="text-green-600 font-semibold">Approved</span>
                ) : (
                  <span className="text-red-600 font-semibold">Pending</span>
                )}
              </td>
              <td className="px-3 py-2 text-xs">
                {!agent.approved && (
                  <>
                    <Button size="sm" className="bg-teal-600 text-white mr-2" onClick={() => handleApprove(agent.id)}>
                      Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDecline(agent.id)}>
                      Decline
                    </Button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}