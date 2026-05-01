'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRealtimeLeads } from '@/hooks/useRealtimeLeads';

interface Lead {
    _id: string;
    name: string;
    email: string;
    phone: string;
    budget: number;
    status: string;
    score?: string;
    assignedTo: { _id: string; name: string } | null;
}

interface Agent {
    _id: string;
    name: string;
    email: string;
}

export default function AdminLeadsPage() {
    const [agents, setAgents] = useState<Agent[]>([]);

    const [statusFilter, setStatusFilter] = useState<string>('All');
    const [priorityFilter, setPriorityFilter] = useState<string>('All');

    const fetchLeads = useCallback(() => fetch('/api/leads').then(res => res.json()), []);
    const { data: leads, loading, refetch } = useRealtimeLeads<Lead[]>(fetchLeads, 5000);

    useEffect(() => {
        const fetchAgents = async () => {
            const res = await fetch('/api/users?role=agent');
            const data = await res.json();
            setAgents(data);
        };
        fetchAgents();
    }, []);

    const assignLead = async (leadId: string, agentId: string) => {
        const res = await fetch(`/api/leads/${leadId}/assign`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ agentId }),
        });
        if (res.ok) {
            refetch(); // refresh list immediately
        } else {
            alert('Assignment failed');
        }
    };

    if (loading && !leads) return <div className="p-6">Loading leads...</div>;

    const filteredLeads = leads?.filter(lead => {
        if (statusFilter !== 'All' && lead.status !== statusFilter) return false;
        if (priorityFilter !== 'All' && (lead.score || 'Low') !== priorityFilter) return false;
        return true;
    });

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Manage Leads <span className="text-sm font-normal text-green-500">(Live Updates)</span></h1>
                <a 
                    href="/api/leads/export" 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow text-sm font-medium transition-colors flex items-center"
                >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Export to CSV
                </a>
            </div>
            
            <div className="flex gap-4 mb-6 bg-gray-50 p-3 rounded border">
                <div>
                    <label className="text-sm font-semibold mr-2">Status:</label>
                    <select className="border p-1 rounded text-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                        <option value="All">All</option>
                        <option value="New">New</option>
                        <option value="Contacted">Contacted</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Closed">Closed</option>
                    </select>
                </div>
                <div>
                    <label className="text-sm font-semibold mr-2">Priority:</label>
                    <select className="border p-1 rounded text-sm" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
                        <option value="All">All</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full border-collapse border bg-white shadow-sm rounded-lg overflow-hidden">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="border p-3 text-left">Lead Info</th>
                            <th className="border p-3 text-left">Budget</th>
                            <th className="border p-3 text-left">Priority</th>
                            <th className="border p-3 text-left">Status</th>
                            <th className="border p-3 text-left">Assigned To</th>
                            <th className="border p-3 text-left">Reassign</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLeads?.map((lead) => (
                            <tr key={lead._id} className="hover:bg-gray-50">
                                <td className="border p-3">
                                    <div className="font-medium text-gray-900">{lead.name}</div>
                                    <div className="text-xs text-gray-500">{lead.email}</div>
                                    {lead.phone && (
                                        <a 
                                            href={`https://wa.me/923316110109`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center mt-1 text-xs text-green-600 hover:text-green-800"
                                        >
                                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                                            WhatsApp
                                        </a>
                                    )}
                                </td>
                                <td className="border p-3 text-sm">PKR {lead.budget.toLocaleString()}</td>
                                <td className="border p-3">
                                    <span className={`px-2 py-1 text-xs font-bold rounded-full text-white ${
                                        lead.score === 'High' ? 'bg-red-500' :
                                        lead.score === 'Medium' ? 'bg-yellow-500' :
                                        lead.score === 'Low' ? 'bg-green-500' : 'bg-gray-400'
                                    }`}>
                                        {lead.score || 'Low'}
                                    </span>
                                </td>
                                <td className="border p-3">
                                    <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800 font-semibold">{lead.status}</span>
                                </td>
                                <td className="border p-3 text-sm">{lead.assignedTo?.name || <span className="text-gray-400 italic">Unassigned</span>}</td>
                                <td className="border p-3">
                                    <select
                                        onChange={(e) => assignLead(lead._id, e.target.value)}
                                        value={lead.assignedTo?._id || ""}
                                        className="border p-1 rounded text-sm bg-gray-50 focus:ring-blue-500 focus:border-blue-500 w-full"
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