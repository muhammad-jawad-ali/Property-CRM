import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Lead from '@/models/Lead';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
    const userRole = request.headers.get('x-user-role');
    if (userRole !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const leads = await Lead.find().populate('assignedTo', 'name email');

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

    const escape = (val: any) => {
        const str = String(val ?? '');
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };

    const csvContent = [headers, ...rows]
        .map(row => row.map(escape).join(','))
        .join('\n');

    // Save to root folder as requested
    try {
        const filePath = path.join(process.cwd(), 'leads_exported.csv');
        fs.writeFileSync(filePath, csvContent);
    } catch (err) {
        console.error('Failed to write CSV to root:', err);
    }

    return new NextResponse(csvContent, {
        headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="leads_exported.csv"',
        },
    });
}