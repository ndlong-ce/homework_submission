'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MAX_TEXT } from '@/lib/util';

export default function SubmitText({ assignmentId, initialContent, willBeLate, hasSubmission }) {
  const router = useRouter();
  const [content, setContent] = useState(initialContent || '');
  const [msg, setMsg] = useState('');
  const [isErr, setIsErr] = useState(false);
  const [busy, setBusy] = useState(false);

  async function send() {
    if (!content.trim()) {
      setIsErr(true);
      return setMsg('Chưa nhập nội dung bài làm');
    }
    if (content.length > MAX_TEXT) {
      setIsErr(true);
      return setMsg(`Bài làm quá dài (tối đa ${MAX_TEXT.toLocaleString('vi-VN')} ký tự)`);
    }
    setBusy(true);
    setMsg('');
    try {
      const r = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId, content }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'Nộp bài thất bại');
      setIsErr(false);
      setMsg(j.late ? 'Đã nộp bài (bị đánh dấu nộp trễ).' : 'Đã nộp bài.');
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
      <p className="muted" style={{ marginTop: 0 }}>
        Dán bài làm của bạn vào ô bên dưới.
        {hasSubmission && ' Nộp lại sẽ thay thế nội dung đã nộp trước đó.'}
        {willBeLate && ' Đã quá hạn: bài nộp sẽ bị đánh dấu trễ.'}
      </p>
      <textarea
        className="code"
        rows={16}
        spellCheck={false}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Dán bài làm (code hoặc văn bản) vào đây"
        disabled={busy}
      />
      <div className="row" style={{ marginTop: 8 }}>
        <button onClick={send} disabled={busy}>{busy ? 'Đang gửi...' : hasSubmission ? 'Nộp lại' : 'Nộp bài'}</button>
        <span className="muted">{content.length.toLocaleString('vi-VN')} ký tự</span>
        {msg && <span className={isErr ? 'err' : 'ok'}>{msg}</span>}
      </div>
    </div>
  );
}
