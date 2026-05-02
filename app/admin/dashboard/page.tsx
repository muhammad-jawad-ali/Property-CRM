'use client';
import { useEffect, useState } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';

interface DashboardData {
    totalLeads: number;
    statusDistribution: { _id: string; count: number }[];
    priorityDistribution: { _id: string; count: number }[];
    agentPerformance: {
        agentId: string;
        name: string;
        totalAssigned: number;
        completed: number;
        inProgress: number;
        completionRate: number;
    }[];
}

export default function AdminDashboard() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetch('/api/analytics/dashboard')
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch analytics');
                return res.json();
            })
            .then(setData)
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="p-6 text-center">Loading analytics...</div>;
    if (error) return <div className="p-6 text-red-500">Error: {error}</div>;
    if (!data) return null;

    const statusColors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];
    const priorityColors = ['#ef4444', '#f59e0b', '#10b981'];

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Analytics Dashboard</h1>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <h3 className="text-sm font-medium text-black">Total Leads</h3>
                    <p className="text-3xl font-bold text-gray-900">{data.totalLeads}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <h3 className="text-sm font-medium text-black">Active Agents</h3>
                    <p className="text-3xl font-bold text-gray-900">{data.agentPerformance.length}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <h3 className="text-sm font-medium text-black">Overall Completion</h3>
                    <p className="text-3xl font-bold text-gray-900">
                        {data.agentPerformance.reduce((acc, a) => acc + a.completed, 0)} / {data.totalLeads}
                    </p>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                    <h2 className="text-lg font-bold mb-4 text-black">Leads by Status</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={data.statusDistribution} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={80} label>
                                {data.statusDistribution.map((entry, idx) => (
                                    <Cell key={idx} fill={statusColors[idx % statusColors.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                    <h2 className="text-lg font-bold mb-4 text-black">Leads by Priority</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={data.priorityDistribution}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="_id" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Agent Performance Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-black">Agent Performance</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Agent</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Assigned</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Completed</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">In Progress</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Completion Rate</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {data.agentPerformance.map(agent => (
                                <tr key={agent.agentId}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{agent.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{agent.totalAssigned}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{agent.completed}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{agent.inProgress}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div className="flex items-center">
                                            <span className="mr-2">{agent.completionRate}%</span>
                                            <div className="w-24 bg-gray-200 rounded-full h-2">
                                                <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${agent.completionRate}%` }} />
                                            </div>
                                        </div>
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