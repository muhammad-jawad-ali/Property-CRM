'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

const navItems = [
    { label: 'My Dashboard', href: '/agent/dashboard' },
    { label: 'My Leads', href: '/agent/leads' },
];

export default function AgentLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [user, setUser] = useState<{ name: string; email: string } | null>(null);

    useEffect(() => {
        if (searchParams.get('error') === 'unauthorized') {
            alert('Access Denied: You are not authorized to access that area.');
            // Clean up the URL
            const newParams = new URLSearchParams(searchParams.toString());
            newParams.delete('error');
            const cleanUrl = `${pathname}${newParams.toString() ? '?' + newParams.toString() : ''}`;
            router.replace(cleanUrl);
        }

        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => {
                if (data.authenticated) {
                    setUser(data.user);
                } else {
                    router.push('/login');
                }
            })
            .catch(() => router.push('/login'));
    }, [router]);

    const handleSignOut = async () => {
        if (!confirm('Are you sure you want to sign out?')) return;

        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="w-64 bg-gray-900 text-white flex flex-col fixed inset-y-0 left-0 z-30">
                {/* Brand */}
                <div className="px-6 py-5 border-b border-gray-700">
                    <span className="text-xl font-bold text-green-400 tracking-tight">
                        Property CRM
                    </span>
                    <p className="text-xs text-gray-200 mt-1 font-bold">Agent Portal</p>
                </div>

                {/* User Profile */}
                <div className="px-6 py-4 border-b border-gray-700 bg-gray-800/50">
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-white truncate">{user?.name || 'Loading...'}</span>
                        <span className="text-[10px] text-gray-400 truncate">{user?.email || '...'}</span>
                    </div>
                </div>

                {/* Nav Links */}
                <nav className="flex-1 px-4 py-6 space-y-1">
                    {navItems.map(item => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                pathname === item.href || pathname.startsWith(item.href + '/')
                                    ? 'bg-green-600 text-white shadow-lg'
                                    : 'text-gray-100 hover:bg-gray-700 hover:text-white font-bold'
                            }`}
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>

                {/* Sign out */}
                <div className="px-4 py-4 border-t border-gray-700">
                    <button
                        onClick={handleSignOut}
                        className="w-full flex items-center px-4 py-2.5 rounded-lg text-sm font-bold text-gray-100 hover:bg-red-700 hover:text-white transition-colors"
                    >
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Page content — offset by sidebar width */}
            <div className="flex-1 ml-64">
                {children}
            </div>
        </div>
    );
}
