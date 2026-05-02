'use client';
import { useEffect, useState } from 'react';

interface User {
    _id: string;
    name: string;
    email: string;
    role: 'admin' | 'agent';
    createdAt: string;
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [currentAdminId, setCurrentAdminId] = useState<string | null>(null);

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/users');
            if (res.ok) {
                const data = await res.json();
                setUsers(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchMe = async () => {
        try {
            const res = await fetch('/api/auth/me');
            if (res.ok) {
                const data = await res.json();
                if (data.authenticated) {
                    setCurrentAdminId(data.user.id);
                }
            }
        } catch (error) {
            console.error('Error fetching current user:', error);
        }
    };

    useEffect(() => { 
        fetchUsers(); 
        fetchMe();
    }, []);

    const deleteUser = async (userId: string) => {
        if (userId === currentAdminId) {
            alert('You cannot delete yourself!');
            return;
        }

        if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            try {
                const res = await fetch(`/api/users/${userId}`, {
                    method: 'DELETE',
                });

                if (res.ok) {
                    alert('User deleted successfully');
                    fetchUsers();
                } else {
                    const data = await res.json();
                    alert(data.error || 'Failed to delete user');
                }
            } catch (error) {
                console.error('Error deleting user:', error);
                alert('An error occurred while deleting the user');
            }
        }
    };

    const usersArray = Array.isArray(users) ? users : [];
    const filtered = usersArray.filter(u =>
        !filter ||
        (u.name && u.name.toLowerCase().includes(filter.toLowerCase())) ||
        (u.email && u.email.toLowerCase().includes(filter.toLowerCase()))
    );

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-black">User Management</h1>
                    <span className="text-sm text-gray-800">{usersArray.length} total users</span>
                </div>

                {/* Search */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
                        <input
                            type="text"
                            placeholder="Search by name or email…"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-400"
                            value={filter}
                            onChange={e => setFilter(e.target.value)}
                        />
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Joined</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">Loading…</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">No users found.</td></tr>
                            ) : filtered.map(user => (
                                <tr key={user._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-black">{user.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                                            user.role === 'admin'
                                                ? 'bg-indigo-100 text-indigo-800'
                                                : 'bg-green-100 text-green-800'
                                        }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <button
                                            onClick={() => deleteUser(user._id)}
                                            className={`text-red-600 hover:text-red-900 font-medium ${user._id === currentAdminId ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            disabled={user._id === currentAdminId}
                                            title={user._id === currentAdminId ? "You cannot delete yourself" : "Delete User"}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
