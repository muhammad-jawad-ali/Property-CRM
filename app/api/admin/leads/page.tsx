'use client';
import { useEffect, useState } from 'react';
import { useRealtimeLeads } from '@/hooks/useRealtimeLeads';

interface Lead {
    _id: string;
    name: string;
    email: string;
    budget: number;
    status: string;
    score: string;
    assignedTo: { _id: string; name: string } | null;
}

interface Agent {
    _id: string;
    name: string;
}

export default function AdminLeadsPage() {
    const [agents, setAgents] = useState<Agent[]>([]);

    // Real‑time leads – refetches every 5 seconds
    const { data: leads, loading, refetch } = useRealtimeLeads<Lead[]>(
        () => fetch('/api/leads').then(res => res.json()),
        5000
    );

    useEffect(() => {
        fetchAgents();
    }, []);

    const fetchAgents = async () => {
        const res = await fetch('/api/users?role=agent');
        const agentsData = await res.json();
        setAgents(agentsData);
    };

    const assignLead = async (leadId: string, agentId: string) => {
        const res = await fetch(`/api/leads/${leadId}/assign`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ agentId }),
        });
        if (res.ok) {
            refetch(); // Immediate refresh after assignment
        } else {
            alert('Assignment failed');
        }
    };

    if (loading && !leads) return <div className="p-4">Loading leads...</div>;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">All Leads (Real‑time Updates)</h1>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white border">
                    <thead>
                        <tr>
                            <th className="border px-4 py-2">Name</th>
                            <th className="border px-4 py-2">Budget</th>
                            <th className="border px-4 py-2">Priority</th>
                            <th className="border px-4 py-2">Status</th>
                            <th className="border px-4 py-2">Assigned To</th>
                            <th className="border px-4 py-2">Reassign</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leads?.map(lead => (
                            <tr key={lead._id}>
                                <td className="border px-4 py-2">{lead.name}</td>
                                <td className="border px-4 py-2">{lead.budget}</td>
                                <td className="border px-4 py-2">
                                    <span className={`px-2 py-1 rounded text-white ${lead.score === 'High' ? 'bg-red-500' :
                                            lead.score === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'
                                        }`}>
                                        {lead.score}
                                    </span>
                                </td>
                                <td className="border px-4 py-2">{lead.status}</td>
                                <td className="border px-4 py-2">{lead.assignedTo?.name || 'Unassigned'}</td>
                                <td className="border px-4 py-2">
                                    <select
                                        onChange={(e) => assignLead(lead._id, e.target.value)}
                                        defaultValue=""
                                        className="border p-1 rounded"
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
        </div>
    );
}