import Link from 'next/link';
import { requireSession } from '@/lib/auth';
import LogoutButton from '@/components/LogoutButton';

export default async function AssignmentsLayout({ children }) {
  const s = await requireSession();
  return (
    <>
      <header className="bar">
        <Link href="/assignments" className="brand">Nộp bài</Link>
        <div className="right">
          <span>{s.username}{s.isAdmin ? ' (admin)' : ''}</span>
          <LogoutButton />
        </div>
      </header>
      <main className="wrap">{children}</main>
    </>
  );
}
