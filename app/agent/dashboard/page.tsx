'use client';
import { useEffect, useState } from 'react';

interface Lead {
    _id: string;
    name: string;
    email: string;
    phone: string;
    budget: number;
    status: string;
    score: string;
    propertyInterest: string;
}

export default function AgentDashboard() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/leads')
            .then(res => res.json())
            .then(data => {
                setLeads(data);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="p-4">Loading your leads...</div>;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">My Assigned Leads</h1>
            {leads.length === 0 ? (
                <p>No leads assigned yet.</p>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {leads.map(lead => (
                        <div key={lead._id} className="border p-4 rounded shadow">
                            <h2 className="text-xl font-semibold">{lead.name}</h2>
                            <p>Email: {lead.email}</p>
                            <p>Phone: {lead.phone}</p>
                            <p>Property: {lead.propertyInterest}</p>
                            <p>Budget: PKR {lead.budget.toLocaleString()}</p>
                            <p>Priority: <span className={`px-2 py-1 rounded text-white ${lead.score === 'High' ? 'bg-red-500' : lead.score === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'}`}>{lead.score}</span></p>
                            <p>Status: {lead.status}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}