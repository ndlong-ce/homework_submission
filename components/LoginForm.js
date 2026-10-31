'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const router = useRouter();
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      const r = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'Đăng nhập thất bại');
      router.push('/assignments');
      router.refresh();
    } catch (x) {
      setErr(x.message);
      setBusy(false);
    }
  }

  return (
    <form className="login" onSubmit={submit}>
      <h1>Đăng nhập</h1>
      <label htmlFor="u">Tài khoản</label>
      <input id="u" value={u} onChange={(e) => setU(e.target.value)} autoComplete="username" required />
      <label htmlFor="p">Mật khẩu</label>
      <input id="p" type="password" value={p} onChange={(e) => setP(e.target.value)} autoComplete="current-password" required />
      {err && <p className="err">{err}</p>}
      <p>
        <button disabled={busy}>{busy ? 'Đang đăng nhập...' : 'Đăng nhập'}</button>
      </p>
    </form>
  );
}
