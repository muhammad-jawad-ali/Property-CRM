'use client';
import { useCallback, useState } from 'react';
import { useRealtimeLeads } from '@/hooks/useRealtimeLeads';
import ActivityTimeline from '@/components/ActivityTimeline';

interface Lead {
    _id: string;
    name: string;
    email: string;
    phone: string;
    budget: number;
    status: string;
    score: string;
    propertyInterest: string;
    createdAt: string;
}

interface FollowUp {
    _id: string;
    leadId: { _id: string; name: string };
    followUpDate: string;
    completed: boolean;
    notes: string;
}

export default function AgentDashboard() {
    const [statusFilter, setStatusFilter] = useState<string>('All');
    const [priorityFilter, setPriorityFilter] = useState<string>('All');

    const fetchLeads = useCallback(() => fetch('/api/leads').then(res => res.json()), []);
    const { data: leads, loading: leadsLoading } = useRealtimeLeads<Lead[]>(fetchLeads, 5000);

    const fetchFollowUps = useCallback(() => fetch('/api/followups').then(res => res.json()), []);
    const { data: followUps, refetch: refetchFollowUps } = useRealtimeLeads<FollowUp[]>(fetchFollowUps, 5000);

    const scheduleFollowUp = async (leadId: string) => {
        const dateStr = prompt('Enter follow-up date (YYYY-MM-DD):');
        if (!dateStr) return;
        const notes = prompt('Enter notes for follow-up:');
        
        await fetch('/api/followups', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ leadId, followUpDate: dateStr, notes: notes || '' }),
        });
        refetchFollowUps();
    };

    if (leadsLoading && !leads) return <div className="p-4">Loading your dashboard...</div>;

    const isStale = (createdAt: string) => {
        const daysOld = (Date.now() - new Date(createdAt).getTime()) / (1000 * 3600 * 24);
        return daysOld > 3;
    };

    const getOverdueFollowUp = (leadId: string) => {
        if (!followUps) return null;
        return followUps.find(f => 
            f.leadId?._id === leadId && 
            !f.completed && 
            new Date(f.followUpDate) < new Date()
        );
    };

    const filteredLeads = leads?.filter(lead => {
        if (statusFilter !== 'All' && lead.status !== statusFilter) return false;
        if (priorityFilter !== 'All' && (lead.score || 'Low') !== priorityFilter) return false;
        return true;
    });

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">My Assigned Leads <span className="text-sm font-normal text-green-500">(Live Updates)</span></h1>
            
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

            {!filteredLeads || filteredLeads.length === 0 ? (
                <p>No leads found.</p>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {filteredLeads.map(lead => {
                        const stale = isStale(lead.createdAt);
                        const overdue = getOverdueFollowUp(lead._id);
                        
                        return (
                        <div key={lead._id} className={`border p-5 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow relative ${stale || overdue ? 'border-red-500 border-2' : ''}`}>
                            
                            <div className="flex justify-between items-start">
                                <h2 className="text-xl font-bold text-gray-800">{lead.name}</h2>
                                {overdue && <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded">Overdue Follow-up!</span>}
                                {!overdue && stale && <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2 py-1 rounded">Stale Lead (&gt;3 days)</span>}
                            </div>
                            
                            <div className="mt-3 space-y-1 text-sm text-gray-600">
                                <p><span className="font-semibold">Email:</span> {lead.email}</p>
                                <p><span className="font-semibold">Phone:</span> {lead.phone}</p>
                                <p><span className="font-semibold">Property:</span> {lead.propertyInterest}</p>
                                <p><span className="font-semibold">Budget:</span> PKR {lead.budget.toLocaleString()}</p>
                            </div>
                            
                            <div className="mt-4 flex flex-wrap gap-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${lead.score === 'High' ? 'bg-red-500' : lead.score === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'}`}>
                                    {lead.score || 'Low'} Priority
                                </span>
                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                                    {lead.status}
                                </span>
                            </div>

                            <details className="mt-4 cursor-pointer text-sm">
                                <summary className="font-semibold text-blue-600 hover:text-blue-800">View Activity & Audit Trail</summary>
                                <div className="mt-2 p-3 bg-gray-50 rounded border">
                                    <ActivityTimeline leadId={lead._id} />
                                </div>
                            </details>

                            <div className="mt-5 pt-4 border-t border-gray-100 flex justify-between items-center">
                                <button 
                                    onClick={() => scheduleFollowUp(lead._id)}
                                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                                >
                                    + Set Follow-up
                                </button>
                                <a 
                                    href={`https://wa.me/923316110109`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors flex items-center"
                                >
                                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                                    WhatsApp
                                </a>
                            </div>
                        </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}