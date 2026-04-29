'use client';
import { useRealtimeLeads } from '@/hooks/useRealtimeLeads';

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
    const { data: leads, loading } = useRealtimeLeads<Lead[]>(
        () => fetch('/api/leads').then(res => res.json()),
        5000
    );

    if (loading && !leads) return <div className="p-4">Loading your leads...</div>;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">My Assigned Leads (Real‑time)</h1>
            {leads?.length === 0 ? (
                <p>No leads assigned yet. New assignments will appear automatically.</p>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {leads?.map(lead => (
                        <div key={lead._id} className="border p-4 rounded shadow">
                            <h2 className="text-xl font-semibold">{lead.name}</h2>
                            <p>Email: {lead.email}</p>
                            <p>Phone: {lead.phone}</p>
                            <p>Property Interest: {lead.propertyInterest}</p>
                            <p>Budget: PKR {lead.budget.toLocaleString()}</p>
                            <p>
                                Priority:
                                <span className={`ml-2 px-2 py-1 rounded text-white ${lead.score === 'High' ? 'bg-red-500' :
                                    lead.score === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'
                                    }`}>
                                    {lead.score}
                                </span>
                            </p>
                            <p>Status: {lead.status}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

const [staleLeads, setStaleLeads] = useState<string[]>([]);

useEffect(() => {
    fetch('/api/analytics/stale-leads')
        .then(res => res.json())
        .then(data => {
            // data is array of { lead: { _id }, reason }
            const staleIds = data.map((item: any) => item.lead._id);
            setStaleLeads(staleIds);
        });
}, []);

<div key={lead._id} className={`border p-4 rounded shadow ${staleLeads.includes(lead._id) ? 'bg-red-50 border-red-500' : ''}`}>
    {staleLeads.includes(lead._id) && (
        <div className="bg-red-100 text-red-700 p-1 mb-2 text-sm rounded">⚠️ Stale – needs attention</div>
    )}
    {/* rest of lead info */}
    <button
        onClick={() => {
            const date = prompt('Enter follow-up date (YYYY-MM-DD)');
            if (date) {
                fetch('/api/followups', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ leadId: lead._id, followUpDate: date }),
                });
            }
        }}
        className="mt-2 bg-blue-500 text-white px-2 py-1 rounded text-sm"
    >
        Set Follow-up
    </button>
</div>