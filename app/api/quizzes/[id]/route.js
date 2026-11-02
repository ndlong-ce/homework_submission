import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';

export async function PUT(req, { params }) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
  const id = Number(params.id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: 'Không hợp lệ' }, { status: 400 });
  const b = await req.json().catch(() => ({}));

  const title = b.title === undefined ? null : String(b.title).trim().slice(0, 200);
  if (title === '') return NextResponse.json({ error: 'Thiếu tên bài trắc nghiệm' }, { status: 400 });
  const isOpen = typeof b.isOpen === 'boolean' ? b.isOpen : null;
  const maxAttempts = b.maxAttempts === undefined ? null : Number(b.maxAttempts);
  if (maxAttempts !== null && (!Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 100)) {
    return NextResponse.json({ error: 'Số lần làm tối đa phải là số nguyên từ 1 đến 100' }, { status: 400 });
  }

  const sql = await db();
  await sql`
    UPDATE quizzes SET
      title = COALESCE(${title}::text, title),
      is_open = COALESCE(${isOpen}::boolean, is_open),
      max_attempts = COALESCE(${maxAttempts}::int, max_attempts)
    WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req, { params }) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
  const id = Number(params.id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: 'Không hợp lệ' }, { status: 400 });
  const sql = await db();
  await sql`DELETE FROM quizzes WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
