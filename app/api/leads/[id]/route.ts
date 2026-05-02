import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import Lead from '@/models/Lead';
import ActivityLog from '@/models/ActivityLog';

export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const userId = request.headers.get('x-user-id');
        const userRole = request.headers.get('x-user-role');
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await context.params;
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

        // Auto-calculate score if budget is updated (because findByIdAndUpdate bypasses pre-save hooks)
        if (body.budget !== undefined) {
            if (body.budget > 20000000) body.score = 'High';
            else if (body.budget >= 10000000) body.score = 'Medium';
            else body.score = 'Low';
        }

        // Update lead
        const updatedLead = await Lead.findByIdAndUpdate(id, body, { new: true, runValidators: true });

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
    context: { params: Promise<{ id: string }> }
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

        const { id } = await context.params;
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