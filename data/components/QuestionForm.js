'use client';
import { useState } from 'react';
import { upload } from '@vercel/blob/client';
import { IMAGE_EXT, MAX_SIZE, LETTERS, extOf, safe } from '@/lib/util';

// initial = { id, text, imageUrl, opts:[4], correct } khi sửa; null khi thêm mới
export default function QuestionForm({ quizId, initial, onDone, onCancel }) {
  const [text, setText] = useState(initial?.text || '');
  const [opts, setOpts] = useState(initial?.opts || ['', '', '', '']);
  const [correct, setCorrect] = useState(initial?.correct || 'A');
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
    if (f && f.size > MAX_SIZE) {
      setMsg(`Ảnh vượt quá ${MAX_SIZE / 1024 / 1024}MB`);
      e.target.value = '';
      return setFile(null);
    }
    setFile(f);
  }

  async function submit(e) {
    e.preventDefault();
    if (!text.trim() && !file && !(initial?.imageUrl && !removeImage)) {
      setMsg('Câu hỏi cần có chữ hoặc ảnh');
      return;
    }
    setBusy(true);
    setMsg('');
    try {
      let imageUrl;
      if (file) {
        const b = await upload(`questions/${crypto.randomUUID()}/${safe(file.name)}`, file, {
          access: 'public',
          handleUploadUrl: '/api/upload',
          clientPayload: JSON.stringify({ kind: 'question' }),
        });
        imageUrl = b.url;
      }
      const r = await fetch(
        initial ? `/api/quizzes/${quizId}/questions/${initial.id}` : `/api/quizzes/${quizId}/questions`,
        {
          method: initial ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, opts, correct, imageUrl, removeImage }),
        }
      );
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'Lưu thất bại');
      onDone(!initial);
    } catch (x) {
      setMsg(x.message);
      setBusy(false);
    }
  }

  return (
    <form className="card" onSubmit={submit}>
      <strong>{initial ? 'Sửa câu hỏi' : 'Thêm câu hỏi'}</strong>
      <label htmlFor="qtext">Nội dung câu hỏi (có thể để trống nếu có ảnh)</label>
      <textarea id="qtext" rows={4} value={text} onChange={(e) => setText(e.target.value)} />

      <label htmlFor="qimg">Ảnh câu hỏi (không bắt buộc)</label>
      {initial?.imageUrl && !removeImage && !file && <img className="thumb" src={initial.imageUrl} alt="Ảnh hiện tại" />}
      <input id="qimg" type="file" accept={IMAGE_EXT.join(',')} onChange={pick} disabled={busy} />
      {initial?.imageUrl && (
        <label style={{ fontWeight: 400 }}>
          <input type="checkbox" style={{ width: 'auto', marginRight: 6 }} checked={removeImage} onChange={(e) => setRemoveImage(e.target.checked)} />
          Xóa ảnh hiện tại
        </label>
      )}

      <label>Các đáp án (chọn nút tròn ở đáp án đúng; chữ của đáp án có thể để trống nếu đáp án nằm trong ảnh)</label>
      {LETTERS.map((L, i) => (
        <div className="opt-in" key={L}>
          <input type="radio" name="correct" checked={correct === L} onChange={() => setCorrect(L)} aria-label={`Đáp án đúng là ${L}`} />
          <strong>{L}</strong>
          <input value={opts[i]} onChange={(e) => setOpts(opts.map((o, k) => (k === i ? e.target.value : o)))} maxLength={500} />
        </div>
      ))}

      {msg && <p className="err">{msg}</p>}
      <div className="row" style={{ marginTop: 10 }}>
        <button disabled={busy}>{busy ? 'Đang lưu...' : initial ? 'Lưu thay đổi' : 'Lưu câu hỏi'}</button>
        <button type="button" className="ghost" onClick={onCancel} disabled={busy}>{initial ? 'Hủy' : 'Đóng'}</button>
      </div>
    </form>
  );
}
