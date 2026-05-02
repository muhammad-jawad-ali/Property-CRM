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

export default function AgentDashboard() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [staleIds, setStaleIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [showFollowUp, setShowFollowUp] = useState<string | null>(null);
    const [followUpDate, setFollowUpDate] = useState('');

    const fetchLeads = async () => {
        const res = await fetch('/api/leads');
        const data = await res.json();
        setLeads(Array.isArray(data) ? data : []);
        setLoading(false);
    };

    const fetchStaleLeads = async () => {
        try {
            const res = await fetch('/api/analytics/stale-leads');
            const data = await res.json();
            if (Array.isArray(data)) {
                setStaleIds(data.map((item: any) => item.lead?._id || item._id));
            } else {
                setStaleIds([]);
            }
        } catch (error) {
            console.error('Error fetching stale leads:', error);
            setStaleIds([]);
        }
    };

    useEffect(() => {
        fetchLeads();
        fetchStaleLeads();
        // Poll every 5 seconds (real‑time)
        const interval = setInterval(() => {
            fetchLeads();
            fetchStaleLeads();
        }, 5000);
        return () => clearInterval(interval);
    }, []);

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
            fetchLeads(); // refresh
        } else {
            alert('Failed to set follow-up date.');
        }
    };

    if (loading) return <div className="p-6 text-center text-black font-bold">Loading your workspace...</div>;

    // Calculate Stats
    const totalLeads = leads.length;
    const highPriorityCount = leads.filter(l => l.score === 'High').length;
    const staleCount = staleIds.length;
    
    const today = new Date().toLocaleDateString();
    const todaysFollowUps = leads.filter(l => l.nextFollowUpDate && new Date(l.nextFollowUpDate).toLocaleDateString() === today).length;

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-black">Agent Dashboard</h1>
                        <p className="text-gray-600 font-medium">Welcome back! Here is an overview of your active leads.</p>
                    </div>
                    <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-200 flex items-center gap-3">
                        <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                        <span className="text-sm font-bold text-black">Live Updates Active</span>
                    </div>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition hover:shadow-md">
                        <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Total Assigned</p>
                        <p className="text-3xl font-black text-black">{totalLeads}</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition hover:shadow-md">
                        <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">High Priority</p>
                        <p className="text-3xl font-black text-black">{highPriorityCount}</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition hover:shadow-md">
                        <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Stale Leads</p>
                        <p className="text-3xl font-black text-black">{staleCount}</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition hover:shadow-md">
                        <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Today's Follow-ups</p>
                        <p className="text-3xl font-black text-black">{todaysFollowUps}</p>
                    </div>
                </div>

                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-black">Detailed Lead List</h2>
                </div>

                {leads.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-dashed border-gray-300">
                        <div className="text-gray-400 mb-4">
                            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <p className="text-xl font-bold text-black mb-1">No leads assigned yet</p>
                        <p className="text-gray-500">Once an admin assigns you leads, they will appear here.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {leads.map(lead => (
                            <div
                                key={lead._id}
                                className={`bg-white rounded-2xl shadow-sm border-2 overflow-hidden transition hover:shadow-lg ${
                                    staleIds.includes(lead._id) ? 'border-gray-300 bg-gray-50' : 'border-gray-100'
                                }`}
                            >
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-lg font-bold text-black leading-tight">{lead.name}</h3>
                                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                                            lead.score === 'High' ? 'bg-red-100 text-red-700' :
                                            lead.score === 'Medium' ? 'bg-amber-100 text-amber-700' :
                                            'bg-green-100 text-green-700'
                                        }`}>
                                            {lead.score}
                                        </span>
                                    </div>
                                    
                                    <div className="space-y-3 text-sm mb-6">
                                        <div className="flex items-center gap-3 text-gray-700">
                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                            <span className="font-medium truncate">{lead.email}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-gray-700">
                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                            <span className="font-medium">{lead.phone}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-gray-700">
                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                            <span className="font-medium">{lead.propertyInterest}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl mb-6">
                                        <span className="text-[10px] font-bold text-gray-500 uppercase">Current Status</span>
                                        <span className="text-sm font-bold text-black">{lead.status}</span>
                                    </div>

                                    {lead.nextFollowUpDate && (
                                        <div className="mb-6 p-3 bg-indigo-50 rounded-xl border border-indigo-100 flex items-center gap-3">
                                            <div className="bg-indigo-600 p-1.5 rounded-lg text-white">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-indigo-600 uppercase">Next Follow-up</p>
                                                <p className="text-sm font-bold text-indigo-900">{new Date(lead.nextFollowUpDate).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-3">
                                        <a
                                            href={`https://wa.me/${lead.phone}`}
                                            target="_blank"
                                            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold py-3 rounded-xl transition shadow-sm hover:shadow"
                                        >
                                            WhatsApp
                                        </a>
                                        <button
                                            onClick={() => setShowFollowUp(lead._id)}
                                            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold py-3 rounded-xl transition shadow-sm hover:shadow"
                                        >
                                            Set Follow-up
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
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-gray-100">
                        <div className="bg-indigo-100 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 text-indigo-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                        <h3 className="text-2xl font-bold text-black mb-2">Schedule Follow-up</h3>
                        <p className="text-gray-500 mb-6 font-medium">When would you like to contact this lead again?</p>
                        
                        <input
                            type="date"
                            className="w-full border-2 border-gray-100 rounded-2xl p-4 mb-6 text-black font-bold focus:border-indigo-500 focus:outline-none transition bg-gray-50"
                            value={followUpDate}
                            onChange={(e) => setFollowUpDate(e.target.value)}
                        />
                        
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setFollowUp(showFollowUp)}
                                className="bg-indigo-600 text-white py-4 rounded-2xl hover:bg-indigo-700 font-bold transition shadow-lg shadow-indigo-200"
                            >
                                Confirm
                            </button>
                            <button
                                onClick={() => setShowFollowUp(null)}
                                className="bg-gray-100 text-gray-600 py-4 rounded-2xl hover:bg-gray-200 font-bold transition"
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