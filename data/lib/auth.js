import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SignJWT, jwtVerify } from 'jose';
import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const COOKIE = 'session';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 ngày

let _accounts = null;

// Đọc data/account.xlsx: cột A = tài khoản, cột B = mật khẩu, không có hàng tiêu đề.
// Hàng 1 là admin.
export function getAccounts() {
  if (_accounts) return _accounts;
  const file = path.join(process.cwd(), 'data', 'account.xlsx');
  const wb = XLSX.read(fs.readFileSync(file), { type: 'buffer' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: true });
  _accounts = rows
    .map((r) => ({ username: String(r[0] ?? '').trim(), password: String(r[1] ?? '').trim() }))
    .filter((a) => a.username && a.password);
  return _accounts;
}

export function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

const key = () => new TextEncoder().encode(process.env.SESSION_SECRET || '');

export async function createSession(username) {
  const token = await new SignJWT({ u: username })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(key());
  cookies().set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export function destroySession() {
  cookies().delete(COOKIE);
}

export async function getSession() {
  const t = cookies().get(COOKIE)?.value;
  if (!t) return null;
  try {
    const { payload } = await jwtVerify(t, key());
    const accounts = getAccounts();
    const acc = accounts.find((a) => a.username === payload.u);
    if (!acc) return null;
    return { username: acc.username, isAdmin: acc.username === accounts[0].username };
  } catch {
    return null;
  }
}

export async function requireSession() {
  const s = await getSession();
  if (!s) redirect('/');
  return s;
}

export async function requireAdmin() {
  const s = await requireSession();
  if (!s.isAdmin) redirect('/assignments');
  return s;
}
