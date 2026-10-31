import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';

// Kiểm tra quyền rồi chuyển hướng sang link tải của Blob (link có chuỗi ngẫu nhiên, không đoán được).
export async function GET(_req, { params }) {
  const session = await getSession();
  if (!session) return new NextResponse('Chưa đăng nhập', { status: 401 });
  const id = Number(params.id);
  if (!Number.isInteger(id)) return new NextResponse('Không hợp lệ', { status: 400 });
  const sql = await db();

  let url = null;
  if (params.kind === 'statement') {
    const r = await sql`SELECT doc_url FROM assignments WHERE id = ${id}`;
    url = r[0]?.doc_url;
  } else if (params.kind === 'file') {
    const r = await sql`
      SELECT f.url, s.username FROM submission_files f
      JOIN submissions s ON s.id = f.submission_id
      WHERE f.id = ${id}`;
    if (r[0] && (session.isAdmin || r[0].username === session.username)) url = r[0].url;
  }
  if (!url) return new NextResponse('Không tìm thấy', { status: 404 });

  const res = NextResponse.redirect(`${url}?download=1`);
  res.headers.set('Cache-Control', 'no-store');
  return res;
}
