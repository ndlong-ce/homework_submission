'use client';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();
  async function out() {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }
  return (
    <button className="ghost" onClick={out}>
      Đăng xuất
    </button>
  );
}
