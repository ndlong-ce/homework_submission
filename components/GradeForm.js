'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function GradeForm({ submissionId, initialGrade, initialFeedback }) {
  const router = useRouter();
  const [grade, setGrade] = useState(initialGrade ?? '');
  const [feedback, setFeedback] = useState(initialFeedback || '');
  const [msg, setMsg] = useState('');
  const [isErr, setIsErr] = useState(false);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    setMsg('');
    try {
      const r = await fetch('/api/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId, grade, feedback }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'Lưu thất bại');
      setIsErr(false);
      setMsg('Đã lưu');
      router.refresh();
    } catch (x) {
      setIsErr(true);
      setMsg(x.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="row">
        <input className="grade-in" type="number" min="0" max="100" step="1" placeholder="/100" value={grade} onChange={(e) => setGrade(e.target.value)} />
        <span className="muted">/ 100</span>
      </div>
      <textarea rows={3} placeholder="Nhận xét" value={feedback} onChange={(e) => setFeedback(e.target.value)} style={{ marginTop: 6 }} />
      <div className="row" style={{ marginTop: 6 }}>
        <button onClick={save} disabled={busy}>{busy ? 'Đang lưu...' : 'Lưu'}</button>
        {msg && <span className={isErr ? 'err' : 'ok'}>{msg}</span>}
      </div>
    </div>
  );
}
