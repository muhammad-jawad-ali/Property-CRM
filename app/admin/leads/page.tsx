'use client';
import { useEffect, useState } from 'react';
import { useRealtimeLeads } from '@/hooks/useRealtimeLeads';

interface Agent {
    _id: string;
    name: string;
    email: string;
}

interface Lead {
    _id: string;
    name: string;
    email: string;
    phone: string;
    propertyInterest: string;
    budget: number;
    status: string;
    score: string;
    notes: string;
    assignedTo: { _id: string; name: string } | null;
    createdAt: string;
    nextFollowUpDate?: string;
}

export default function AdminLeadsPage() {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [filterStatus, setFilterStatus] = useState('');
    const [filterPriority, setFilterPriority] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newLead, setNewLead] = useState({
        name: '',
        email: '',
        phone: '',
        propertyInterest: '',
        budget: '',
        status: 'New',
        notes: '',
    });
    const fetchLeads = async () => {
        const res = await fetch('/api/leads');
        const data = await res.json();
        return data;
    };

    const { data: allLeads, loading, error, refetch } = useRealtimeLeads<Lead[]>(
        fetchLeads,
        10000 // Poll every 10 seconds to reduce UI flickering during interaction
    );

    useEffect(() => {
        fetch('/api/users?role=agent')
            .then(res => res.json())
            .then(data => setAgents(Array.isArray(data) ? data : []))
            .catch(err => {
                console.error('Error fetching agents:', err);
                setAgents([]);
            });
    }, []);

    const assignLead = async (leadId: string, agentId: string) => {
        if (!confirm('Are you sure you want to change the agent assignment?')) return;
        
        const res = await fetch(`/api/leads/${leadId}/assign`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ agentId }),
        });
        
        if (res.ok) {
            alert('Lead assigned successfully!');
            refetch();
        } else {
            alert('Failed to assign lead.');
        }
    };

    const updateLeadField = async (leadId: string, field: string, value: string) => {
        if (!confirm(`Are you sure you want to update the lead ${field}?`)) return;

        const res = await fetch(`/api/leads/${leadId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ [field]: value }),
        });

        if (res.ok) {
            alert(`Lead ${field} updated successfully!`);
            refetch();
        } else {
            alert(`Failed to update lead ${field}.`);
        }
    };

    const deleteLead = async (leadId: string) => {
        if (confirm('Delete this lead? This action cannot be undone.')) {
            const res = await fetch(`/api/leads/${leadId}`, { method: 'DELETE' });
            if (res.ok) {
                alert('Lead deleted successfully!');
                refetch();
            } else {
                alert('Failed to delete lead.');
            }
        }
    };

    const createLead = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch('/api/leads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...newLead,
                budget: Number(newLead.budget),
            }),
        });
        if (res.ok) {
            alert('Lead created successfully!');
            setShowCreateModal(false);
            setNewLead({ name: '', email: '', phone: '', propertyInterest: '', budget: '', status: 'New', notes: '' });
            refetch();
        } else {
            const errorData = await res.json();
            alert(`Failed to create lead: ${errorData.error || 'Unknown error'}${errorData.details ? '\n' + JSON.stringify(errorData.details) : ''}`);
        }
    };

    const leadsArray = Array.isArray(allLeads) ? allLeads : [];
    const filteredLeads = leadsArray.filter(lead => {
        if (filterStatus && lead.status !== filterStatus) return false;
        if (filterPriority && lead.score !== filterPriority) return false;
        return true;
    });

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Leads Management</h1>
                    {error && <span className="text-red-500 text-xs font-bold bg-red-50 px-2 py-1 rounded">Update Error: {error}</span>}
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-sm transition flex items-center gap-2 font-bold"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        New Lead
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6 flex flex-wrap gap-4 items-end">
                    <div>
                        <label className="block text-xs font-bold text-black mb-1">Status</label>
                        <select
                            className="border border-gray-400 rounded-lg px-3 py-2 text-sm text-black font-bold focus:ring-indigo-500 focus:border-indigo-500 opacity-100 bg-white"
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value)}
                        >
                            <option value="">All Status</option>
                            <option>New</option>
                            <option>Contacted</option>
                            <option>In Progress</option>
                            <option>Closed</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-black mb-1">Priority</label>
                        <select
                            className="border border-gray-400 rounded-lg px-3 py-2 text-sm text-black font-bold focus:ring-indigo-500 focus:border-indigo-500 opacity-100 bg-white"
                            value={filterPriority}
                            onChange={e => setFilterPriority(e.target.value)}
                        >
                            <option value="">All Priority</option>
                            <option>High</option>
                            <option>Medium</option>
                            <option>Low</option>
                        </select>
                    </div>
                    <button
                        onClick={() => refetch()}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm transition font-bold"
                    >
                        Refresh
                    </button>
                </div>

                {/* Leads Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Budget</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Priority</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Follow-up</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Assigned To</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {loading && !allLeads ? (
                                    <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Loading leads...</td></tr>
                                ) : filteredLeads.length === 0 ? (
                                    <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No leads found</td></tr>
                                ) : (
                                    filteredLeads.map(lead => (
                                        <tr key={lead._id} className="hover:bg-gray-50 transition">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{lead.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">PKR {lead.budget.toLocaleString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <select
                                                    value={lead.score}
                                                    onChange={(e) => updateLeadField(lead._id, 'score', e.target.value)}
                                                    className={`px-2 py-1 text-xs font-bold rounded-full border border-gray-300 ${
                                                        lead.score === 'High' ? 'bg-red-50 text-red-800' :
                                                        lead.score === 'Medium' ? 'bg-yellow-50 text-yellow-800' :
                                                        'bg-green-50 text-green-800'
                                                    }`}
                                                >
                                                    <option>High</option>
                                                    <option>Medium</option>
                                                    <option>Low</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                <select
                                                    value={lead.status}
                                                    onChange={(e) => updateLeadField(lead._id, 'status', e.target.value)}
                                                    className="border border-gray-300 rounded-lg px-2 py-1 text-xs font-bold text-black bg-white"
                                                >
                                                    <option>New</option>
                                                    <option>Contacted</option>
                                                    <option>In Progress</option>
                                                    <option>Closed</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-indigo-600">
                                                {lead.nextFollowUpDate ? new Date(lead.nextFollowUpDate).toLocaleDateString() : '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                <div className="flex flex-col gap-1">
                                                    <select
                                                        onChange={(e) => assignLead(lead._id, e.target.value)}
                                                        value={lead.assignedTo?._id || ''}
                                                        className="border border-gray-400 rounded-lg px-2 py-1.5 text-xs font-bold text-black opacity-100 focus:ring-2 focus:ring-indigo-500 bg-white"
                                                    >
                                                        <option value="">Unassigned</option>
                                                        {agents.map(agent => (
                                                            <option key={agent._id} value={agent._id}>{agent.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                                                <div className="flex items-center gap-2">
                                                    <a
                                                        href={`https://wa.me/${lead.phone}`}
                                                        target="_blank"
                                                        className="text-green-600 hover:text-green-800 font-bold"
                                                    >
                                                        WhatsApp
                                                    </a>
                                                    <button
                                                        onClick={() => deleteLead(lead._id)}
                                                        className="text-red-600 hover:text-red-800 font-bold"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Create Lead Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold mb-4 text-black">Create New Lead</h2>
                        <form onSubmit={createLead} className="space-y-4">
                            <input
                                type="text"
                                placeholder="Full Name *"
                                className="w-full border border-gray-400 rounded-lg p-2 text-black placeholder-gray-400 focus:ring-indigo-500 focus:border-indigo-500"
                                value={newLead.name}
                                onChange={e => setNewLead({ ...newLead, name: e.target.value })}
                                required
                            />
                            <input
                                type="email"
                                placeholder="Email *"
                                className="w-full border border-gray-400 rounded-lg p-2 text-black placeholder-gray-400"
                                value={newLead.email}
                                onChange={e => setNewLead({ ...newLead, email: e.target.value })}
                                required
                            />
                            <input
                                type="tel"
                                placeholder="Phone (international format, without +) *"
                                className="w-full border border-gray-400 rounded-lg p-2 text-black placeholder-gray-400"
                                value={newLead.phone}
                                onChange={e => setNewLead({ ...newLead, phone: e.target.value })}
                                required
                            />
                            <input
                                type="text"
                                placeholder="Property Interest *"
                                className="w-full border border-gray-400 rounded-lg p-2 text-black placeholder-gray-400"
                                value={newLead.propertyInterest}
                                onChange={e => setNewLead({ ...newLead, propertyInterest: e.target.value })}
                                required
                            />
                            <input
                                type="number"
                                placeholder="Budget (PKR) *"
                                className="w-full border border-gray-400 rounded-lg p-2 text-black placeholder-gray-400"
                                value={newLead.budget}
                                onChange={e => setNewLead({ ...newLead, budget: e.target.value })}
                                required
                            />
                            <select
                                className="w-full border border-gray-400 rounded-lg p-2 text-black opacity-100 font-bold"
                                value={newLead.status}
                                onChange={e => setNewLead({ ...newLead, status: e.target.value })}
                            >
                                <option>New</option>
                                <option>Contacted</option>
                                <option>In Progress</option>
                                <option>Closed</option>
                            </select>
                            <textarea
                                placeholder="Notes (optional)"
                                className="w-full border border-gray-400 rounded-lg p-2 text-black placeholder-gray-400"
                                rows={3}
                                value={newLead.notes}
                                onChange={e => setNewLead({ ...newLead, notes: e.target.value })}
                            />
                            <div className="flex gap-3 pt-2">
                                <button type="submit" className="flex-1 bg-indigo-600 text-white py-2 font-bold rounded-lg hover:bg-indigo-700">Create</button>
                                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 border border-gray-400 py-2 font-bold rounded-lg hover:bg-gray-50 text-black">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}