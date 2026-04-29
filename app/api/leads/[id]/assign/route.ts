import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Lead from '@/models/Lead';
import ActivityLog from '@/models/ActivityLog';
import User from '@/models/User';
import { sendLeadAssignmentEmail } from '@/lib/email';
import mongoose from 'mongoose';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const userId = request.headers.get('x-user-id');
        const userRole = request.headers.get('x-user-role');
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (userRole !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 });

        const { id } = params;
        const { agentId } = await request.json();
        if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(agentId)) {
            return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
        }

        await connectToDatabase();

        const lead = await Lead.findById(id);
        if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

        const oldAgent = lead.assignedTo;
        lead.assignedTo = agentId;
        await lead.save();

        await ActivityLog.create({
            leadId: id,
            action: 'Lead Assigned',
            oldValue: oldAgent ? oldAgent.toString() : 'unassigned',
            newValue: agentId,
            userId,
        });

        const agent = await User.findById(agentId).select('email name');
        if (agent) {
            const adminEmail = request.headers.get('x-user-email') || 'Admin';
            await sendLeadAssignmentEmail(lead.name, agent.email, adminEmail);
        }

        return NextResponse.json({ message: 'Lead assigned successfully', lead });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}