import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAuth } from './lib/auth-middleware';
import { checkRateLimit } from './lib/rate-limit';

const adminRoutes = ['/api/admin', '/admin'];
const agentRoutes = ['/api/agent', '/agent'];
const publicRoutes = ['/api/auth/login', '/api/auth/register', '/login', '/register'];

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const isPublic = publicRoutes.some(route => pathname.startsWith(route));
    if (isPublic) return NextResponse.next();

    const token = request.cookies.get('token')?.value;
    if (!token) {
        if (pathname.startsWith('/api/')) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }
        return NextResponse.redirect(new URL('/login', request.url));
    }

    let user;
    try {
        user = await verifyAuth(token);
    } catch {
        if (pathname.startsWith('/api/')) {
            const response = NextResponse.json({ error: 'Invalid token' }, { status: 401 });
            response.cookies.delete('token');
            return response;
        }
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('token');
        return response;
    }

    // Role-based protection
    const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
    const isAgentRoute = pathname.startsWith('/agent') || pathname.startsWith('/api/agent');

    if (isAdminRoute && user.role !== 'admin') {
        if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        return NextResponse.redirect(new URL('/agent/dashboard?error=unauthorized', request.url));
    }

    if (isAgentRoute && user.role !== 'agent') {
        if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Agent access required' }, { status: 403 });
        return NextResponse.redirect(new URL('/admin/dashboard?error=unauthorized', request.url));
    }

    if (pathname.startsWith('/api/')) {
        const limit = user.role === 'admin' ? 1000 : 50;
        const rateResult = await checkRateLimit(request, user.userId, limit);
        if (!rateResult.allowed) {
            return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
        }
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', user.userId);
    requestHeaders.set('x-user-role', user.role);
    requestHeaders.set('x-user-email', user.email);
    requestHeaders.set('x-user-name', user.name);

    return NextResponse.next({
        request: { headers: requestHeaders },
    });
}

export const config = {
    matcher: [
        '/api/:path*',
        '/admin/:path*',
        '/agent/:path*',
        '/dashboard',
        '/users',
        '/settings',
        '/',
    ],
};
