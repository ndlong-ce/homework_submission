'use client';
import { useRouter } from 'next/navigation';

export default function ResetAttemptButton({ attemptId, username }) {
  const router = useRouter();
  async function reset() {
    if (!confirm(`Xóa TOÀN BỘ lượt làm bài của "${username}" để cho làm lại từ đầu?`)) return;
    const r = await fetch(`/api/quiz-attempts/${attemptId}`, { method: 'DELETE' });
    if (r.ok) router.refresh();
    else alert('Xóa thất bại');
  }
  return (
    <button className="ghost" onClick={reset}>
      Xóa kết quả (làm lại)
    </button>
  );
}
