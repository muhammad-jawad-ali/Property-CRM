'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  if (status === 'loading') return null;

  // Don't show navbar on login/register pages
  if (pathname === '/login' || pathname === '/register') return null;

  return (
    <nav className="bg-gray-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 font-bold text-xl tracking-tight text-blue-400">
              Property CRM
            </Link>
            
            {session && (
              <div className="hidden md:block ml-10">
                <div className="flex items-baseline space-x-4">
                  <Link 
                    href="/dashboard" 
                    className={`px-3 py-2 rounded-md text-sm font-medium ${pathname === '/dashboard' ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
                  >
                    Dashboard
                  </Link>
                  
                  {/* Admin specific link - Disabled for Agent */}
                  {session.user?.role === 'admin' ? (
                    <Link 
                      href="/users" 
                      className={`px-3 py-2 rounded-md text-sm font-medium ${pathname === '/users' ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
                    >
                      Manage Users
                    </Link>
                  ) : (
                    <span className="px-3 py-2 rounded-md text-sm font-medium text-gray-500 cursor-not-allowed opacity-50" title="Admin access required">
                      Manage Users
                    </span>
                  )}

                  {session.user?.role === 'admin' ? (
                    <Link 
                      href="/settings" 
                      className={`px-3 py-2 rounded-md text-sm font-medium ${pathname === '/settings' ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
                    >
                      Settings
                    </Link>
                  ) : (
                    <span className="px-3 py-2 rounded-md text-sm font-medium text-gray-500 cursor-not-allowed opacity-50" title="Admin access required">
                      Settings
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              {session ? (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-300">
                    Welcome, <span className="font-semibold text-white">{session.user?.name}</span> ({session.user?.role})
                  </span>
                  <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex space-x-4">
                  <Link href="/login" className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors">
                    Log in
                  </Link>
                  <Link href="/register" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors">
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
