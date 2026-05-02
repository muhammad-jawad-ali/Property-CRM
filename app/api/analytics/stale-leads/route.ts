import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Lead from '@/models/Lead';
import FollowUp from '@/models/FollowUp';
import ActivityLog from '@/models/ActivityLog';

export async function GET(request: NextRequest) {
    try {
        const userId = request.headers.get('x-user-id');
        const userRole = request.headers.get('x-user-role');
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectToDatabase();

        const now = new Date();
        const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

        // 1. Overdue follow-ups (followUpDate < now)
        const overdueFollowups = await FollowUp.find({
            followUpDate: { $lt: now },
            completed: false,
            ...(userRole === 'agent' ? { agentId: userId } : {}),
        }).populate('leadId');

        // 2. Inactive leads (no activity log in last 3 days)
        const activeLeadIds = await ActivityLog.distinct('leadId', {
            timestamp: { $gte: threeDaysAgo },
        });
        const inactiveLeads = await Lead.find({
            _id: { $nin: activeLeadIds },
            ...(userRole === 'agent' ? { assignedTo: userId } : {}),
        });

        // Combine and return
        const staleLeads = [
            ...overdueFollowups.map(f => ({ lead: f.leadId, reason: 'Overdue follow-up' })),
            ...inactiveLeads.map(l => ({ lead: l, reason: 'No activity for 3 days' })),
        ];

        return NextResponse.json(staleLeads);
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}