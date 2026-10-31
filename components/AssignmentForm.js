'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { upload } from '@vercel/blob/client';
import { STATEMENT_EXT, extOf, safe } from '@/lib/util';

// initial = { id, title, note, deadline: "YYYY-MM-DDTHH:mm", docName } khi sửa; null khi tạo mới
export default function AssignmentForm({ initial }) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title || '');
  const [note, setNote] = useState(initial?.note || '');
  const [deadline, setDeadline] = useState(initial?.deadline || '');
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  function pick(e) {
    const f = e.target.files[0] || null;
    if (f && !STATEMENT_EXT.includes(extOf(f.name))) {
      setMsg('Đề bài phải là file Word (.docx)');
      setFile(null);
      e.target.value = '';
      return;
    }
    setMsg('');
    setFile(f);
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setMsg('');
    try {
      let docName;
      let docUrl;
      if (file) {
        const b = await upload(`statements/${crypto.randomUUID()}/${safe(file.name)}`, file, {
          access: 'public',
          handleUploadUrl: '/api/upload',
          clientPayload: JSON.stringify({ kind: 'statement' }),
        });
        docName = file.name;
        docUrl = b.url;
      }
      const r = await fetch(initial ? `/api/assignments/${initial.id}` : '/api/assignments', {
        method: initial ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        // deadline nhập theo giờ Việt Nam (UTC+7)
        body: JSON.stringify({ title, note, deadline: `${deadline}:00+07:00`, docName, docUrl }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'Lưu thất bại');
      router.push(`/assignments/${j.id}`);
      router.refresh();
    } catch (x) {
      setMsg(x.message);
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm('Xóa bài tập này cùng toàn bộ bài nộp, điểm và nhận xét?')) return;
    setBusy(true);
    const r = await fetch(`/api/assignments/${initial.id}`, { method: 'DELETE' });
    if (!r.ok) {
      setMsg('Xóa thất bại');
      setBusy(false);
      return;
    }
    router.push('/assignments');
    router.refresh();
  }

  return (
    <form onSubmit={submit}>
      <h1>{initial ? 'Sửa bài tập' : 'Đăng bài tập mới'}</h1>
      <label htmlFor="t">Tiêu đề</label>
      <input id="t" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} />
      <label htmlFor="d">Hạn nộp (giờ Việt Nam)</label>
      <input id="d" type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} required />
      <label htmlFor="n">Ghi chú (không bắt buộc)</label>
      <textarea id="n" rows={4} value={note} onChange={(e) => setNote(e.target.value)} />
      <label htmlFor="f">Đề bài (file Word)</label>
      <input id="f" type="file" accept=".docx,.doc" onChange={pick} />
      {initial?.docName && <p className="muted">Hiện tại: {initial.docName}. Chọn file mới để thay thế.</p>}
      {msg && <p className="err">{msg}</p>}
      <div className="row" style={{ marginTop: 16 }}>
        <button disabled={busy}>{busy ? 'Đang lưu...' : 'Lưu'}</button>
        {initial && (
          <button type="button" className="ghost" onClick={remove} disabled={busy}>
            Xóa bài tập
          </button>
        )}
      </div>
    </form>
  );
}
