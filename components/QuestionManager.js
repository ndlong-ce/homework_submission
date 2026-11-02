'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import QuestionForm from '@/components/QuestionForm';
import { LETTERS } from '@/lib/util';

export default function QuestionManager({ quizId, questions, locked }) {
  const router = useRouter();
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [msg, setMsg] = useState('');
  const [isErr, setIsErr] = useState(false);

  async function remove(q) {
    if (!confirm('Xóa câu hỏi này?')) return;
    const r = await fetch(`/api/quizzes/${quizId}/questions/${q.id}`, { method: 'DELETE' });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      setIsErr(true);
      setMsg(j.error || 'Xóa thất bại');
      return;
    }
    setMsg('');
    router.refresh();
  }

  return (
    <div>
      {locked && (
        <p className="muted">Đã có người nộp bài nên không thể thêm, sửa hoặc xóa câu hỏi. Muốn chỉnh sửa, hãy xóa lượt làm bài trong bảng kết quả bên dưới.</p>
      )}
      {msg && <p className={isErr ? 'err' : 'ok'}>{msg}</p>}

      {questions.length === 0 && <p className="muted">Chưa có câu hỏi nào.</p>}
      {questions.map((q, i) =>
        editing === q.id ? (
          <QuestionForm
            key={q.id}
            quizId={quizId}
            initial={q}
            onDone={() => { setEditing(null); setMsg(''); router.refresh(); }}
            onCancel={() => setEditing(null)}
          />
        ) : (
          <div className="card" key={q.id}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <strong>Câu {i + 1}</strong>
              {!locked && (
                <div className="row">
                  <button className="ghost" onClick={() => { setAdding(false); setEditing(q.id); }}>Sửa</button>
                  <button className="ghost" onClick={() => remove(q)}>Xóa</button>
                </div>
              )}
            </div>
            {q.text && <p className="note" style={{ margin: '6px 0' }}>{q.text}</p>}
            {q.imageUrl && <img className="thumb" src={q.imageUrl} alt={`Ảnh câu ${i + 1}`} loading="lazy" />}
            <ul className="plain">
              {LETTERS.map((L, k) => (
                <li key={L} className={q.correct === L ? 'right' : ''}>
                  {L}. {q.opts[k]} {q.correct === L && '(đáp án đúng)'}
                </li>
              ))}
            </ul>
          </div>
        )
      )}

      {!locked && !adding && editing === null && (
        <button onClick={() => { setMsg(''); setAdding(true); }}>Thêm câu hỏi</button>
      )}
      {!locked && adding && (
        <QuestionForm
          key={formKey}
          quizId={quizId}
          initial={null}
          onDone={() => { setFormKey((k) => k + 1); setIsErr(false); setMsg('Đã thêm câu hỏi. Bạn có thể nhập câu tiếp theo.'); router.refresh(); }}
          onCancel={() => setAdding(false)}
        />
      )}
    </div>
  );
}
