import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import FollowUp from '@/models/FollowUp';
import mongoose from 'mongoose';

export async function POST(request: NextRequest) {
    try {
        const userId = request.headers.get('x-user-id');
        const userRole = request.headers.get('x-user-role');
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { leadId, followUpDate, notes } = await request.json();
        if (!leadId || !followUpDate) {
            return NextResponse.json({ error: 'leadId and followUpDate required' }, { status: 400 });
        }

        await connectToDatabase();

        // Upsert: update existing or create new
        const followUp = await FollowUp.findOneAndUpdate(
            { leadId, agentId: userId },
            { followUpDate: new Date(followUpDate), notes, completed: false },
            { upsert: true, new: true }
        );

        return NextResponse.json(followUp);
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
export async function GET(request: NextRequest) {
    try {
        const userId = request.headers.get('x-user-id');
        const userRole = request.headers.get('x-user-role');
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectToDatabase();

        let query: any = { completed: false };
        if (userRole === 'agent') query.agentId = userId;

        const followUps = await FollowUp.find(query)
            .populate('leadId', 'name phone')
            .sort({ followUpDate: 1 });

        return NextResponse.json(followUps);
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}   