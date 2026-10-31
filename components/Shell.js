import Link from 'next/link';
import { requireSession } from '@/lib/auth';
import LogoutButton from '@/components/LogoutButton';

export default async function Shell({ children }) {
  const s = await requireSession();
  return (
    <>
      <header className="bar">
        <nav className="nav">
          <Link href="/assignments" className="brand">Nộp bài</Link>
          <Link href="/assignments">Bài tập</Link>
          <Link href="/quizzes">Trắc nghiệm</Link>
        </nav>
        <div className="right">
          <span>{s.username}{s.isAdmin ? ' (admin)' : ''}</span>
          <LogoutButton />
        </div>
      </header>
      <main className="wrap">{children}</main>
    </>
  );
}
