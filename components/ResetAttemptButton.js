'use client';
import { useRouter } from 'next/navigation';

export default function ResetAttemptButton({ attemptId, username }) {
  const router = useRouter();
  async function reset() {
    if (!confirm(`Xóa lượt làm bài của "${username}" để cho làm lại?`)) return;
    const r = await fetch(`/api/quiz-attempts/${attemptId}`, { method: 'DELETE' });
    if (r.ok) router.refresh();
    else alert('Xóa thất bại');
  }
  return (
    <button className="ghost" onClick={reset}>
      Cho làm lại
    </button>
  );
}
