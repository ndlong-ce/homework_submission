import { NextResponse } from 'next/server';
import { getAccounts, createSession, safeEqual } from '@/lib/auth';

export async function POST(req) {
  const b = await req.json().catch(() => ({}));
  const username = String(b.username || '').trim();
  const password = String(b.password || '').trim();
  const acc = getAccounts().find((a) => a.username === username);
  if (!acc || !safeEqual(acc.password, password)) {
    return NextResponse.json({ error: 'Sai tài khoản hoặc mật khẩu' }, { status: 401 });
  }
  await createSession(acc.username);
  return NextResponse.json({ ok: true });
}
