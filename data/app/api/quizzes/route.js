import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(req) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const title = String(b.title || '').trim().slice(0, 200);
  if (!title) return NextResponse.json({ error: 'Thiếu tên bài trắc nghiệm' }, { status: 400 });
  const sql = await db();
  const r = await sql`INSERT INTO quizzes (title) VALUES (${title}) RETURNING id`;
  return NextResponse.json({ id: r[0].id });
}
