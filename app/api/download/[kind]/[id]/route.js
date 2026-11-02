import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { safe } from '@/lib/util';

// Tải bài làm dạng text về máy: /api/download/text/<id bài nộp>
export async function GET(_req, { params }) {
  const session = await getSession();
  if (!session) return new NextResponse('Chưa đăng nhập', { status: 401 });
  const id = Number(params.id);
  if (params.kind !== 'text' || !Number.isInteger(id)) return new NextResponse('Không hợp lệ', { status: 400 });

  const sql = await db();
  const r = (await sql`SELECT content, username, assignment_id FROM submissions WHERE id = ${id}`)[0];
  if (!r || !(session.isAdmin || r.username === session.username)) {
    return new NextResponse('Không tìm thấy', { status: 404 });
  }
  return new NextResponse(r.content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': `attachment; filename="${safe(r.username)}_bai${r.assignment_id}.txt"`,
      'Cache-Control': 'no-store',
    },
  });
}
