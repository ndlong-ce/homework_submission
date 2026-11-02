'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IMAGE_EXT, extOf } from '@/lib/util';
import { compressImage } from '@/lib/image';

// initial = { id, title, note, deadline: "YYYY-MM-DDTHH:mm", hasImage } khi sửa; null khi tạo mới
export default function AssignmentForm({ initial }) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title || '');
  const [note, setNote] = useState(initial?.note || '');
  const [deadline, setDeadline] = useState(initial?.deadline || '');
  const [file, setFile] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  function pick(e) {
    const f = e.target.files[0] || null;
    setMsg('');
    if (f && !IMAGE_EXT.includes(extOf(f.name))) {
      setMsg(`Ảnh phải là ${IMAGE_EXT.join(' ')}`);
      e.target.value = '';
      return setFile(null);
    }
    setFile(f);
  }

  async function submit(e) {
    e.preventDefault();
    if (!note.trim() && !file && !(initial?.hasImage && !removeImage)) {
      setMsg('Đề bài cần có chữ hoặc ảnh');
      return;
    }
    setBusy(true);
    setMsg('');
    try {
      const image = file ? await compressImage(file) : undefined;
      const r = await fetch(initial ? `/api/assignments/${initial.id}` : '/api/assignments', {
        method: initial ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        // deadline nhập theo giờ Việt Nam (UTC+7)
        body: JSON.stringify({ title, note, deadline: `${deadline}:00+07:00`, image, removeImage }),
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
      <label htmlFor="n">Nội dung đề bài (có thể để trống nếu đã có ảnh)</label>
      <textarea id="n" rows={10} value={note} onChange={(e) => setNote(e.target.value)} />
      <label htmlFor="f">Ảnh kèm theo (không bắt buộc, tự động thu nhỏ)</label>
      {initial?.hasImage && !removeImage && !file && (
        <img className="thumb" src={`/api/image/assignment/${initial.id}`} alt="Ảnh hiện tại" />
      )}
      <input id="f" type="file" accept={IMAGE_EXT.join(',')} onChange={pick} disabled={busy} />
      {initial?.hasImage && (
        <label style={{ fontWeight: 400 }}>
          <input type="checkbox" style={{ width: 'auto', marginRight: 6 }} checked={removeImage} onChange={(e) => setRemoveImage(e.target.checked)} />
          Xóa ảnh hiện tại
        </label>
      )}
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
