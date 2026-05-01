// app/api/leads/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Lead from '@/models/Lead';
import ActivityLog from '@/models/ActivityLog';
import { validateBody, LeadSchema } from '@/lib/validation';
import { sendNewLeadEmail } from '@/lib/email';

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
      assignedTo: userRole === 'agent' ? userId : (data.assignedTo || null),
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
    sendNewLeadEmail(lead, '').catch(console.error);

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

    let leads;
    if (userRole === 'admin') {
      // Admin sees all leads, populated with assigned agent details
      leads = await Lead.find().populate('assignedTo', 'name email');
    } else {
      // Agent sees only leads assigned to them
      leads = await Lead.find({ assignedTo: userId }).populate('assignedTo', 'name email');
    }

    return NextResponse.json(leads);
  } catch (error) {
    console.error('Lead fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}