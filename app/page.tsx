import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

// 1. Added 'async' to the function definition
export default async function Home() {

  // 2. Added 'await' before headers()
  const headersList = await headers();
  const userId = headersList.get('x-user-id');

  if (userId) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}