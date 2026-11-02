'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LETTERS } from '@/lib/util';

// questions = [{ id, text, imageUrl, opts: [4] }]  (KHÔNG có đáp án đúng)
export default function QuizTaker({ quizId, username, questions, previousCount, maxAttempts }) {
  const router = useRouter();
  const key = `quiz:${quizId}:${username}:${previousCount}`;
  const [started, setStarted] = useState(previousCount === 0);
  const [answers, setAnswers] = useState({});
  const [cur, setCur] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  // khôi phục bài đang làm dở nếu lỡ tải lại trang
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setAnswers(JSON.parse(raw));
    } catch {}
  }, [key]);

  function choose(qid, L) {
    const next = { ...answers, [qid]: L };
    setAnswers(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {}
  }

  if (!started) {
    return (
      <button onClick={() => setStarted(true)}>
        Làm lại (lần {previousCount + 1}/{maxAttempts})
      </button>
    );
  }

  const q = questions[cur];
  const answered = questions.filter((x) => answers[x.id]).length;

  async function submit() {
    const left = questions.length - answered;
    const ask = left > 0 ? `Còn ${left} câu chưa chọn (tính là sai). Vẫn nộp bài?` : (previousCount + 1 >= maxAttempts ? 'Nộp bài? Đây là lần làm cuối cùng của bạn.' : 'Nộp bài?');
    if (!confirm(ask)) return;
    setBusy(true);
    setErr('');
    try {
      const r = await fetch(`/api/quizzes/${quizId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'Nộp bài thất bại');
      try {
        localStorage.removeItem(key);
      } catch {}
      router.refresh();
    } catch (x) {
      setErr(x.message);
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="qnav" aria-label="Danh sách câu hỏi">
        {questions.map((x, i) => (
          <button
            key={x.id}
            className={'qn' + (i === cur ? ' cur' : '') + (answers[x.id] ? ' done' : '')}
            onClick={() => setCur(i)}
            aria-label={`Câu ${i + 1}${answers[x.id] ? ', đã chọn' : ''}`}
          >
            {i + 1}
          </button>
        ))}
      </div>
      <p className="muted">Đã chọn {answered}/{questions.length} câu</p>

      <div className="card">
        <strong>Câu {cur + 1}</strong>
        {q.text && <p className="note">{q.text}</p>}
        {q.imageUrl && <img className="qimg" src={q.imageUrl} alt={`Hình câu ${cur + 1}`} />}
        <div>
          {LETTERS.map((L, k) => (
            <button
              key={L}
              className={'opt' + (answers[q.id] === L ? ' sel' : '')}
              onClick={() => choose(q.id, L)}
              aria-pressed={answers[q.id] === L}
            >
              <strong>{L}.</strong>
              <span>{q.opts[k]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="row" style={{ marginTop: 14, justifyContent: 'space-between' }}>
        <div className="row">
          <button className="ghost" onClick={() => setCur(cur - 1)} disabled={cur === 0}>Câu trước</button>
          <button className="ghost" onClick={() => setCur(cur + 1)} disabled={cur === questions.length - 1}>Câu sau</button>
        </div>
        <button onClick={submit} disabled={busy}>{busy ? 'Đang nộp...' : 'Nộp bài'}</button>
      </div>
      {err && <p className="err">{err}</p>}
    </div>
  );
}
