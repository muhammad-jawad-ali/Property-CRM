import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import ActivityLog from '@/models/ActivityLog';
import mongoose from 'mongoose';

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const userId = request.headers.get('x-user-id');
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await context.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: 'Invalid lead ID' }, { status: 400 });
        }

        await connectToDatabase();
        const activities = await ActivityLog.find({ leadId: id })
            .populate('userId', 'name email')
            .sort({ timestamp: -1 }); // newest first

        return NextResponse.json(activities);
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}