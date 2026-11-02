import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import LoginForm from '@/components/LoginForm';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const s = await getSession();
  if (s) redirect('/assignments');
  return <LoginForm />;
}
