'use client';
import { useEffect, useState } from 'react';

interface Lead {
    _id: string;
    name: string;
    email: string;
    phone: string;
    propertyInterest: string;
    budget: number;
    status: string;
    score: string;
    assignedTo: { _id: string; name: string } | null;
    nextFollowUpDate?: string;
}

const statusOptions = ['New', 'Contacted', 'In Progress', 'Closed'];

export default function AgentLeadsPage() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [staleIds, setStaleIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [showFollowUp, setShowFollowUp] = useState<string | null>(null);
    const [followUpDate, setFollowUpDate] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const fetchLeads = async () => {
        const res = await fetch('/api/leads');
        const data = await res.json();
        setLeads(Array.isArray(data) ? data : []);
        setLoading(false);
    };

    const fetchStale = async () => {
        try {
            const res = await fetch('/api/analytics/stale-leads');
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    setStaleIds(data.map((item: any) => item.lead?._id || item._id));
                } else {
                    setStaleIds([]);
                }
            }
        } catch (error) {
            console.error('Error fetching stale leads:', error);
            setStaleIds([]);
        }
    };

    useEffect(() => {
        fetchLeads();
        fetchStale();
        const interval = setInterval(() => { fetchLeads(); fetchStale(); }, 5000);
        return () => clearInterval(interval);
    }, []);

    const updateStatus = async (leadId: string, status: string) => {
        setUpdatingId(leadId);
        await fetch(`/api/leads/${leadId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
        });
        await fetchLeads();
        setUpdatingId(null);
    };

    const setFollowUp = async (leadId: string) => {
        if (!followUpDate) return;
        const res = await fetch('/api/followups', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ leadId, followUpDate }),
        });
        if (res.ok) {
            alert('Follow-up date set successfully!');
            setShowFollowUp(null);
            setFollowUpDate('');
            fetchLeads();
        } else {
            alert('Failed to set follow-up date.');
        }
    };

    const leadsArray = Array.isArray(leads) ? leads : [];
    const filtered = leadsArray.filter(l => !filterStatus || l.status === filterStatus);

    if (loading) return <div className="p-6 text-center text-gray-500">Loading leads…</div>;

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-black">My Leads</h1>
                    <span className="text-xs text-green-600 font-bold bg-green-50 px-3 py-1 rounded-full border border-green-200">
                        ● Live (refreshes every 5s)
                    </span>
                </div>

                {/* Filter bar */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6 flex gap-4 items-end">
                    <div>
                        <label className="block text-xs font-bold text-black mb-1">Status</label>
                        <select
                            className="border border-gray-400 rounded-lg px-3 py-2 text-sm opacity-100 text-black font-medium focus:ring-2 focus:ring-indigo-500 bg-white"
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value)}
                        >
                            <option value="">All</option>
                            {statusOptions.map(s => <option key={s}>{s}</option>)}
                        </select>
                    </div>
                </div>

                {/* Cards */}
                {filtered.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500">
                        No leads found.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filtered.map(lead => (
                            <div
                                key={lead._id}
                                className={`bg-white rounded-xl shadow-sm border overflow-hidden transition hover:shadow-md ${
                                    staleIds.includes(lead._id) ? 'border-gray-300 bg-gray-50' : 'border-gray-100'
                                }`}
                            >
                                <div className="p-5">
                                    <h2 className="text-lg font-bold text-black mb-2">{lead.name}</h2>
                                    <div className="space-y-1 text-sm text-gray-900 mb-4">
                                        <p><span className="font-medium">Email:</span> {lead.email}</p>
                                        <p><span className="font-medium">Phone:</span> {lead.phone}</p>
                                        <p><span className="font-medium">Property:</span> {lead.propertyInterest}</p>
                                        <p><span className="font-medium">Budget:</span> PKR {lead.budget?.toLocaleString()}</p>
                                        <p>
                                            <span className="font-medium">Priority: </span>
                                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                                                lead.score === 'High' ? 'bg-red-100 text-red-800' :
                                                lead.score === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-green-100 text-green-800'
                                            }`}>{lead.score}</span>
                                        </p>
                                        {lead.nextFollowUpDate && (
                                            <p className="text-indigo-600 font-bold bg-indigo-50 px-2 py-1 rounded mt-1 inline-block">
                                                📅 Follow-up: {new Date(lead.nextFollowUpDate).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>

                                    {/* Status update */}
                                    <div className="mb-3">
                                        <label className="block text-xs font-medium text-black mb-1 uppercase tracking-wide">Update Status</label>
                                        <select
                                            value={lead.status}
                                            disabled={updatingId === lead._id}
                                            onChange={e => updateStatus(lead._id, e.target.value)}
                                            className="w-full border border-gray-400 rounded-lg px-3 py-1.5 text-sm opacity-100 text-black font-medium focus:ring-2 focus:ring-indigo-500 bg-white"
                                        >
                                            {statusOptions.map(s => <option key={s}>{s}</option>)}
                                        </select>
                                    </div>

                                    <div className="flex gap-2 mt-3">
                                        <a
                                            href={`https://wa.me/${lead.phone}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 text-center bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 rounded-lg transition"
                                        >
                                            WhatsApp
                                        </a>
                                        <button
                                            onClick={() => setShowFollowUp(lead._id)}
                                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2 rounded-lg transition"
                                        >
                                            Follow-up
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Follow-up Modal */}
            {showFollowUp && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-96 shadow-xl border border-gray-200">
                        <h3 className="text-lg font-bold text-black mb-4">Set Follow-up Date</h3>
                        <input
                            type="date"
                            className="w-full border border-gray-400 rounded-lg p-2 mb-4 text-black font-bold focus:ring-2 focus:ring-indigo-500"
                            value={followUpDate}
                            onChange={e => setFollowUpDate(e.target.value)}
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => setFollowUp(showFollowUp)}
                                className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
                            >
                                Save
                            </button>
                            <button
                                onClick={() => { setShowFollowUp(null); setFollowUpDate(''); }}
                                className="flex-1 bg-gray-200 text-black py-2 rounded-lg hover:bg-gray-300 font-bold border border-gray-400"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
