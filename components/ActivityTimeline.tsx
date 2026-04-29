'use client';
import { useEffect, useState } from 'react';

interface Activity {
    _id: string;
    action: string;
    oldValue: string;
    newValue: string;
    timestamp: string;
    userId: { name: string; email: string };
}

export default function ActivityTimeline({ leadId }: { leadId: string }) {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/leads/${leadId}/activities`)
            .then(res => res.json())
            .then(data => {
                setActivities(data);
                setLoading(false);
            });
    }, [leadId]);

    if (loading) return <div>Loading timeline...</div>;

    return (
        <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Activity Timeline</h3>
            {activities.length === 0 ? (
                <p>No activities recorded yet.</p>
            ) : (
                <ul className="space-y-2">
                    {activities.map(act => (
                        <li key={act._id} className="border-l-4 border-blue-500 pl-3 py-1">
                            <p className="text-sm text-gray-600">
                                {new Date(act.timestamp).toLocaleString()}
                            </p>
                            <p className="font-medium">{act.action}</p>
                            {act.oldValue && (
                                <p className="text-sm">From: {act.oldValue} → To: {act.newValue}</p>
                            )}
                            <p className="text-xs text-gray-500">By: {act.userId?.name || 'System'}</p>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}