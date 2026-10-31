'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { upload } from '@vercel/blob/client';
import { ALLOWED_EXT, MAX_SIZE, MAX_FILES, extOf, safe, fmtSize } from '@/lib/util';

function validate(list) {
  if (list.length < 1) return 'Chưa chọn file nào';
  if (list.length > MAX_FILES) return `Tối đa ${MAX_FILES} file mỗi lần nộp`;
  for (const f of list) {
    if (!ALLOWED_EXT.includes(extOf(f.name))) return `"${f.name}" không đúng định dạng (${ALLOWED_EXT.join(' ')})`;
    if (f.size > MAX_SIZE) return `"${f.name}" vượt quá ${MAX_SIZE / 1024 / 1024}MB`;
    if (f.size === 0) return `"${f.name}" là file rỗng`;
  }
  return '';
}

export default function SubmitBox({ assignmentId, username, willBeLate, hasSubmission }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState([]);
  const [msg, setMsg] = useState('');
  const [isErr, setIsErr] = useState(false);
  const [busy, setBusy] = useState(false);

  function pick(e) {
    const list = [...e.target.files];
    const err = validate(list);
    setMsg(err);
    setIsErr(!!err);
    setFiles(err ? [] : list);
  }

  async function send() {
    const err = validate(files);
    if (err) {
      setMsg(err);
      setIsErr(true);
      return;
    }
    setBusy(true);
    setMsg('Đang tải lên...');
    setIsErr(false);
    try {
      const uploaded = [];
      for (const f of files) {
        const path = `submissions/${assignmentId}/${safe(username)}/${crypto.randomUUID()}/${safe(f.name)}`;
        const b = await upload(path, f, {
          access: 'public',
          handleUploadUrl: '/api/upload',
          clientPayload: JSON.stringify({ kind: 'submission', assignmentId }),
        });
        uploaded.push({ name: f.name, url: b.url, size: f.size });
      }
      const r = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId, files: uploaded }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'Nộp bài thất bại');
      setMsg(j.late ? 'Đã nộp bài (bị đánh dấu nộp trễ).' : 'Đã nộp bài.');
      setFiles([]);
      setOpen(false);
      router.refresh();
    } catch (x) {
      setMsg(x.message);
      setIsErr(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {!open && <button onClick={() => setOpen(true)}>{hasSubmission ? 'Nộp lại' : 'Nộp bài'}</button>}
      {open && (
        <div className="card">
          <p className="muted" style={{ marginTop: 0 }}>
            Chọn 1 hoặc nhiều file ({ALLOWED_EXT.join(', ')}; tối đa {MAX_FILES} file, mỗi file ≤ {MAX_SIZE / 1024 / 1024}MB).
            {hasSubmission && ' Nộp lại sẽ thay thế toàn bộ file đã nộp trước đó.'}
            {willBeLate && ' Đã quá hạn: bài nộp sẽ bị đánh dấu trễ.'}
          </p>
          <input type="file" multiple accept={ALLOWED_EXT.join(',')} onChange={pick} disabled={busy} />
          {files.length > 0 && (
            <ul className="files">
              {files.map((f) => (
                <li key={f.name + f.size}>
                  {f.name} <span className="muted">({fmtSize(f.size)})</span>
                </li>
              ))}
            </ul>
          )}
          <div className="row" style={{ marginTop: 12 }}>
            <button onClick={send} disabled={busy || files.length === 0}>
              {busy ? 'Đang gửi...' : 'Gửi bài'}
            </button>
            <button className="ghost" onClick={() => { setOpen(false); setFiles([]); setMsg(''); }} disabled={busy}>
              Hủy
            </button>
          </div>
        </div>
      )}
      {msg && <p className={isErr ? 'err' : 'muted'}>{msg}</p>}
    </div>
  );
}
