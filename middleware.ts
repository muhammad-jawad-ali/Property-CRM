import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAuth } from './lib/auth-middleware';
import { checkRateLimit } from './lib/rate-limit';

const protectedApiRoutes = ['/api/leads', '/api/leads/'];
const adminRoutes = ['/api/admin', '/admin'];
const publicRoutes = ['/api/auth/login', '/api/auth/register', '/login', '/register'];

export async function middleware(request: NextRequest) {
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
        const response = NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        response.cookies.delete('token');
        return response;
    }

    const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));
    if (isAdminRoute && user.role !== 'admin') {
        if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Admin required' }, { status: 403 });
        return NextResponse.redirect(new URL('/unauthorized', request.url));
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

    return NextResponse.next({
        request: { headers: requestHeaders },
    });
}

export const config = {
    matcher: ['/api/:path*', '/admin/:path*', '/agent/:path*', '/login', '/register'],
};