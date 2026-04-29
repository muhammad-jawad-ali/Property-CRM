import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';

export default async function Dashboard() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-lg shadow px-5 py-6 sm:px-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>
        
        <div className="border-t border-gray-200 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Common Widget 1 */}
            <div className="bg-blue-50 overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">Total Leads</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">120</dd>
              </div>
            </div>

            {/* Common Widget 2 */}
            <div className="bg-green-50 overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">Active Deals</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">45</dd>
              </div>
            </div>

            {/* Common Widget 3 */}
            <div className="bg-purple-50 overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">Revenue (YTD)</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">$120k</dd>
              </div>
            </div>

          </div>

          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Activity</h2>
            <div className="bg-white shadow overflow-hidden sm:rounded-md border border-gray-100">
              <ul role="list" className="divide-y divide-gray-200">
                <li className="px-4 py-4 sm:px-6 text-sm text-gray-600">
                  <span className="font-medium text-gray-900">System</span> - Dashboard loaded successfully. Both Agent and Admin see this unified view.
                </li>
                <li className="px-4 py-4 sm:px-6 text-sm text-gray-600">
                  <span className="font-medium text-gray-900">Note</span> - Check your navigation bar above. If you are an Admin, you will see 'Manage Users' and 'Settings'. If you are an Agent, they will be disabled.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
