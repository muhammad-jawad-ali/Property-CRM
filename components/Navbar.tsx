'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface SessionUser {
    id: string;
    name: string;
    email: string;
    role: string;
}

export default function Navbar() {
    const [user, setUser] = useState<SessionUser | null>(null);
    const [status, setStatus] = useState<'loading' | 'done'>('loading');
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => {
                if (data.authenticated) setUser(data.user);
                setStatus('done');
            })
            .catch(() => setStatus('done'));
    }, [pathname]);

    const handleSignOut = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        setUser(null);
        router.push('/login');
    };

    // Don't render on auth pages or while loading
    if (status === 'loading') return null;
    if (pathname === '/login' || pathname === '/register') return null;

    // Don't show top navbar inside admin/agent sections — they have sidebars
    if (pathname.startsWith('/admin') || pathname.startsWith('/agent')) return null;

    const dashboardHref = user?.role === 'admin' ? '/admin/dashboard' : '/agent/dashboard';

    return (
        <nav className="bg-gray-900 text-white shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo — links to role-specific dashboard, never signs out */}
                    <div className="flex items-center">
                        <Link
                            href={user ? dashboardHref : '/login'}
                            className="flex-shrink-0 font-bold text-xl tracking-tight text-indigo-400"
                        >
                            Property CRM
                        </Link>

                        {user && (
                            <div className="hidden md:flex items-baseline space-x-2 ml-10">
                                <Link
                                    href={dashboardHref}
                                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                        pathname.includes('/dashboard')
                                            ? 'bg-gray-800 text-white'
                                            : 'text-gray-100 hover:bg-gray-700 hover:text-white'
                                    }`}
                                >
                                    Dashboard
                                </Link>

                                {user.role === 'admin' && (
                                    <>
                                        <Link
                                            href="/admin/leads"
                                            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                                pathname === '/admin/leads'
                                                    ? 'bg-gray-800 text-white'
                                                    : 'text-gray-100 hover:bg-gray-700 hover:text-white'
                                            }`}
                                        >
                                            Leads
                                        </Link>
                                        <Link
                                            href="/admin/users"
                                            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                                pathname === '/admin/users'
                                                    ? 'bg-gray-800 text-white'
                                                    : 'text-gray-100 hover:bg-gray-700 hover:text-white'
                                            }`}
                                        >
                                            Manage Users
                                        </Link>
                                        <Link
                                            href="/admin/settings"
                                            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                                pathname === '/admin/settings'
                                                    ? 'bg-gray-800 text-white'
                                                    : 'text-gray-100 hover:bg-gray-700 hover:text-white'
                                            }`}
                                        >
                                            Settings
                                        </Link>
                                    </>
                                )}

                                {user.role === 'agent' && (
                                    <>
                                        <Link
                                            href="/agent/leads"
                                            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                                pathname === '/agent/leads'
                                                    ? 'bg-gray-800 text-white'
                                                    : 'text-gray-100 hover:bg-gray-700 hover:text-white'
                                            }`}
                                        >
                                            My Leads
                                        </Link>
                                        <span className="px-3 py-2 text-sm text-gray-500 cursor-not-allowed" title="Admin only">
                                            Manage Users
                                        </span>
                                        <span className="px-3 py-2 text-sm text-gray-500 cursor-not-allowed" title="Admin only">
                                            Settings
                                        </span>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right side */}
                    <div className="flex items-center gap-4">
                        {user ? (
                            <>
                                <span className="text-sm text-gray-300">
                                    Welcome, <span className="font-semibold text-white">{user.name}</span>
                                    <span className="ml-1 text-xs text-gray-400">({user.role})</span>
                                </span>
                                <button
                                    onClick={handleSignOut}
                                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                                >
                                    Sign Out
                                </button>
                            </>
                        ) : (
                            <div className="flex gap-3">
                                <Link href="/login" className="text-sm text-gray-100 hover:text-white transition font-bold">
                                    Log in
                                </Link>
                                <Link href="/register" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition">
                                    Sign up
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
