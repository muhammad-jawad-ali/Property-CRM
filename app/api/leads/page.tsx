'use client';
import { useEffect, useState } from 'react';

interface Lead {
    _id: string;
    name: string;
    email: string;
    budget: number;
    status: string;
    assignedTo: { _id: string; name: string } | null;
}

interface Agent {
    _id: string;
    name: string;
    email: string;
}

export default function AdminLeadsPage() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLeads();
        fetchAgents();
    }, []);

    const fetchLeads = async () => {
        const res = await fetch('/api/leads');
        const data = await res.json();
        setLeads(data);
        setLoading(false);
    };

    const fetchAgents = async () => {
        // You need an API endpoint that returns all agents
        const res = await fetch('/api/users?role=agent');
        const data = await res.json();
        setAgents(data);
    };

    const assignLead = async (leadId: string, agentId: string) => {
        const res = await fetch(`/api/leads/${leadId}/assign`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ agentId }),
        });
        if (res.ok) {
            fetchLeads(); // refresh list
        } else {
            alert('Assignment failed');
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Manage Leads</h1>
            <table className="w-full border-collapse border">
                <thead>
                    <tr><th className="border p-2">Lead Name</th><th className="border p-2">Budget</th><th className="border p-2">Status</th><th className="border p-2">Assigned To</th><th className="border p-2">Reassign</th></tr>
                </thead>
                <tbody>
                    {leads.map((lead) => (
                        <tr key={lead._id}>
                            <td className="border p-2">{lead.name}</td>
                            <td className="border p-2">{lead.budget}</td>
                            <td className="border p-2">{lead.status}</td>
                            <td className="border p-2">{lead.assignedTo?.name || 'Unassigned'}</td>
                            <td className="border p-2">
                                <select
                                    onChange={(e) => assignLead(lead._id, e.target.value)}
                                    defaultValue=""
                                    className="border p-1"
                                >
                                    <option value="" disabled>Select agent</option>
                                    {agents.map(agent => (
                                        <option key={agent._id} value={agent._id}>{agent.name}</option>
                                    ))}
                                </select>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}