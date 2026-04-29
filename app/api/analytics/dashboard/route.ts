import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Lead from '@/models/Lead';
import User from '@/models/User';

export async function GET(request: NextRequest) {
    try {
        const userRole = request.headers.get('x-user-role');
        if (userRole !== 'admin') {
            return NextResponse.json({ error: 'Admin only' }, { status: 403 });
        }

        await connectToDatabase();

        // Total leads
        const totalLeads = await Lead.countDocuments();

        // Distribution by status
        const statusDistribution = await Lead.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        // Distribution by priority (score)
        const priorityDistribution = await Lead.aggregate([
            { $group: { _id: '$score', count: { $sum: 1 } } }
        ]);

        // Agent performance: leads handled per agent
        const agents = await User.find({ role: 'agent' }).select('name email');
        const agentPerformance = await Promise.all(agents.map(async (agent) => {
            const totalAssigned = await Lead.countDocuments({ assignedTo: agent._id });
            const completed = await Lead.countDocuments({ assignedTo: agent._id, status: 'Closed' });
            const inProgress = await Lead.countDocuments({ assignedTo: agent._id, status: 'In Progress' });
            return {
                agentId: agent._id,
                name: agent.name,
                email: agent.email,
                totalAssigned,
                completed,
                inProgress,
                completionRate: totalAssigned > 0 ? (completed / totalAssigned * 100).toFixed(1) : 0,
            };
        }));

        return NextResponse.json({
            totalLeads,
            statusDistribution,
            priorityDistribution,
            agentPerformance,
        });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}