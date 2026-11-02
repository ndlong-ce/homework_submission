'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function QuizSettings({ quiz }) {
  const router = useRouter();
  const [title, setTitle] = useState(quiz.title);
  const [maxAttempts, setMaxAttempts] = useState(quiz.maxAttempts);
  const [msg, setMsg] = useState('');
  const [isErr, setIsErr] = useState(false);
  const [busy, setBusy] = useState(false);

  async function update(body, okMsg) {
    setBusy(true);
    setMsg('');
    try {
      const r = await fetch(`/api/quizzes/${quiz.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'Lưu thất bại');
      setIsErr(false);
      setMsg(okMsg);
      router.refresh();
    } catch (x) {
      setIsErr(true);
      setMsg(x.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm('Xóa bài trắc nghiệm này cùng toàn bộ câu hỏi và kết quả?')) return;
    setBusy(true);
    const r = await fetch(`/api/quizzes/${quiz.id}`, { method: 'DELETE' });
    if (!r.ok) {
      setIsErr(true);
      setMsg('Xóa thất bại');
      setBusy(false);
      return;
    }
    router.push('/quizzes');
    router.refresh();
  }

  return (
    <div>
      <div className="row">
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} style={{ maxWidth: 420 }} />
        <button onClick={() => update({ title }, 'Đã lưu tên')} disabled={busy || !title.trim()}>Lưu tên</button>
      </div>
      <div className="row" style={{ marginTop: 10 }}>
        <label htmlFor="ma" style={{ margin: 0 }}>Số lần làm tối đa mỗi tài khoản</label>
        <input id="ma" className="grade-in" type="number" min="1" max="100" step="1" value={maxAttempts} onChange={(e) => setMaxAttempts(e.target.value)} />
        <button onClick={() => update({ maxAttempts: Number(maxAttempts) }, 'Đã lưu số lần làm')} disabled={busy || !maxAttempts}>Lưu</button>
      </div>
      <div className="row" style={{ marginTop: 10 }}>
        <span className={quiz.isOpen ? 'tag' : 'tag late'}>{quiz.isOpen ? 'Đang mở cho sinh viên' : 'Đang ẩn (nháp)'}</span>
        <button className="ghost" onClick={() => update({ isOpen: !quiz.isOpen }, quiz.isOpen ? 'Đã ẩn bài' : 'Đã mở bài')} disabled={busy}>
          {quiz.isOpen ? 'Ẩn bài' : 'Mở cho sinh viên'}
        </button>
        <button className="ghost" onClick={remove} disabled={busy}>Xóa bài trắc nghiệm</button>
        {msg && <span className={isErr ? 'err' : 'ok'}>{msg}</span>}
      </div>
    </div>
  );
}
