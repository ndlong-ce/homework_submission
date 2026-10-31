'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function QuizCreate() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function create(e) {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      const r = await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'Tạo thất bại');
      router.push(`/quizzes/${j.id}`);
      router.refresh();
    } catch (x) {
      setErr(x.message);
      setBusy(false);
    }
  }

  if (!open) return <button onClick={() => setOpen(true)}>Tạo bài trắc nghiệm</button>;
  return (
    <form className="card" onSubmit={create}>
      <label htmlFor="qt" style={{ marginTop: 0 }}>Tên bài trắc nghiệm</label>
      <input id="qt" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} autoFocus />
      {err && <p className="err">{err}</p>}
      <div className="row" style={{ marginTop: 10 }}>
        <button disabled={busy}>{busy ? 'Đang tạo...' : 'Tạo và thêm câu hỏi'}</button>
        <button type="button" className="ghost" onClick={() => setOpen(false)} disabled={busy}>Hủy</button>
      </div>
    </form>
  );
}
