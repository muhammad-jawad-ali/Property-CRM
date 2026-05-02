'use client';
import { useEffect, useState } from 'react';

export default function SettingsPage() {
    const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);

    useEffect(() => {
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => { if (data.authenticated) setUser(data.user); });
    }, []);

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">Settings</h1>

                {/* Account info card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-700 mb-4">Account Information</h2>
                    {user ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-black mb-1">Full Name</label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-400 rounded-lg px-4 py-2 text-sm bg-gray-100 cursor-not-allowed text-black font-bold"
                                    value={user.name}
                                    readOnly
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-black mb-1">Email Address</label>
                                <input
                                    type="email"
                                    className="w-full border border-gray-400 rounded-lg px-4 py-2 text-sm bg-gray-100 cursor-not-allowed text-black font-bold"
                                    value={user.email}
                                    readOnly
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-black mb-1">Role</label>
                                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${
                                    user.role === 'admin'
                                        ? 'bg-indigo-100 text-indigo-800'
                                        : 'bg-green-100 text-green-800'
                                }`}>
                                    {user.role}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-400 text-sm">Loading account info…</p>
                    )}
                </div>

                {/* Info notice */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                    <strong>Note:</strong> Profile edits and password changes will be available in a future update. Contact your system administrator to modify your account details.
                </div>
            </div>
        </div>
    );
}
