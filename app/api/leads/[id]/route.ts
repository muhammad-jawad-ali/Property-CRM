import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Lead from '@/models/Lead';
import ActivityLog from '@/models/ActivityLog';
import User from '@/models/User';
import { validateBody, LeadSchema } from '@/lib/validation';
import { sendNewLeadEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
    try {
        const userId = request.headers.get('x-user-id');
        const userRole = request.headers.get('x-user-role');
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data, errors } = await validateBody(request, LeadSchema);
        if (errors) return NextResponse.json({ error: 'Validation failed', details: errors }, { status: 400 });

        await connectToDatabase();

        const leadData = {
            ...data,
            assignedTo: userRole === 'agent' ? userId : (data.assignedTo || null),
        };
        const lead = await Lead.create(leadData);

        await ActivityLog.create({
            leadId: lead._id,
            action: 'Lead Created',
            newValue: `Lead "${lead.name}" was created`,
            userId,
        });

        if (lead.assignedTo) {
            const assignedAgent = await User.findById(lead.assignedTo).select('email');
            if (assignedAgent) await sendNewLeadEmail(lead, assignedAgent.email);
        } else {
            await sendNewLeadEmail(lead);
        }

        return NextResponse.json(lead, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const userId = request.headers.get('x-user-id');
        const userRole = request.headers.get('x-user-role');
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectToDatabase();
        let leads;
        if (userRole === 'admin') {
            leads = await Lead.find().populate('assignedTo', 'name email');
        } else {
            leads = await Lead.find({ assignedTo: userId }).populate('assignedTo', 'name email');
        }
        return NextResponse.json(leads);
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}