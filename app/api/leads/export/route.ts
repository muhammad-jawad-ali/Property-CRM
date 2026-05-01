import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Lead from '@/models/Lead';

export async function GET(request: NextRequest) {
    const userRole = request.headers.get('x-user-role');
    if (userRole !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const leads = await Lead.find().populate('assignedTo', 'name email');

    // Create CSV header
    const headers = ['Name', 'Email', 'Phone', 'Property Interest', 'Budget', 'Status', 'Score', 'Assigned To', 'Created At'];
    const rows = leads.map((lead: any) => [
        lead.name,
        lead.email,
        lead.phone,
        lead.propertyInterest,
        lead.budget,
        lead.status,
        lead.score,
        lead.assignedTo?.name || 'Unassigned',
        lead.createdAt.toISOString(),
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    return new NextResponse(csvContent, {
        headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="leads-export.csv"',
        },
    });
}