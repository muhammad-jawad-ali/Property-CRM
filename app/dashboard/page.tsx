// app/dashboard/page.tsx
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export default async function Dashboard() {
  const headersList = await headers();
  const role = headersList.get('x-user-role');
  if (role === 'admin') redirect('/admin/dashboard');
  if (role === 'agent') redirect('/agent/dashboard');
  redirect('/login');
}