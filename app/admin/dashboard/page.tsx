'use client';
import { useEffect, useState } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
    const [data, setData] = useState<any>(null);
    useEffect(() => {
        fetch('/api/analytics/dashboard')
            .then(res => res.json())
            .then(setData);
    }, []);

    if (!data) return <div className="p-4">Loading analytics...</div>;

    const statusColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042'];
    const priorityColors = ['#ff4d4f', '#faad14', '#52c41a'];

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Admin Analytics Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white p-4 rounded shadow"><h2 className="text-gray-500">Total Leads</h2><p className="text-3xl font-bold">{data.totalLeads}</p></div>
                <div className="bg-white p-4 rounded shadow"><h2 className="text-gray-500">Active Agents</h2><p className="text-3xl font-bold">{data.agentPerformance.length}</p></div>
                <div className="bg-white p-4 rounded shadow"><h2 className="text-gray-500">Overall Completion</h2><p className="text-3xl font-bold">{data.agentPerformance.reduce((acc: number, a: any) => acc + a.completed, 0)} / {data.totalLeads}</p></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-4 rounded shadow"><h2 className="text-xl font-semibold mb-2">Leads by Status</h2><ResponsiveContainer width="100%" height={300}><PieChart><Pie data={data.statusDistribution} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={80} label>{data.statusDistribution.map((entry: any, idx: number) => (<Cell key={idx} fill={statusColors[idx % statusColors.length]} />))}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></div>
                <div className="bg-white p-4 rounded shadow"><h2 className="text-xl font-semibold mb-2">Leads by Priority</h2><ResponsiveContainer width="100%" height={300}><BarChart data={data.priorityDistribution}><XAxis dataKey="_id" /><YAxis /><Tooltip /><Legend /><Bar dataKey="count" fill="#8884d8" /></BarChart></ResponsiveContainer></div>
            </div>
            <div className="bg-white p-4 rounded shadow"><h2 className="text-xl font-semibold mb-2">Agent Performance</h2><table className="min-w-full border"><thead><tr><th className="border p-2">Agent</th><th className="border p-2">Assigned Leads</th><th className="border p-2">Completed</th><th className="border p-2">In Progress</th><th className="border p-2">Completion Rate</th></tr></thead><tbody>{data.agentPerformance.map((agent: any) => (<tr key={agent.agentId}><td className="border p-2">{agent.name}</td><td className="border p-2">{agent.totalAssigned}</td><td className="border p-2">{agent.completed}</td><td className="border p-2">{agent.inProgress}</td><td className="border p-2">{agent.completionRate}%</td></tr>))}</tbody></table></div>
        </div>
    );
}