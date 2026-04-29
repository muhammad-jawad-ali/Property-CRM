// app/api/leads/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Lead from '@/models/Lead';
import ActivityLog from '@/models/ActivityLog';
import mongoose from 'mongoose';

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const userId = request.headers.get('x-user-id');
        const userRole = request.headers.get('x-user-role');
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: 'Invalid lead ID' }, { status: 400 });
        }

        const body = await request.json();
        await connectToDatabase();

        // Find existing lead to compare changes
        const existingLead = await Lead.findById(id);
        if (!existingLead) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
        }

        // Prevent agent from changing assignedTo
        if (userRole === 'agent' && body.assignedTo && body.assignedTo !== existingLead.assignedTo?.toString()) {
            return NextResponse.json({ error: 'Agents cannot reassign leads' }, { status: 403 });
        }

        // Authorization: agent can only update leads assigned to them
        if (userRole === 'agent' && existingLead.assignedTo?.toString() !== userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // After validating user role and before updating
        if (userRole !== 'admin' && body.assignedTo !== undefined) {
            return NextResponse.json(
                { error: 'Only admin can change lead assignment' },
                { status: 403 }
            );
        }

        // Update lead
        const updatedLead = await Lead.findByIdAndUpdate(id, body, { new: true });

        // Log significant changes (status, assignment, notes)
        if (body.status && body.status !== existingLead.status) {
            await ActivityLog.create({
                leadId: id,
                action: 'Status Updated',
                oldValue: existingLead.status,
                newValue: body.status,
                userId,
            });
        }
        if (body.assignedTo && body.assignedTo !== existingLead.assignedTo?.toString()) {
            await ActivityLog.create({
                leadId: id,
                action: 'Lead Reassigned',
                oldValue: existingLead.assignedTo?.toString() || 'unassigned',
                newValue: body.assignedTo,
                userId,
            });
            // TODO: Send email notification to new agent
        }
        // After saving lead, emit event
        if (global.io) {
            // Notify admin room
            global.io.to('admin').emit('lead-created', lead);
            // Notify assigned agent room if assigned
            if (lead.assignedTo) {
                global.io.to(`agent-${lead.assignedTo}`).emit('lead-assigned', lead);
            }
        }
        if (body.notes && body.notes !== existingLead.notes) {
            await ActivityLog.create({
                leadId: id,
                action: 'Notes Updated',
                oldValue: existingLead.notes,
                newValue: body.notes,
                userId,
            });
        }

        return NextResponse.json(updatedLead);
    } catch (error) {
        console.error('Lead update error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const userId = request.headers.get('x-user-id');
        const userRole = request.headers.get('x-user-role');
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only admin can delete leads
        if (userRole !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const { id } = params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: 'Invalid lead ID' }, { status: 400 });
        }

        await connectToDatabase();
        const deletedLead = await Lead.findByIdAndDelete(id);
        if (!deletedLead) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
        }

        // Log deletion
        await ActivityLog.create({
            leadId: id,
            action: 'Lead Deleted',
            newValue: `Lead "${deletedLead.name}" was deleted`,
            userId,
        });

        return NextResponse.json({ message: 'Lead deleted successfully' });
    } catch (error) {
        console.error('Lead deletion error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
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

        // Log activity
        await ActivityLog.create({
            leadId: lead._id,
            action: 'Lead Created',
            newValue: `Lead "${lead.name}" was created`,
            userId,
        });

        // Send emails
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