import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(request: NextRequest) {
    const role = request.nextUrl.searchParams.get('role');
    await connectToDatabase();
    const query = role ? { role } : {};
    const users = await User.find(query).select('-password');
    return NextResponse.json(users);
}