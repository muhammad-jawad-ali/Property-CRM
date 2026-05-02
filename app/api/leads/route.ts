// app/api/leads/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Lead from '@/models/Lead';
import ActivityLog from '@/models/ActivityLog';
import User from '@/models/User';
import { validateBody, LeadSchema } from '@/lib/validation';
import { sendNewLeadEmail } from '@/lib/email';
import mongoose from 'mongoose';

export async function POST(request: NextRequest) {
  try {
    // 1. Get authenticated user from headers (set by middleware)
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Validate request body
    const { data, errors } = await validateBody(request, LeadSchema);
    if (errors) {
      return NextResponse.json({ error: 'Validation failed', details: errors }, { status: 400 });
    }

    // 3. Connect to DB
    await connectToDatabase();

    // 4. Create lead
    // If agent, auto-assign to themselves; if admin, use assignedTo from body (or null)
    const leadData = {
      ...data,
      assignedTo: userRole === 'agent' ? userId : (data.assignedTo && data.assignedTo !== '' ? data.assignedTo : null),
    };
    const lead = await Lead.create(leadData);

    // 5. Log activity (for timeline)
    await ActivityLog.create({
      leadId: lead._id,
      action: 'Lead Created',
      newValue: `Lead "${lead.name}" was created`,
      userId: userId,
    });

    // Send email notification
    let assignedAgentEmail = '';
    if (lead.assignedTo) {
      try {
        const agent = await User.findById(lead.assignedTo).select('email');
        if (agent) assignedAgentEmail = agent.email;
      } catch (err) {
        console.error('Error fetching agent for email:', err);
      }
    }
    sendNewLeadEmail(lead, assignedAgentEmail).catch(console.error);

    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    console.error('Lead creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Use aggregation to join follow-ups
    const matchStage = userRole === 'admin' 
      ? {} 
      : { assignedTo: new mongoose.Types.ObjectId(userId as string) };

    const leads = await Lead.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'users',
          localField: 'assignedTo',
          foreignField: '_id',
          as: 'assignedTo'
        }
      },
      { $unwind: { path: '$assignedTo', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'followups',
          let: { leadId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$leadId', '$$leadId'] }, completed: false } },
            { $sort: { followUpDate: 1 } },
            { $limit: 1 }
          ],
          as: 'nextFollowUp'
        }
      },
      { $unwind: { path: '$nextFollowUp', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          name: 1,
          email: 1,
          phone: 1,
          propertyInterest: 1,
          budget: 1,
          status: 1,
          score: 1,
          notes: 1,
          createdAt: 1,
          'assignedTo._id': 1,
          'assignedTo.name': 1,
          'assignedTo.email': 1,
          nextFollowUpDate: '$nextFollowUp.followUpDate'
        }
      }
    ]);

    return NextResponse.json(leads);
  } catch (error) {
    console.error('Lead fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}