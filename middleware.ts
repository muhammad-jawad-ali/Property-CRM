// middleware.ts (place at root of your project)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAuth } from './lib/auth-middleware';
import { checkRateLimit } from './lib/rate-limit';

// Define which routes require authentication
const protectedRoutes = ['/api/leads', '/api/leads/.*', '/api/admin/.*', '/admin', '/agent'];
// Define admin-only routes
const adminRoutes = ['/api/admin/.*', '/admin'];
// Define public routes (no auth needed)
const publicRoutes = ['/api/auth/login', '/api/auth/register', '/login', '/register'];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // ----- 1. Check if route is public -----
    const isPublic = publicRoutes.some(route => pathname.match(new RegExp(`^${route}$`)));
    if (isPublic) {
        return NextResponse.next();
    }

    // ----- 2. Authentication check -----
    const token = request.cookies.get('token')?.value;
    if (!token) {
        // If API request, return 401 JSON; if page, redirect to login
        if (pathname.startsWith('/api/')) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    let user;
    try {
        user = await verifyAuth(token);
    } catch (error) {
        // Invalid token
        const response = NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
        response.cookies.delete('token');
        return response;
    }

    // ----- 3. Role-Based Access Control (RBAC) -----
    const isAdminRoute = adminRoutes.some(route => pathname.match(new RegExp(`^${route}$`)));
    if (isAdminRoute && user.role !== 'admin') {
        if (pathname.startsWith('/api/')) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }
        return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    // Agent cannot access admin pages
    if (user.role === 'agent' && pathname.startsWith('/admin')) {
        return NextResponse.redirect(new URL('/agent/dashboard', request.url));
    }

    // ----- 4. Rate Limiting (only for API routes) -----
    if (pathname.startsWith('/api/')) {
        const isAdmin = user.role === 'admin';
        const limit = isAdmin ? 1000 : 50; // Admin: high limit, Agent: 50 per minute
        const rateLimitResult = await checkRateLimit(request, user.userId, limit);
        if (!rateLimitResult.allowed) {
            return NextResponse.json(
                { error: 'Too many requests. Please try again later.' },
                { status: 429 }
            );
        }
    }

    // ----- 5. Attach user to request headers (so API routes can read it) -----
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', user.userId);
    requestHeaders.set('x-user-role', user.role);
    requestHeaders.set('x-user-email', user.email);

    return NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });
}

// Optional: config to run middleware on specific paths only (improves performance)
export const config = {
    matcher: [
        '/api/:path*',
        '/admin/:path*',
        '/agent/:path*',
        '/login',
        '/register',
    ],
};